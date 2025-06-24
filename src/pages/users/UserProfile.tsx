import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User,
  Mail,
  Building2,
  Calendar,
  Package,
  Clock,
  ArrowLeft,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Shield,
  Phone,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails: currentUser } = useAuth();
  const { getUserById, getUserTransactions, getUserReservations, updateUser } = useUsers();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    department: '',
    role: '',
    phone: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      try {
        const { data: userData, error: userError } = await getUserById(id);
        if (userError) throw userError;
        setUser(userData);

        const { data: transactionData, error: transactionError } = await getUserTransactions(id);
        if (transactionError) throw transactionError;
        setTransactions(transactionData || []);

        const { data: reservationData, error: reservationError } = await getUserReservations(id);
        if (reservationError) throw reservationError;
        setReservations(reservationData || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, getUserById, getUserTransactions, getUserReservations]);

  // Initialize edit form when user data is loaded
  useEffect(() => {
    if (user && !showEditModal) {
      setEditForm({
        full_name: user.full_name || '',
        email: user.email || '',
        department: user.department || '',
        role: user.role || '',
        phone: user.phone || ''
      });
    }
  }, [user, showEditModal]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setEditLoading(true);
    try {
      const { error } = await updateUser(user.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        department: editForm.department,
        role: editForm.role,
        phone: editForm.phone
      });

      if (error) throw error;

      // Update local user state
      setUser({
        ...user,
        full_name: editForm.full_name,
        email: editForm.email,
        department: editForm.department,
        role: editForm.role,
        phone: editForm.phone
      });

      setShowEditModal(false);
      toast.success('User profile updated successfully');
    } catch (error) {
      toast.error('Failed to update user profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = () => {
    // Reset form to current user data when opening modal
    setEditForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
      department: user?.department || '',
      role: user?.role || '',
      phone: user?.phone || ''
    });
    setShowEditModal(true);
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.id === id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-500">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Error Loading Profile</h2>
        <p className="text-neutral-500">{error || 'User not found'}</p>
        <button
          onClick={() => navigate('/dashboard/users')}
          className="mt-4 btn btn-outline"
        >
          Back to Users
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
            onClick={() => navigate('/dashboard/users')}
            className="btn btn-ghost"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{user.full_name}</h1>
            <p className="text-neutral-500">User Profile</p>
          </div>
        </div>
        {canEdit && (
          <button 
            onClick={openEditModal}
            className="btn btn-outline"
          >
            <Edit3 size={16} className="mr-2" />
            Edit Profile
          </button>
        )}
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
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-semibold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-neutral-800">{user.full_name}</h2>
                  <div className="flex items-center mt-1">
                    <Mail size={16} className="text-neutral-400 mr-2" />
                    <span className="text-neutral-600">{user.email}</span>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${user.role === 'admin' ? 'bg-primary-100 text-primary-800' :
                  user.role === 'staff' ? 'bg-success-100 text-success-800' :
                  user.role === 'teacher' ? 'bg-warning-100 text-warning-800' :
                  'bg-neutral-100 text-neutral-800'}`}
              >
                <Shield size={12} className="mr-1" />
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Department</h3>
                <div className="flex items-center text-neutral-800">
                  <Building2 size={16} className="mr-2 text-neutral-400" />
                  {user.department || 'Not assigned'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Phone Number</h3>
                <div className="flex items-center text-neutral-800">
                  <Phone size={16} className="mr-2 text-neutral-400" />
                  {user.phone || 'Not provided'}
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Member Since</h3>
                <div className="flex items-center text-neutral-800">
                  <Calendar size={16} className="mr-2 text-neutral-400" />
                  {format(new Date(user.created_at), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200"
          >
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800">Recent Activity</h3>
            </div>

            <div className="divide-y divide-neutral-200">
              {[...transactions, ...reservations]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((activity: any) => (
                  <div key={activity.id} className="p-4 hover:bg-neutral-50">
                    {'item_id' in activity ? (
                      // Transaction
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
                            <Package size={20} />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-neutral-800">
                              {activity.items?.name || 'Unknown Item'}
                            </p>
                            <p className="text-sm text-neutral-500">
                              Quantity: {activity.quantity} • 
                              {activity.status === 'checked_out' ? (
                                <span className="text-primary-600 ml-1">Checked out</span>
                              ) : activity.status === 'returned' ? (
                                <span className="text-success-600 ml-1">Returned</span>
                              ) : activity.status === 'overdue' ? (
                                <span className="text-error-600 ml-1">Overdue</span>
                              ) : (
                                <span className="text-neutral-600 ml-1">{activity.status}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(activity.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(activity.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Reservation
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-md bg-secondary-100 flex items-center justify-center text-secondary-600">
                            <Clock size={20} />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-neutral-800">
                              {activity.resources?.name || 'Unknown Resource'}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {format(new Date(activity.start_time), 'h:mm a')} - {format(new Date(activity.end_time), 'h:mm a')} •
                              {activity.status === 'approved' ? (
                                <span className="text-success-600 ml-1">Approved</span>
                              ) : activity.status === 'pending' ? (
                                <span className="text-warning-600 ml-1">Pending</span>
                              ) : activity.status === 'rejected' ? (
                                <span className="text-error-600 ml-1">Rejected</span>
                              ) : (
                                <span className="text-neutral-600 ml-1">{activity.status}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(activity.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(activity.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Activity Summary</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Total Transactions</p>
                <p className="text-2xl font-semibold text-neutral-800">
                  {transactions.length}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-500">Active Checkouts</p>
                <p className="text-2xl font-semibold text-neutral-800">
                  {transactions.filter(t => t.status === 'checked_out').length}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-500">Total Reservations</p>
                <p className="text-2xl font-semibold text-neutral-800">
                  {reservations.length}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Current Checkouts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Current Checkouts</h3>
            
            <div className="space-y-4">
              {transactions
                .filter(t => t.status === 'checked_out')
                .map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package size={16} className="text-neutral-400 mr-2" />
                      <span className="text-neutral-800">{transaction.items?.name}</span>
                    </div>
                    <span className="text-sm text-neutral-500">
                      Due {format(new Date(transaction.expected_return_date), 'MMM d')}
                    </span>
                  </div>
                ))}
              
              {transactions.filter(t => t.status === 'checked_out').length === 0 && (
                <p className="text-neutral-500 text-center">No active checkouts</p>
              )}
            </div>
          </motion.div>

          {/* Upcoming Reservations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Upcoming Reservations</h3>
            
            <div className="space-y-4">
              {reservations
                .filter(r => r.status === 'approved' && new Date(r.start_time) > new Date())
                .map(reservation => (
                  <div key={reservation.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock size={16} className="text-neutral-400 mr-2" />
                      <span className="text-neutral-800">{reservation.resources?.name}</span>
                    </div>
                    <span className="text-sm text-neutral-500">
                      {format(new Date(reservation.start_time), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))}
              
              {reservations.filter(r => r.status === 'approved' && new Date(r.start_time) > new Date()).length === 0 && (
                <p className="text-neutral-500 text-center">No upcoming reservations</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Edit Profile</h2>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleEditFormChange}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditFormChange}
                    className="input w-full"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={editForm.department}
                    onChange={handleEditFormChange}
                    className="input w-full"
                  />
                </div>

                {currentUser?.role === 'admin' && (
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={editForm.role}
                      onChange={handleEditFormChange}
                      className="input w-full"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="btn btn-primary"
                  >
                    {editLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
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

export default UserProfile;