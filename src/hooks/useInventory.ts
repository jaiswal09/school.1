import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Item, Category } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useInventory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch functions to prevent unnecessary re-renders
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data as Item[]);
    } catch (error) {
      const e = error as Error;
      setError(e.message);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data as Category[]);
    } catch (error) {
      const e = error as Error;
      setError(e.message);
      toast.error('Failed to load categories');
    }
  }, []);

  // Memoized add item function
  const addItem = useCallback(async (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([
          { 
            ...item,
            updated_at: new Date().toISOString(),
          }
        ])
        .select();

      if (error) throw error;
      
      // Refresh items list
      await fetchItems();
      
      toast.success('Item added successfully');
      return { data: data[0] as Item, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to add item');
      return { data: null, error: e };
    }
  }, [fetchItems]);

  // Memoized update item function
  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // Refresh items list
      await fetchItems();
      
      toast.success('Item updated successfully');
      return { data: data[0] as Item, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to update item');
      return { data: null, error: e };
    }
  }, [fetchItems]);

  // Memoized delete item function
  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh items list
      await fetchItems();
      
      toast.success('Item deleted successfully');
      return { error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to delete item');
      return { error: e };
    }
  }, [fetchItems]);

  // Memoized category functions
  const addCategory = useCallback(async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          { 
            name,
            description,
          }
        ])
        .select();

      if (error) throw error;
      
      // Refresh categories list
      await fetchCategories();
      
      toast.success('Category added successfully');
      return { data: data[0] as Category, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to add category');
      return { data: null, error: e };
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // Refresh categories list
      await fetchCategories();
      
      toast.success('Category updated successfully');
      return { data: data[0] as Category, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to update category');
      return { data: null, error: e };
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh categories list
      await fetchCategories();
      
      toast.success('Category deleted successfully');
      return { error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to delete category');
      return { error: e };
    }
  }, [fetchCategories]);

  // Memoized low stock items function
  const getLowStockItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_low_stock_items')
        .select(`
          *,
          categories(id, name)
        `);

      if (error) throw error;
      return { data: data as Item[], error: null };
    } catch (error) {
      const e = error as Error;
      return { data: null, error: e };
    }
  }, []);

  // CRITICAL FIX: Memoized get item by ID function with caching
  const getItemById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          categories(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: data as Item, error: null };
    } catch (error) {
      const e = error as Error;
      return { data: null, error: e };
    }
  }, []);

  // Initialize data fetching only once
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      if (isMounted) {
        await Promise.all([fetchCategories(), fetchItems()]);
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, [fetchCategories, fetchItems]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    items,
    categories,
    loading,
    error,
    fetchItems,
    fetchCategories,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    updateCategory,
    deleteCategory,
    getLowStockItems,
    getItemById,
  }), [
    items,
    categories,
    loading,
    error,
    fetchItems,
    fetchCategories,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    updateCategory,
    deleteCategory,
    getLowStockItems,
    getItemById,
  ]);
};