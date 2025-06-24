import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Server, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpDown, 
  ArrowDown, 
  ArrowUp,
  X,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { useResources } from '../../hooks/useResources';
import { Resource, ResourceType } from '../../lib/supabase';
import { format } from 'date-fns';

const Resources: React.FC = () => {
  const { resources, loading, error } = useResources();
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResourceType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'available' | 'in_use' | 'maintenance' | 'unavailable' | ''>('');
  const [sortField, setSortField] = useState<keyof Resource>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersVisible, setFiltersVisible] = useState(false);

  const resourceTypes: ResourceType[] = ['room', 'lab', 'equipment', 'device', 'other'];

  // Filter and sort resources
  React.useEffect(() => {
    if (!resources) return;

    let result = [...resources];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        resource => 
          resource.name.toLowerCase().includes(query) || 
          resource.description?.toLowerCase().includes(query) ||
          resource.location.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter(resource => resource.type === selectedType);
    }

    // Apply status filter
    if (selectedStatus) {
      result = result.filter(resource => resource.status === selectedStatus);
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

    setFilteredResources(result);
  }, [resources, searchQuery, selectedType, selectedStatus, sortField, sortDirection]);

  const handleSort = (field: keyof Resource) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
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
          <h1 className="text-2xl font-bold text-neutral-800">Resources</h1>
          <p className="text-neutral-500">Manage and schedule shared resources</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="btn btn-outline"
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          <Link to="/dashboard/resources/add" className="btn btn-primary">
            <Plus size={16} className="mr-2" />
            Add Resource
          </Link>
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
              placeholder="Search resources..."
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
                <label htmlFor="type-filter" className="block text-sm font-medium text-neutral-700 mb-1">
                  Type
                </label>
                <select
                  id="type-filter"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ResourceType | '')}
                  className="input w-full"
                >
                  <option value="">All Types</option>
                  {resourceTypes.map((type) => (
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
                  onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
                  className="input w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
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
        
        {/* Resources Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-500">Loading resources...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error-600">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Server size={32} className="mx-auto mb-2" />
              <p>No resources found</p>
              {(searchQuery || selectedType || selectedStatus) && (
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
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
                {filteredResources.map((resource) => (
                  <motion.tr 
                    key={resource.id} 
                    variants={itemVariants}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
                          {resource.type === 'room' ? (
                            <MapPin size={20} />
                          ) : resource.type === 'lab' ? (
                            <Server size={20} />
                          ) : resource.type === 'equipment' ? (
                            <Server size={20} />
                          ) : resource.type === 'device' ? (
                            <Server size={20} />
                          ) : (
                            <Server size={20} />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-neutral-800">{resource.name}</div>
                          <div className="text-sm text-neutral-500 capitalize">{resource.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize">{resource.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {resource.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${resource.status === 'available' ? 'bg-success-100 text-success-800' :
                          resource.status === 'in_use' ? 'bg-primary-100 text-primary-800' :
                          resource.status === 'maintenance' ? 'bg-warning-100 text-warning-800' :
                          resource.status === 'unavailable' ? 'bg-error-100 text-error-800' : ''
                        }`}
                      >
                        {resource.status === 'available' && <CheckCircle size={12} className="mr-1" />}
                        {resource.status === 'maintenance' && <AlertTriangle size={12} className="mr-1" />}
                        {resource.status.replace('_', ' ').charAt(0).toUpperCase() + resource.status.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/dashboard/resources/${resource.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        to={`/dashboard/resources/${resource.id}/edit`}
                        className="text-secondary-600 hover:text-secondary-900"
                      >
                        Edit
                      </Link>
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

export default Resources;