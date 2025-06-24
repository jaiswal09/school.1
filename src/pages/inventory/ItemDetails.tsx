import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Tag, 
  Truck, 
  PenTool as Tool, 
  AlertTriangle, 
  Clock, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  QrCode, 
  History,
  Download,
  Printer,
  ShoppingCart,
  Wrench,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { useInventory } from '../../hooks/useInventory';
import { useTransactions } from '../../hooks/useTransactions';
import { useCheckout } from '../../hooks/useCheckout';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useAuth } from '../../contexts/AuthContext';
import { Item, Transaction } from '../../lib/supabase';
import { generateQRCode, downloadQRCode, printQRCode } from '../../lib/qrcode';
import toast from 'react-hot-toast';

const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const { getItemById, categories, deleteItem, updateItem } = useInventory();
  const { transactions } = useTransactions();
  const { checkoutItem, returnItem } = useCheckout();
  const { scheduleMaintenance, getMaintenanceRecords } = useMaintenance();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemTransactions, setItemTransactions] = useState<Transaction[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Form states
  const [checkoutForm, setCheckoutForm] = useState({
    quantity: 1,
    expectedReturnDate: '',
    notes: ''
  });
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceDate: '',
    description: '',
    cost: '',
    nextMaintenanceDate: ''
  });

  // Check permissions
  const canEdit = userDetails?.role && ['admin', 'staff'].includes(userDetails.role);

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!id) return;

      try {
        const { data, error } = await getItemById(id);
        if (error) throw error;
        setItem(data);

        // Filter transactions for this item
        const itemTxns = transactions.filter(t => t.item_id === id);
        setItemTransactions(itemTxns);

        // Get maintenance records
        const { data: maintenance } = await getMaintenanceRecords(id);
        setMaintenanceRecords(maintenance || []);

        // Generate QR code if item exists
        if (data) {
          const qrData = JSON.stringify({
            id: data.id,
            name: data.name,
            type: data.type,
            location: data.location
          });
          const qrUrl = await generateQRCode(qrData);
          setQrCodeUrl(qrUrl);
          
          // Update item with QR code if not already set
          if (!data.qr_code) {
            await updateItem(data.id, { qr_code: qrUrl });
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id, getItemById, transactions, getMaintenanceRecords, updateItem]);

  const handleDeleteItem = async () => {
    if (!item || !canEdit) return;
    
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      const { error } = await deleteItem(item.id);
      if (!error) {
        navigate('/dashboard/inventory');
      }
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !userDetails) return;

    const { error } = await checkoutItem(
      item.id,
      checkoutForm.quantity,
      checkoutForm.expectedReturnDate || undefined,
      checkoutForm.notes || undefined
    );

    if (!error) {
      setShowCheckoutModal(false);
      setCheckoutForm({ quantity: 1, expectedReturnDate: '', notes: '' });
      // Refresh item data
      const { data } = await getItemById(item.id);
      if (data) setItem(data);
    }
  };

  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !canEdit) return;

    const { error } = await scheduleMaintenance(
      item.id,
      maintenanceForm.maintenanceDate,
      maintenanceForm.description,
      maintenanceForm.cost ? Number(maintenanceForm.cost) : undefined,
      maintenanceForm.nextMaintenanceDate || undefined
    );

    if (!error) {
      setShowMaintenanceModal(false);
      setMaintenanceForm({ maintenanceDate: '', description: '', cost: '', nextMaintenanceDate: '' });
      // Refresh maintenance records
      const { data: maintenance } = await getMaintenanceRecords(item.id);
      setMaintenanceRecords(maintenance || []);
    }
  };

  const handleReturn = async (transactionId: string) => {
    const { error } = await returnItem(transactionId);
    if (!error) {
      setShowReturnModal(false);
      setSelectedTransaction(null);
      // Refresh item data
      if (item) {
        const { data } = await getItemById(item.id);
        if (data) setItem(data);
      }
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl && item) {
      downloadQRCode(qrCodeUrl, `${item.name}-qr-code.png`);
    }
  };

  const handlePrintLabel = () => {
    if (qrCodeUrl) {
      printQRCode(qrCodeUrl);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-500">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Error Loading Item</h2>
        <p className="text-neutral-500">{error || 'Item not found'}</p>
        <button
          onClick={() => navigate('/dashboard/inventory')}
          className="mt-4 btn btn-outline"
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/inventory')}
            className="btn btn-ghost"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{item.name}</h1>
            <p className="text-neutral-500">Item Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {canEdit && (
            <>
              <button
                onClick={() => navigate(`/dashboard/inventory/${id}/edit`)}
                className="btn btn-outline"
              >
                <Edit3 size={16} className="mr-2" />
                Edit
              </button>
              <button 
                onClick={handleDeleteItem}
                className="btn bg-error-600 text-white hover:bg-error-700"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                  <Package size={24} />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-neutral-800">{item.name}</h2>
                  <p className="text-neutral-500">
                    {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'} • 
                    <span className="capitalize ml-1">{item.type.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${item.status === 'available' ? 'bg-success-100 text-success-800' :
                  item.status === 'in_use' ? 'bg-primary-100 text-primary-800' :
                  item.status === 'maintenance' ? 'bg-warning-100 text-warning-800' :
                  item.status === 'lost' ? 'bg-error-100 text-error-800' :
                  'bg-neutral-100 text-neutral-800'}`}
              >
                {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Description</h3>
                <p className="text-neutral-800">
                  {item.description || 'No description provided'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Location</h3>
                <div className="flex items-center text-neutral-800">
                  <MapPin size={16} className="mr-2 text-neutral-400" />
                  {item.location}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Quantity</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-neutral-800">{item.quantity}</span>
                  {item.quantity <= item.min_quantity && (
                    <span className="text-sm text-error-600 flex items-center">
                      <AlertTriangle size={14} className="mr-1" />
                      Low Stock
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  Minimum quantity: {item.min_quantity}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Cost</h3>
                <div className="flex items-center text-neutral-800">
                  <DollarSign size={16} className="mr-1 text-neutral-400" />
                  {item.cost ? `$${item.cost.toFixed(2)}` : 'N/A'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200"
          >
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">Transaction History</h3>
                <span className="text-sm text-neutral-500">
                  {itemTransactions.length} transactions
                </span>
              </div>
            </div>

            <div className="divide-y divide-neutral-200">
              {itemTransactions.length === 0 ? (
                <div className="p-6 text-center text-neutral-500">
                  No transactions found for this item
                </div>
              ) : (
                itemTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="p-4 hover:bg-neutral-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-800">
                          {transaction.users?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Quantity: {transaction.quantity} • 
                          {transaction.status === 'checked_out' ? (
                            <span className="text-primary-600 ml-1">Checked out</span>
                          ) : transaction.status === 'returned' ? (
                            <span className="text-success-600 ml-1">Returned</span>
                          ) : transaction.status === 'overdue' ? (
                            <span className="text-error-600 ml-1">Overdue</span>
                          ) : (
                            <span className="text-neutral-600 ml-1">{transaction.status}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(transaction.checkout_date), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(transaction.checkout_date), 'h:mm a')}
                          </p>
                        </div>
                        {transaction.status === 'checked_out' && (
                          <button
                            onClick={() => handleReturn(transaction.id)}
                            className="btn btn-sm btn-outline"
                          >
                            <RotateCcw size={14} className="mr-1" />
                            Return
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">QR Code</h3>
              <QrCode size={20} className="text-neutral-400" />
            </div>
            
            {qrCodeUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={qrCodeUrl}
                  alt="Item QR Code"
                  className="w-48 h-48 object-contain mb-4 border rounded-lg"
                />
                <div className="flex space-x-2 w-full">
                  <button 
                    onClick={handleDownloadQR}
                    className="btn btn-outline flex-1"
                  >
                    <Download size={16} className="mr-1" />
                    Download
                  </button>
                  <button 
                    onClick={handlePrintLabel}
                    className="btn btn-outline flex-1"
                  >
                    <Printer size={16} className="mr-1" />
                    Print
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 mb-4">Generating QR code...</p>
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              </div>
            )}
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowCheckoutModal(true)}
                className="btn btn-primary w-full"
                disabled={item.quantity === 0 || item.status !== 'available'}
              >
                <ShoppingCart size={16} className="mr-2" />
                Checkout Item
              </button>
              
              {canEdit && (
                <button 
                  onClick={() => setShowMaintenanceModal(true)}
                  className="btn btn-secondary w-full"
                >
                  <Wrench size={16} className="mr-2" />
                  Schedule Maintenance
                </button>
              )}
              
              <button 
                onClick={handlePrintLabel}
                className="btn btn-outline w-full"
                disabled={!qrCodeUrl}
              >
                <Printer size={16} className="mr-2" />
                Print Label
              </button>
            </div>
          </motion.div>

          {/* Maintenance History Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Maintenance History</h3>
              <History size={20} className="text-neutral-400" />
            </div>
            
            <div className="space-y-3">
              {maintenanceRecords.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No maintenance records found</p>
              ) : (
                maintenanceRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="border-l-2 border-primary-200 pl-3">
                    <p className="text-sm font-medium text-neutral-800">
                      {format(new Date(record.maintenance_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-neutral-500">{record.description}</p>
                    <p className="text-xs text-neutral-400">By: {record.performed_by}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Checkout Item</h2>
              
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Quantity (Available: {item.quantity})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={item.quantity}
                    value={checkoutForm.quantity}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, quantity: Number(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="datetime-local"
                    value={checkoutForm.expectedReturnDate}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, expectedReturnDate: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                    className="input w-full h-24"
                    placeholder="Optional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Checkout
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Schedule Maintenance</h2>
              
              <form onSubmit={handleScheduleMaintenance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Maintenance Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={maintenanceForm.maintenanceDate}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceDate: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                    className="input w-full h-24"
                    placeholder="Describe the maintenance work..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Estimated Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Next Maintenance Date
                  </label>
                  <input
                    type="datetime-local"
                    value={maintenanceForm.nextMaintenanceDate}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextMaintenanceDate: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Schedule
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;