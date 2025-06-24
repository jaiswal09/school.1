import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Show success message
    toast.success('Payment successful! Welcome to SchoolSync Pro!');
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-success-100 mb-6"
          >
            <CheckCircle className="h-10 w-10 text-success-600" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-neutral-800 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-neutral-600 mb-8">
            Thank you for your purchase. Your subscription has been activated and you now have access to all premium features.
          </p>
          
          {sessionId && (
            <div className="bg-white rounded-lg p-4 border border-neutral-200 mb-8">
              <p className="text-sm text-neutral-500 mb-1">Transaction ID</p>
              <p className="font-mono text-sm text-neutral-800 break-all">{sessionId}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="w-full btn btn-primary flex items-center justify-center"
          >
            Go to Dashboard
            <ArrowRight size={16} className="ml-2" />
          </Link>
          
          <Link
            to="/dashboard/settings"
            className="w-full btn btn-outline"
          >
            Manage Subscription
          </Link>
        </div>

        <div className="bg-primary-50 rounded-lg p-4 mt-8">
          <h3 className="font-semibold text-primary-800 mb-2">What's Next?</h3>
          <ul className="text-sm text-primary-700 space-y-1 text-left">
            <li>• Access all premium inventory features</li>
            <li>• Advanced reporting and analytics</li>
            <li>• Priority customer support</li>
            <li>• Regular feature updates</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Success;