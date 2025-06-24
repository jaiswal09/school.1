import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useStripe, StripeSubscription } from '../../hooks/useStripe';
import { stripeProducts } from '../../stripe-config';
import { format } from 'date-fns';

const SubscriptionCard: React.FC = () => {
  const { getSubscription } = useStripe();
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoized fetch subscription function
  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [getSubscription]);

  // Fetch subscription only once on mount
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchSubscription();
    }
    
    return () => {
      isMounted = false;
    };
  }, [fetchSubscription]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-neutral-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-100';
      case 'trialing':
        return 'text-primary-600 bg-primary-100';
      case 'past_due':
      case 'unpaid':
        return 'text-error-600 bg-error-100';
      case 'canceled':
        return 'text-neutral-600 bg-neutral-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="mr-2" />;
      case 'past_due':
      case 'unpaid':
        return <AlertCircle size={16} className="mr-2" />;
      default:
        return null;
    }
  };

  const getProductName = (priceId: string | null) => {
    if (!priceId) return 'Unknown Plan';
    const product = stripeProducts.find(p => p.priceId === priceId);
    return product?.name || 'Unknown Plan';
  };

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
      >
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 text-neutral-400 mr-2" />
          <h3 className="text-lg font-semibold text-neutral-800">Subscription</h3>
        </div>
        <p className="text-neutral-500">No active subscription</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-neutral-400 mr-2" />
          <h3 className="text-lg font-semibold text-neutral-800">Subscription</h3>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.subscription_status)}`}>
          {getStatusIcon(subscription.subscription_status)}
          {subscription.subscription_status.replace('_', ' ').charAt(0).toUpperCase() + subscription.subscription_status.replace('_', ' ').slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-neutral-500">Plan</p>
          <p className="font-medium text-neutral-800">{getProductName(subscription.price_id)}</p>
        </div>

        {subscription.current_period_end && (
          <div>
            <p className="text-sm text-neutral-500">
              {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on
            </p>
            <div className="flex items-center">
              <Calendar size={16} className="text-neutral-400 mr-2" />
              <p className="font-medium text-neutral-800">
                {format(new Date(subscription.current_period_end * 1000), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        )}

        {subscription.payment_method_brand && subscription.payment_method_last4 && (
          <div>
            <p className="text-sm text-neutral-500">Payment Method</p>
            <p className="font-medium text-neutral-800">
              {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;