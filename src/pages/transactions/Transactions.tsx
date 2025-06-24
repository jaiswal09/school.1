import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RepeatIcon, 
  Search, 
  Filter, 
  Calendar,
  Package,
  User,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  Download,
  RotateCcw,
  Eye,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '../../hooks/useTransactions';
import { useCheckout } from '../../hooks/useCheckout';
import { Transaction } from '../../lib/supabase';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Transactions: React.FC = () => {
  const { transactions, loading, error } = useTransactions();
  const { returnItem } = useCheckout();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [sortField, setSortField] = useState<keyof Transaction>('checkout_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLostDamageModal, setShowLostDamageModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [lostDamageLoading, setLostDamageLoading] = useState(false);
  const [lostDamageNotes, setLostDamageNotes] = useState('');

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleReturn = async (transaction: any) => {
    setReturnLoading(true);
    try {
      const { error } = await returnItem(transaction.id);
      if (!error) {
        setShowReturnModal(false);
        setSelectedTransaction(null);
        toast.success('Item returned successfully');
      }
    } catch (error) {
      toast.error('Failed to return item');
    } finally {
      setReturnLoading(false);
    }
  };

  // NEW FEATURE: Handle lost/damaged items
  const handleLostDamage = async () => {
    if (!selectedTransaction) return;
    
    setLostDamageLoading(true);
    try {
      // Update transaction status to lost
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({
          status: 'lost',
          notes: lostDamageNotes || 'Item marked as lost/damaged',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.id);

      if (transactionError) throw transactionError;

      // Decrease item quantity in inventory
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('quantity')
        .eq('id', selectedTransaction.item_id)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = Math.max(0, currentItem.quantity - selectedTransaction.quantity);
      
      const { error: updateError } = await supabase
        .from('items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.item_id);

      if (updateError) throw updateError;

      setShowLostDamageModal(false);
      setSelectedTransaction(null);
      setLostDamageNotes('');
      toast.success('Item marked as lost/damaged and inventory updated');
    } catch (error) {
      console.error('Error marking item as lost/damaged:', error);
      toast.error('Failed to mark item as lost/damaged');
    } finally {
      setLostDamageLoading(false);
    }
  };

  const exportReport = () => {
    try {
      const csvData = filteredTransactions.map(transaction => ({
        'Transaction ID': transaction.id,
        'Item Name': (transaction as any).items?.name || 'Unknown Item',
        'User Name': (transaction as any).users?.full_name || 'Unknown User',
        'User Email': (transaction as any).users?.email || 'No email',
        'Quantity': transaction.quantity,
        'Checkout Date': format(new Date(transaction.checkout_date), 'yyyy-MM-dd HH:mm:ss'),
        'Expected Return Date': transaction.expected_return_date 
          ? format(new Date(transaction.expected_return_date), 'yyyy-MM-dd HH:mm:ss')
          : 'Not specified',
        'Actual Return Date': transaction.actual_return_date
          ? format(new Date(transaction.actual_return_date), 'yyyy-MM-dd HH:mm:ss')
          : 'Not returned',
        'Status': transaction.status,
        'Notes': transaction.notes || 'No notes'
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const filteredTransactions = transactions
    .filter(transaction => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (transaction as any).items?.name?.toLowerCase().includes(searchLower) ||
        (transaction as any).users?.full_name?.toLowerCase().includes(searchLower) ||
        (transaction as any).users?.email?.toLowerCase().includes(searchLower) ||
        (transaction.notes || '').toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = !selectedStatus || transaction.status === selectedStatus;

      // Date range filter
      const transactionDate = new Date(transaction.checkout_date);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let matchesDateRange = true;
      if (dateRange === 'today') {
        matchesDateRange = transactionDate.toDateString() === today.toDateString();
      } else if (dateRange === 'week') {
        matchesDateRange = transactionDate >= weekAgo;
      } else if (dateRange === 'month') {
        matchesDateRange = transactionDate >= monthAgo;
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (!aValue || !bValue) return 0;
      
      const comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Transactions</h1>
          <p className="text-neutral-500">Track and manage item checkouts and returns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="btn btn-outline"
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          <button 
            onClick={exportReport}
            className="btn btn-primary"
          >
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {filtersVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 border-b border-neutral-200 bg-neutral-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="returned">Returned</option>
                  <option value="overdue">Overdue</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label htmlFor="date-range" className="block text-sm font-medium text-neutral-700 mb-1">
                  Date Range
                </label>
                <select
                  id="date-range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('');
                    setDateRange('all');
                  }}
                  className="btn btn-outline w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-500">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error-600">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <RepeatIcon size={32} className="mx-auto mb-2" />
              <p>No transactions found</p>
              {(searchQuery || selectedStatus || dateRange !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('');
                    setDateRange('all');
                  }}
                  className="btn btn-outline mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <motion.table
              className="min-w-full divide-y divide-neutral-200"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    User
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('checkout_date')}
                  >
                    <div className="flex items-center">
                      <span>Date</span>
                      <button className="ml-1 text-neutral-400">
                        {sortField === 'checkout_date' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </button>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Return Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredTransactions.map((transaction: any) => (
                  <motion.tr
                    key={transaction.id}
                    variants={itemVariants}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
                          <Package size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-neutral-800">
                            {transaction.items?.name || 'Unknown Item'}
                          </div>
                          <div className="text-sm text-neutral-500">
                            ID: {transaction.item_id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                          <User size={16} />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-neutral-800">
                            {transaction.users?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {transaction.users?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-neutral-800">
                          {format(new Date(transaction.checkout_date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-neutral-500">
                          {format(new Date(transaction.checkout_date), 'h:mm a')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-neutral-800 font-medium">
                        {transaction.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${transaction.status === 'checked_out' ? 'bg-primary-100 text-primary-800' :
                          transaction.status === 'returned' ? 'bg-success-100 text-success-800' :
                          transaction.status === 'overdue' ? 'bg-error-100 text-error-800' :
                          transaction.status === 'lost' ? 'bg-neutral-100 text-neutral-800' :
                          'bg-neutral-100 text-neutral-800'}`}
                      >
                        {transaction.status === 'checked_out' && <Clock size={12} className="mr-1" />}
                        {transaction.status === 'returned' && <CheckCircle size={12} className="mr-1" />}
                        {transaction.status === 'overdue' && <AlertTriangle size={12} className="mr-1" />}
                        {transaction.status.replace('_', ' ').charAt(0).toUpperCase() + 
                         transaction.status.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.expected_return_date ? (
                        <div className="text-sm">
                          <div className="font-medium text-neutral-800">
                            {format(new Date(transaction.expected_return_date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-neutral-500">
                            {format(new Date(transaction.expected_return_date), 'h:mm a')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-500">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {transaction.status === 'checked_out' && (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowReturnModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-900"
                              title="Return Item"
                            >
                              <RotateCcw size={16} />
                            </button>
                            {/* NEW FEATURE: Lost/Damage Button */}
                            <button 
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowLostDamageModal(true);
                              }}
                              className="text-error-600 hover:text-error-900"
                              title="Mark as Lost/Damaged"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowDetailsModal(true);
                          }}
                          className="text-neutral-600 hover:text-neutral-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          )}
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Return Item</h2>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to return "{selectedTransaction.items?.name}"?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReturn(selectedTransaction)}
                  disabled={returnLoading}
                  className="btn btn-primary"
                >
                  {returnLoading ? 'Returning...' : 'Return Item'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* NEW FEATURE: Lost/Damage Modal */}
      {showLostDamageModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Mark Item as Lost/Damaged</h2>
              <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
                <p className="text-error-700 text-sm">
                  <AlertTriangle size={16} className="inline mr-2" />
                  This action will decrease the inventory quantity and cannot be undone.
                </p>
              </div>
              <p className="text-neutral-600 mb-4">
                Item: <strong>"{selectedTransaction.items?.name}"</strong>
              </p>
              <p className="text-neutral-600 mb-4">
                Quantity to be removed: <strong>{selectedTransaction.quantity}</strong>
              </p>
              
              <div className="mb-6">
                <label htmlFor="lostDamageNotes" className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  id="lostDamageNotes"
                  value={lostDamageNotes}
                  onChange={(e) => setLostDamageNotes(e.target.value)}
                  className="input w-full h-24"
                  placeholder="Describe what happened to the item..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowLostDamageModal(false);
                    setSelectedTransaction(null);
                    setLostDamageNotes('');
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLostDamage}
                  disabled={lostDamageLoading}
                  className="btn bg-error-600 text-white hover:bg-error-700"
                >
                  {lostDamageLoading ? 'Processing...' : 'Mark as Lost/Damaged'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Transaction Details</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Item</label>
                  <p className="text-neutral-800">{selectedTransaction.items?.name || 'Unknown Item'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500">User</label>
                  <p className="text-neutral-800">{selectedTransaction.users?.full_name || 'Unknown User'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Quantity</label>
                  <p className="text-neutral-800">{selectedTransaction.quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Status</label>
                  <p className="text-neutral-800 capitalize">{selectedTransaction.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Checkout Date</label>
                  <p className="text-neutral-800">
                    {format(new Date(selectedTransaction.checkout_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500">Expected Return</label>
                  <p className="text-neutral-800">
                    {selectedTransaction.expected_return_date 
                      ? format(new Date(selectedTransaction.expected_return_date), 'MMM d, yyyy h:mm a')
                      : 'Not specified'
                    }
                  </p>
                </div>
                {selectedTransaction.actual_return_date && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-neutral-500">Actual Return Date</label>
                    <p className="text-neutral-800">
                      {format(new Date(selectedTransaction.actual_return_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}
                {selectedTransaction.notes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-neutral-500">Notes</label>
                    <p className="text-neutral-800">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Transactions;