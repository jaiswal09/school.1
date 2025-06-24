import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateNotification, sendNotification } from '../lib/gemini';
import toast from 'react-hot-toast';

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { userDetails } = useAuth();

  const checkoutItem = async (
    itemId: string,
    quantity: number,
    expectedReturnDate?: string,
    notes?: string
  ) => {
    if (!userDetails) {
      toast.error('You must be logged in to checkout items');
      return { data: null, error: new Error('Not authenticated') };
    }

    setLoading(true);
    try {
      // Use a transaction to prevent race conditions
      const { data, error } = await supabase.rpc('checkout_item_atomic', {
        p_item_id: itemId,
        p_user_id: userDetails.id,
        p_quantity: quantity,
        p_expected_return_date: expectedReturnDate,
        p_notes: notes
      });

      if (error) throw error;

      // Generate and send notification based on real data
      try {
        const { data: item } = await supabase
          .from('items')
          .select('name, quantity, min_quantity')
          .eq('id', itemId)
          .single();

        if (item) {
          const notificationContext = item.quantity <= item.min_quantity ? 'low stock alert' : 'item checkout';
          const notificationData = item.quantity <= item.min_quantity ? {
            itemName: item.name,
            currentStock: item.quantity,
            minStock: item.min_quantity,
            checkedOutBy: userDetails.fullName,
            quantity
          } : {
            itemName: item.name,
            quantity,
            userName: userDetails.fullName,
            expectedReturn: expectedReturnDate,
            remainingStock: item.quantity
          };

          const notification = await generateNotification(notificationContext, notificationData);
          await sendNotification(notification);
        }
      } catch (notificationError) {
        console.warn('Failed to generate notification:', notificationError);
        // Don't fail the checkout if notification fails
      }
      
      toast.success('Item checked out successfully');
      return { data, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to checkout item');
      return { data: null, error: e };
    } finally {
      setLoading(false);
    }
  };

  const returnItem = async (
    transactionId: string,
    actualReturnDate: string = new Date().toISOString(),
    returnedQuantity?: number,
    notes?: string
  ) => {
    setLoading(true);
    try {
      // Use atomic return function to prevent race conditions
      const { data, error } = await supabase.rpc('return_item_atomic', {
        p_transaction_id: transactionId,
        p_actual_return_date: actualReturnDate,
        p_returned_quantity: returnedQuantity,
        p_notes: notes
      });

      if (error) throw error;

      // Generate notification for return
      try {
        const { data: transactionData } = await supabase
          .from('transactions')
          .select(`
            *,
            items!inner(name)
          `)
          .eq('id', transactionId)
          .single();

        if (transactionData) {
          const notification = await generateNotification('item return', {
            itemName: transactionData.items.name,
            quantity: returnedQuantity || transactionData.quantity,
            userName: userDetails?.fullName,
            wasOverdue: transactionData.expected_return_date && new Date(transactionData.expected_return_date) < new Date()
          });
          
          await sendNotification(notification);
        }
      } catch (notificationError) {
        console.warn('Failed to generate notification:', notificationError);
      }
      
      toast.success('Item returned successfully');
      return { data, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to return item');
      return { data: null, error: e };
    } finally {
      setLoading(false);
    }
  };

  return {
    checkoutItem,
    returnItem,
    loading
  };
};