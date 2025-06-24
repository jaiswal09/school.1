import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setUsers(data as User[]);
    } catch (error) {
      const e = error as Error;
      setError(e.message);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Get user by ID
  const getUserById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: data as User, error: null };
    } catch (error) {
      const e = error as Error;
      return { data: null, error: e };
    }
  };

  // Update user details
  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      toast.success('User updated successfully');
      return { data: data[0] as User, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to update user');
      return { data: null, error: e };
    }
  };

  // Get user transactions
  const getUserTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          items(id, name, type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const e = error as Error;
      return { data: null, error: e };
    }
  };

  // Get user reservations
  const getUserReservations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          resources(id, name, type)
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const e = error as Error;
      return { data: null, error: e };
    }
  };

  // Initialize by fetching users
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    getUserById,
    updateUser,
    getUserTransactions,
    getUserReservations,
  };
};