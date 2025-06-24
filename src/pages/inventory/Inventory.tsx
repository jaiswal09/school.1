import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpDown, 
  ArrowDown, 
  ArrowUp,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';
import { Item, ItemType, ItemStatus } from '../../lib/supabase';

const Inventory: React.FC = () => {
  const { items, categories, loading, error, fetchItems } = useInventory();
  const { userDetails } = useAuth();
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ItemType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | ''>('');
  const [sortField, setSortField] = useState<keyof Item>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersVisible, setFiltersVisible] = useState(false);

  const itemTypes: ItemType[] = ['equipment', 'supply', 'textbook', 'digital', 'furniture', 'other'];
  const itemStatuses: ItemStatus[] = ['available', 'in_use', 'maintenance', 'lost', 'expired'];

  // Check if user can add items (admin/staff only)
  const canAddItems = userDetails?.role && ['admin', 'staff'].includes(userDetails.role);

  // Filter and sort items when dependencies change
  useEffect(() => {
    if (!items) return;

    let result = [...items];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(query) || 
          item.description?.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(item => item.category_id === selectedCategory);
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter(item => item.type === selectedType);
    }

    // Apply status filter
    if (selectedStatus) {
      result = result.filter(item => item.status === selectedStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (aValue > bValue ? -1 : 1);
    });

    setFilteredItems(result);
  }, [items, searchQuery, selectedCategory, selectedType, selectedStatus, sortField, sortDirection]);

  const handleSort = (field: keyof Item) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedStatus('');
    setSortField('name');
    setSortDirection('asc');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
          <h1 className="text-2xl font-bold text-neutral-800">Inventory</h1>
          <p className="text-neutral-500">Manage your inventory items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="btn btn-outline"
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          {canAddItems && (
            <Link to="/dashboard/inventory/add" className="btn btn-primary">
              <Plus size={16} className="mr-2" />
              Add Item
            </Link>
          )}
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search inventory..."
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-neutral-700 mb-1">
                  Type
                </label>
                <select
                  id="type-filter"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ItemType | '')}
                  className="input w-full"
                >
                  <option value="">All Types</option>
                  {itemTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ItemStatus | '')}
                  className="input w-full"
                >
                  <option value="">All Statuses</option>
                  {itemStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="btn btn-outline w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Inventory Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-500">Loading inventory items...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error-600">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Package size={32} className="mx-auto mb-2" />
              <p>No inventory items found</p>
              {(searchQuery || selectedCategory || selectedType || selectedStatus) && (
                <button
                  onClick={resetFilters}
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
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>Name</span>
                      <button className="ml-1 text-neutral-400">
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </button>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center">
                      <span>Quantity</span>
                      <button className="ml-1 text-neutral-400">
                        {sortField === 'quantity' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </button>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredItems.map((item) => (
                  <motion.tr 
                    key={item.id} 
                    variants={itemVariants}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
                          <Package size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-neutral-800">{item.name}</div>
                          <div className="text-sm text-neutral-500 capitalize">{item.type.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-neutral-800">
                        {item.quantity}
                        {item.quantity <= item.min_quantity && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500">Min: {item.min_quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {categories.find(c => c.id === item.category_id)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${item.status === 'available' ? 'bg-success-100 text-success-800' :
                          item.status === 'in_use' ? 'bg-primary-100 text-primary-800' :
                          item.status === 'maintenance' ? 'bg-warning-100 text-warning-800' :
                          item.status === 'lost' ? 'bg-error-100 text-error-800' :
                          item.status === 'expired' ? 'bg-neutral-100 text-neutral-800' : ''
                        }`}
                      >
                        {item.status === 'available' && <CheckCircle size={12} className="mr-1" />}
                        {item.status === 'maintenance' && <AlertTriangle size={12} className="mr-1" />}
                        {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/dashboard/inventory/${item.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </Link>
                      {canAddItems && (
                        <Link
                          to={`/dashboard/inventory/${item.id}/edit`}
                          className="text-secondary-600 hover:text-secondary-900"
                        >
                          Edit
                        </Link>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;