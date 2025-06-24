import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertTriangle, Package, Search, X, Save } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { Category } from '../../lib/supabase';
import toast from 'react-hot-toast';

const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  const [editCategory, setEditCategory] = useState({
    name: '',
    description: ''
  });

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await addCategory(newCategory.name, newCategory.description);
      setShowAddModal(false);
      setNewCategory({ name: '', description: '' });
      toast.success('Category added successfully');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !editCategory.name) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateCategory(selectedCategory.id, {
        name: editCategory.name,
        description: editCategory.description
      });
      setShowEditModal(false);
      setSelectedCategory(null);
      setEditCategory({ name: '', description: '' });
      toast.success('Category updated successfully');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      await deleteCategory(selectedCategory.id);
      setShowDeleteModal(false);
      setSelectedCategory(null);
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setEditCategory({
      name: category.name,
      description: category.description || ''
    });
    setError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
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
          <h1 className="text-2xl font-bold text-neutral-800">Categories</h1>
          <p className="text-neutral-500">Manage inventory categories and classifications</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
            setNewCategory({ name: '', description: '' });
          }}
          className="btn btn-primary"
        >
          <Plus size={16} className="mr-2" />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
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

      {/* Categories Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No Categories Found</h3>
            <p className="text-neutral-500">
              {searchQuery
                ? 'No categories match your search criteria'
                : 'Start by adding your first category'}
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-800">{category.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(category)}
                    className="text-neutral-500 hover:text-error-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-neutral-600 text-sm mb-4">
                {category.description || 'No description provided'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  Created {new Date(category.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Add New Category</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="input w-full"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="input w-full h-24"
                    placeholder="Enter category description"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 p-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCategory({ name: '', description: '' });
                  setError(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">Edit Category</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={editCategory.name}
                    onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                    className="input w-full"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editCategory.description}
                    onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                    className="input w-full h-24"
                    placeholder="Enter category description"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 p-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCategory(null);
                  setEditCategory({ name: '', description: '' });
                  setError(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Update Category
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-error-100 mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-error-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 text-center mb-2">Delete Category</h2>
              <p className="text-neutral-600 text-center mb-6">
                Are you sure you want to delete "{selectedCategory.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCategory(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteCategory}
                  disabled={loading}
                  className="btn bg-error-600 text-white hover:bg-error-700"
                >
                  {loading ? 'Deleting...' : 'Delete Category'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Categories;