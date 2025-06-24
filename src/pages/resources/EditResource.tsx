import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useResources } from '../../hooks/useResources';
import { useAuth } from '../../contexts/AuthContext';
import { ResourceType } from '../../lib/supabase';
import toast from 'react-hot-toast';

const EditResource: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const { getResourceById, updateResource } = useResources();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '' as ResourceType,
    location: '',
    status: 'available' as 'available' | 'in_use' | 'maintenance' | 'unavailable',
  });

  const resourceTypes: ResourceType[] = ['room', 'lab', 'equipment', 'device', 'other'];

  // Check permissions
  const canEdit = userDetails?.role && ['admin', 'staff'].includes(userDetails.role);

  useEffect(() => {
    if (!canEdit) {
      toast.error('You do not have permission to edit resources');
      navigate('/dashboard/resources');
      return;
    }

    const fetchResource = async () => {
      if (!id) return;

      try {
        const { data, error } = await getResourceById(id);
        if (error) throw error;
        if (!data) throw new Error('Resource not found');

        // Initialize form data once when resource is loaded
        const resourceData = {
          name: data.name || '',
          description: data.description || '',
          type: data.type || '' as ResourceType,
          location: data.location || '',
          status: data.status || 'available',
        };

        setFormData(resourceData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchResource();
  }, [id, getResourceById, canEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    if (!formData.name || !formData.type || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await updateResource(id, formData);
      
      if (error) throw error;
      
      toast.success('Resource updated successfully');
      navigate(`/dashboard/resources/${id}`);
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!canEdit) {
    return null; // Component will redirect
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-500">Loading resource details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Error Loading Resource</h2>
        <p className="text-neutral-500">{error}</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/dashboard/resources/${id}`)}
            className="btn btn-ghost"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Edit Resource</h1>
            <p className="text-neutral-500">Update resource information</p>
          </div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-1">
                    Type <span className="text-error-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  >
                    <option value="">Select type</option>
                    {resourceTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
                    Location <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input w-full"
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input w-full h-auto"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/resources/${id}`)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating Resource...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Update Resource
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditResource;