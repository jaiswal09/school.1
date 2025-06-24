import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ArrowLeft, Save, AlertTriangle, Upload, X } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';
import { ItemType, ItemStatus } from '../../lib/supabase';
import toast from 'react-hot-toast';

const EditItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const { getItemById, updateItem, categories } = useInventory();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '' as ItemType,
    quantity: 0,
    min_quantity: 0,
    location: '',
    category_id: '',
    status: 'available' as ItemStatus,
    acquisition_date: '',
    expiry_date: '',
    cost: '',
    supplier: '',
    image_url: '',
  });

  const itemTypes: ItemType[] = ['equipment', 'supply', 'textbook', 'digital', 'furniture', 'other'];
  const itemStatuses: ItemStatus[] = ['available', 'in_use', 'maintenance', 'lost', 'expired'];

  // Check permissions
  const canEdit = userDetails?.role && ['admin', 'staff'].includes(userDetails.role);

  useEffect(() => {
    if (!canEdit) {
      toast.error('You do not have permission to edit items');
      navigate('/dashboard/inventory');
      return;
    }

    const fetchItem = async () => {
      if (!id) return;

      try {
        const { data, error } = await getItemById(id);
        if (error) throw error;
        if (!data) throw new Error('Item not found');

        // Initialize form data once when item is loaded
        const itemData = {
          name: data.name || '',
          description: data.description || '',
          type: data.type || '' as ItemType,
          quantity: data.quantity || 0,
          min_quantity: data.min_quantity || 0,
          location: data.location || '',
          category_id: data.category_id || '',
          status: data.status || 'available' as ItemStatus,
          acquisition_date: data.acquisition_date ? data.acquisition_date.split('T')[0] : '',
          expiry_date: data.expiry_date ? data.expiry_date.split('T')[0] : '',
          cost: data.cost ? data.cost.toString() : '',
          supplier: data.supplier || '',
          image_url: (data as any).image_url || '',
        };

        setFormData(itemData);

        if ((data as any).image_url) {
          setImagePreview((data as any).image_url);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchItem();
  }, [id, getItemById, canEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    if (!formData.name || !formData.type || !formData.location || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        quantity: Number(formData.quantity),
        min_quantity: Number(formData.min_quantity),
        cost: formData.cost ? Number(formData.cost) : null,
        acquisition_date: formData.acquisition_date || null,
        expiry_date: formData.expiry_date || null,
        image_url: formData.image_url || null,
      };

      const { error } = await updateItem(id, updateData);
      
      if (error) throw error;
      
      toast.success('Item updated successfully');
      navigate(`/dashboard/inventory/${id}`);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  if (!canEdit) {
    return null; // Component will redirect
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-500">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Error Loading Item</h2>
        <p className="text-neutral-500">{error}</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/dashboard/inventory/${id}`)}
            className="btn btn-ghost"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Edit Item</h1>
            <p className="text-neutral-500">Update item information</p>
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
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Item Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Item preview"
                        className="w-32 h-32 object-cover rounded-lg border border-neutral-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full p-1 hover:bg-error-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                      <Upload size={24} className="text-neutral-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="btn btn-outline cursor-pointer"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Image
                    </label>
                    <p className="text-xs text-neutral-500 mt-1">
                      Max size: 5MB. Formats: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>

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
                    {itemTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-neutral-700 mb-1">
                    Category <span className="text-error-500">*</span>
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                    {itemStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
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
                  <label htmlFor="quantity" className="block text-sm font-medium text-neutral-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="min_quantity" className="block text-sm font-medium text-neutral-700 mb-1">
                    Minimum Quantity
                  </label>
                  <input
                    type="number"
                    id="min_quantity"
                    name="min_quantity"
                    value={formData.min_quantity}
                    onChange={handleInputChange}
                    min="0"
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-neutral-700 mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-neutral-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="acquisition_date" className="block text-sm font-medium text-neutral-700 mb-1">
                    Acquisition Date
                  </label>
                  <input
                    type="date"
                    id="acquisition_date"
                    name="acquisition_date"
                    value={formData.acquisition_date}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="expiry_date" className="block text-sm font-medium text-neutral-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
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
              onClick={() => navigate(`/dashboard/inventory/${id}`)}
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
                  Updating Item...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Update Item
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditItem;