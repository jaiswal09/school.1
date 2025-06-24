import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/stripe/ProductCard';
import { stripeProducts } from '../../stripe-config';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">Pricing Plans</h1>
            <p className="text-neutral-600 mt-2">Choose the perfect plan for your needs</p>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {stripeProducts.map((product, index) => (
            <motion.div key={product.priceId} variants={itemVariants}>
              <ProductCard 
                product={product} 
                featured={index === 0} // Make first product featured
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 text-left">
              <h3 className="font-semibold text-neutral-800 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-neutral-600">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-left">
              <h3 className="font-semibold text-neutral-800 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-neutral-600">
                We offer a free plan with basic features. You can upgrade to a paid plan at any time to access premium features.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-left">
              <h3 className="font-semibold text-neutral-800 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-neutral-600">
                We accept all major credit cards including Visa, MasterCard, American Express, and Discover.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;