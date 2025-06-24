import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Mail,
  Calendar,
  Building2,
  Shield,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  X
} from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { RoleType } from '../../lib/supabase';
import { format } from 'date-fns';

const Users: React.FC = () => {
  const { users, loading, error } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType | ''>('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortField, setSortField] = useState<'full_name' | 'email' | 'created_at'>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Get unique departments
  const departments = [...new Set(users.map(user => user.department).filter(Boolean))];

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === '' || user.role === selectedRole;
      const matchesDepartment = selectedDepartment === '' || user.department === selectedDepartment;
      return matchesSearch && matchesRole && matchesDepartment;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (!aValue || !bValue) return 0;
      
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'full_name' | 'email' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
          <h1 className="text-2xl font-bold text-neutral-800">Users</h1>
          <p className="text-neutral-500">Manage system users and permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="btn btn-outline"
          >
            <Filter size={16} className="mr-2" />
            Filters
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
              placeholder="Search users..."
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
                <label htmlFor="role-filter" className="block text-sm font-medium text-neutral-700 mb-1">
                  Role
                </label>
                <select
                  id="role-filter"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleType | '')}
                  className="input w-full"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div>
                <label htmlFor="department-filter" className="block text-sm font-medium text-neutral-700 mb-1">
                  Department
                </label>
                <select
                  id="department-filter"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRole('');
                    setSelectedDepartment('');
                  }}
                  className="btn btn-outline w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-500">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error-600">
              <p>{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <UsersIcon size={32} className="mx-auto mb-2" />
              <p>No users found</p>
              {(searchQuery || selectedRole || selectedDepartment) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRole('');
                    setSelectedDepartment('');
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
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center">
                      <span>Name</span>
                      <button className="ml-1 text-neutral-400">
                        {sortField === 'full_name' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </button>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    variants={itemVariants}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-neutral-800">{user.full_name}</div>
                          <div className="text-sm text-neutral-500 capitalize">{user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-neutral-800">
                        <Mail size={16} className="mr-2 text-neutral-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.role === 'admin' ? 'bg-primary-100 text-primary-800' :
                          user.role === 'staff' ? 'bg-success-100 text-success-800' :
                          user.role === 'teacher' ? 'bg-warning-100 text-warning-800' :
                          'bg-neutral-100 text-neutral-800'}`}
                      >
                        <Shield size={12} className="mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-neutral-800">
                        <Building2 size={16} className="mr-2 text-neutral-400" />
                        {user.department || 'Not assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-neutral-800">
                        <Calendar size={16} className="mr-2 text-neutral-400" />
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/dashboard/users/${user.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </Link>
                      <button className="text-neutral-600 hover:text-neutral-900">
                        Edit
                      </button>
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

export default Users;