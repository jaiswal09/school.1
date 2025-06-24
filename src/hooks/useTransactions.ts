import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useTransactions = () => {
  const { userDetails } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch transactions function
  const fetchTransactions = useCallback(async () => {
    if (!userDetails) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          items(id, name, type),
          users(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      // If user is student or teacher, only show their own transactions
      if (userDetails.role && ['student', 'teacher'].includes(userDetails.role)) {
        query = query.eq('user_id', userDetails.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data as Transaction[] || []);
    } catch (error) {
      const e = error as Error;
      setError(e.message);
      console.error('Error fetching transactions:', e);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [userDetails?.role, userDetails?.id]);

  // Memoized checkout item function
  const checkoutItem = useCallback(async (
    itemId: string, 
    userId: string, 
    quantity: number, 
    expectedReturnDate?: string,
    notes?: string
  ) => {
    try {
      // Use atomic checkout function
      const { data, error } = await supabase.rpc('checkout_item_atomic', {
        p_item_id: itemId,
        p_user_id: userId,
        p_quantity: quantity,
        p_expected_return_date: expectedReturnDate,
        p_notes: notes
      });

      if (error) throw error;
      
      toast.success('Item checked out successfully');
      return { data, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to checkout item');
      return { data: null, error: e };
    }
  }, []);

  // Memoized return item function
  const returnItem = useCallback(async (
    transactionId: string,
    actualReturnDate: string = new Date().toISOString(),
    returnedQuantity?: number,
    notes?: string
  ) => {
    try {
      // Use atomic return function
      const { data, error } = await supabase.rpc('return_item_atomic', {
        p_transaction_id: transactionId,
        p_actual_return_date: actualReturnDate,
        p_returned_quantity: returnedQuantity,
        p_notes: notes
      });

      if (error) throw error;
      
      toast.success('Item returned successfully');
      return { data, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to return item');
      return { data: null, error: e };
    }
  }, []);

  // Memoized mark as lost function
  const markAsLost = useCallback(async (transactionId: string, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'lost',
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select();

      if (error) throw error;
      
      toast.success('Transaction marked as lost');
      return { data: data[0] as Transaction, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to mark transaction as lost');
      return { data: null, error: e };
    }
  }, []);

  // Memoized get overdue transactions function
  const getOverdueTransactions = useCallback(async () => {
    if (!userDetails) return { data: [], error: null };
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          items(id, name, type),
          users(id, full_name, email)
        `)
        .eq('status', 'checked_out');

      // Filter by user role
      if (userDetails.role && ['student', 'teacher'].includes(userDetails.role)) {
        query = query.eq('user_id', userDetails.id);
      }

      const { data: allTransactions, error } = await query;

      if (error) throw error;

      // Filter overdue transactions in JavaScript
      const overdueTransactions = (allTransactions || []).filter(transaction => {
        if (!transaction.expected_return_date) return false;
        const returnDate = new Date(transaction.expected_return_date);
        const todayDate = new Date(today);
        return returnDate < todayDate;
      });

      return { data: overdueTransactions as Transaction[], error: null };
    } catch (error) {
      const e = error as Error;
      console.error('Error fetching overdue transactions:', e);
      return { data: [], error: e };
    }
  }, [userDetails?.role, userDetails?.id]);

  // Memoized get transactions by date range function
  const getTransactionsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!userDetails) return { data: [], error: null };
    
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          items(id, name, type),
          users(id, full_name, email)
        `)
        .gte('checkout_date', startDate)
        .lte('checkout_date', endDate)
        .order('checkout_date', { ascending: false });

      // Filter by user role
      if (userDetails.role && ['student', 'teacher'].includes(userDetails.role)) {
        query = query.eq('user_id', userDetails.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data as Transaction[] || [], error: null };
    } catch (error) {
      const e = error as Error;
      console.error('Error fetching transactions by date range:', e);
      return { data: [], error: e };
    }
  }, [userDetails?.role, userDetails?.id]);

  // Initialize by fetching transactions only when userDetails is available
  useEffect(() => {
    let isMounted = true;
    
    if (userDetails && isMounted) {
      fetchTransactions();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userDetails, fetchTransactions]);

  // Memoized return object
  return useMemo(() => ({
    transactions,
    loading,
    error,
    fetchTransactions,
    checkoutItem,
    returnItem,
    markAsLost,
    getOverdueTransactions,
    getTransactionsByDateRange,
  }), [
    transactions,
    loading,
    error,
    fetchTransactions,
    checkoutItem,
    returnItem,
    markAsLost,
    getOverdueTransactions,
    getTransactionsByDateRange,
  ]);
};