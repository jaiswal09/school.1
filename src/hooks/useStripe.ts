import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface StripeSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface StripeOrder {
  customer_id: string;
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export const useStripe = () => {
  const [loading, setLoading] = useState(false);

  // Memoized create checkout session function
  const createCheckoutSession = useCallback(async (
    priceId: string,
    mode: 'payment' | 'subscription' = 'subscription'
  ) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stripe checkout error response:', errorText);
        throw new Error(`Failed to create checkout session: ${response.status}`);
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized get subscription function with caching
  const getSubscription = useCallback(async (): Promise<StripeSubscription | null> => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }, []);

  // Memoized get orders function
  const getOrders = useCallback(async (): Promise<StripeOrder[]> => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }, []);

  // Memoized return object
  return useMemo(() => ({
    createCheckoutSession,
    getSubscription,
    getOrders,
    loading,
  }), [createCheckoutSession, getSubscription, getOrders, loading]);
};