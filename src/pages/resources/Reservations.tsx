import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Search,
  Filter,
  Plus,
  Server,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { useResources } from '../../hooks/useResources';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Reservations: React.FC = () => {
  const { reservations, resources, loading, error, updateReservationStatus, fetchReservations } = useResources();
  const { userDetails } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Refresh reservations when component mounts
  useEffect(() => {
    fetchReservations();
  }, []);

  // Filter reservations based on search and status
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = searchQuery === '' || 
      (reservation as any).resources?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reservation as any).users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === '' || reservation.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (reservationId: string, newStatus: 'approved' | 'rejected' | 'cancelled' | 'completed') => {
    await updateReservationStatus(reservationId, newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'rejected':
        return 'bg-error-100 text-error-800';
      case 'completed':
        return 'bg-neutral-100 text-neutral-800';
      case 'cancelled':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={12} className="mr-1" />;
      case 'pending':
        return <Clock size={12} className="mr-1" />;
      case 'rejected':
        return <AlertTriangle size={12} className="mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Reservations</h1>
          <p className="text-neutral-500">Manage resource reservations and bookings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="btn btn-outline"
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          <Link to="/dashboard/resources" className="btn btn-primary">
            <Plus size={16} className="mr-2" />
            Make Reservation
          </Link>
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
              placeholder="Search reservations..."
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('');
                  }}
                  className="btn btn-outline w-full"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reservations List */}
        <div className="divide-y divide-neutral-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-500">Loading reservations...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error-600">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Calendar size={32} className="mx-auto mb-2" />
              <p>No reservations found</p>
              {(searchQuery || selectedStatus) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('');
                  }}
                  className="btn btn-outline mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredReservations.map((reservation: any) => (
              <motion.div 
                key={reservation.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                      <Server size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-800 text-lg">
                        {reservation.resources?.name || 'Unknown Resource'}
                      </h3>
                      <p className="text-neutral-600 mt-1">
                        {reservation.purpose || 'No purpose specified'}
                      </p>
                      <div className="flex items-center mt-3 space-x-6">
                        <div className="flex items-center text-sm text-neutral-600">
                          <User size={16} className="mr-2" />
                          {reservation.users?.full_name || 'Unknown User'}
                        </div>
                        <div className="flex items-center text-sm text-neutral-600">
                          <Clock size={16} className="mr-2" />
                          {format(new Date(reservation.start_time), 'MMM d, yyyy h:mm a')} - {format(new Date(reservation.end_time), 'h:mm a')}
                        </div>
                        <div className="flex items-center text-sm text-neutral-600">
                          <MapPin size={16} className="mr-2" />
                          {reservation.resources?.type || 'Unknown Type'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                    
                    {reservation.status === 'pending' && userDetails?.role && ['admin', 'staff'].includes(userDetails.role) && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleStatusUpdate(reservation.id, 'approved')}
                          className="btn btn-sm bg-success-600 text-white hover:bg-success-700"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(reservation.id, 'rejected')}
                          className="btn btn-sm bg-error-600 text-white hover:bg-error-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {reservation.status === 'approved' && userDetails?.role && ['admin', 'staff'].includes(userDetails.role) && (
                      <button 
                        onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                        className="btn btn-sm btn-outline"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reservations;