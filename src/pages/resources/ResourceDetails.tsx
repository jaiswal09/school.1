import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server,
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Edit3,
  AlertTriangle,
  CheckCircle,
  History,
  Plus,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useResources } from '../../hooks/useResources';
import { useAuth } from '../../contexts/AuthContext';
import { Resource, Reservation } from '../../lib/supabase';

const ResourceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const { getResourceById, fetchResourceReservations, createReservation, deleteResource } = useResources();
  const [resource, setResource] = useState<Resource | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    start_time: '',
    end_time: '',
    purpose: '',
  });

  useEffect(() => {
    const fetchResourceData = async () => {
      if (!id) return;

      try {
        const { data: resourceData, error: resourceError } = await getResourceById(id);
        if (resourceError) throw resourceError;
        setResource(resourceData);

        const { data: reservationData, error: reservationError } = await fetchResourceReservations(id);
        if (reservationError) throw reservationError;
        setReservations(reservationData || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchResourceData();
  }, [id, getResourceById, fetchResourceReservations]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource || !userDetails) return;

    try {
      const { error } = await createReservation({
        resource_id: resource.id,
        user_id: userDetails.id,
        start_time: reservationForm.start_time,
        end_time: reservationForm.end_time,
        purpose: reservationForm.purpose,
        status: 'pending',
      });

      if (!error) {
        setShowReservationModal(false);
        setReservationForm({ start_time: '', end_time: '', purpose: '' });
        // Refresh reservations
        const { data } = await fetchResourceReservations(resource.id);
        setReservations(data || []);
      }
    } catch (err) {
      console.error('Error creating reservation:', err);
    }
  };

  const handleDeleteResource = async () => {
    if (!resource) return;
    
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      const { error } = await deleteResource(resource.id);
      if (!error) {
        navigate('/dashboard/resources');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-500">Loading resource details...</p>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Error Loading Resource</h2>
        <p className="text-neutral-500">{error || 'Resource not found'}</p>
        <button
          onClick={() => navigate('/dashboard/resources')}
          className="mt-4 btn btn-outline"
        >
          Back to Resources
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
            onClick={() => navigate('/dashboard/resources')}
            className="btn btn-ghost"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{resource.name}</h1>
            <p className="text-neutral-500">Resource Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {userDetails?.role && ['admin', 'staff'].includes(userDetails.role) && (
            <>
              <Link
                to={`/dashboard/resources/${id}/edit`}
                className="btn btn-outline"
              >
                <Edit3 size={16} className="mr-2" />
                Edit
              </Link>
              <button 
                onClick={handleDeleteResource}
                className="btn bg-error-600 text-white hover:bg-error-700"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            </>
          )}
          <button 
            onClick={() => setShowReservationModal(true)}
            className="btn btn-primary"
          >
            <Calendar size={16} className="mr-2" />
            Make Reservation
          </button>
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
                  <Server size={24} />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-neutral-800">{resource.name}</h2>
                  <p className="text-neutral-500">
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${resource.status === 'available' ? 'bg-success-100 text-success-800' :
                  resource.status === 'in_use' ? 'bg-primary-100 text-primary-800' :
                  resource.status === 'maintenance' ? 'bg-warning-100 text-warning-800' :
                  'bg-error-100 text-error-800'}`}
              >
                {resource.status === 'available' && <CheckCircle size={12} className="mr-1" />}
                {resource.status === 'maintenance' && <AlertTriangle size={12} className="mr-1" />}
                {resource.status.replace('_', ' ').charAt(0).toUpperCase() + resource.status.replace('_', ' ').slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Description</h3>
                <p className="text-neutral-800">
                  {resource.description || 'No description provided'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Location</h3>
                <div className="flex items-center text-neutral-800">
                  <MapPin size={16} className="mr-2 text-neutral-400" />
                  {resource.location}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Reservations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200"
          >
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">Upcoming Reservations</h3>
            </div>

            <div className="divide-y divide-neutral-200">
              {reservations.length === 0 ? (
                <div className="p-6 text-center text-neutral-500">
                  No upcoming reservations
                </div>
              ) : (
                reservations
                  .filter(reservation => new Date(reservation.start_time) > new Date())
                  .map((reservation: any) => (
                    <div key={reservation.id} className="p-4 hover:bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                            <Users size={20} />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-neutral-800">
                              {reservation.users?.full_name || 'Unknown User'}
                            </p>
                            <div className="flex items-center mt-1 text-sm text-neutral-500">
                              <Clock size={14} className="mr-1" />
                              {format(new Date(reservation.start_time), 'MMM d, h:mm a')} - 
                              {format(new Date(reservation.end_time), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${reservation.status === 'approved' ? 'bg-success-100 text-success-800' :
                            reservation.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                            reservation.status === 'rejected' ? 'bg-error-100 text-error-800' :
                            'bg-neutral-100 text-neutral-800'}`}
                        >
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </div>
                      {reservation.purpose && (
                        <p className="mt-2 text-sm text-neutral-600 ml-14">
                          Purpose: {reservation.purpose}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowReservationModal(true)}
                className="btn btn-primary w-full"
              >
                <Plus size={16} className="mr-2" />
                Make Reservation
              </button>
              <button className="btn btn-outline w-full">
                Report Issue
              </button>
            </div>
          </motion.div>

          {/* Usage History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">Usage History</h3>
              <History size={20} className="text-neutral-400" />
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Total Reservations</p>
                <p className="text-2xl font-semibold text-neutral-800">
                  {reservations.length}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-500">This Month</p>
                <p className="text-2xl font-semibold text-neutral-800">
                  {reservations.filter(r => {
                    const reservationDate = new Date(r.start_time);
                    const now = new Date();
                    return reservationDate.getMonth() === now.getMonth() && 
                           reservationDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Make Reservation</h2>
              
              <form onSubmit={handleCreateReservation} className="space-y-4">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-neutral-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    value={reservationForm.start_time}
                    onChange={(e) => setReservationForm({ ...reservationForm, start_time: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-neutral-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    value={reservationForm.end_time}
                    onChange={(e) => setReservationForm({ ...reservationForm, end_time: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-neutral-700 mb-1">
                    Purpose
                  </label>
                  <textarea
                    id="purpose"
                    value={reservationForm.purpose}
                    onChange={(e) => setReservationForm({ ...reservationForm, purpose: e.target.value })}
                    className="input w-full h-24"
                    placeholder="Describe the purpose of this reservation..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReservationModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Create Reservation
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

export default ResourceDetails;