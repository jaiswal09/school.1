import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useStripe } from '../../hooks/useStripe';
import { StripeProduct } from '../../stripe-config';

interface ProductCardProps {
  product: StripeProduct;
  featured?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, featured = false }) => {
  const { createCheckoutSession, loading } = useStripe();

  const handlePurchase = () => {
    createCheckoutSession(product.priceId, product.mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-lg shadow-sm border-2 p-6 ${
        featured ? 'border-primary-500' : 'border-neutral-200'
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Popular
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl font-semibold text-neutral-800 mb-2">{product.name}</h3>
        <p className="text-neutral-600 mb-6">{product.description}</p>

        <div className="mb-6">
          <span className="text-3xl font-bold text-neutral-800">Free</span>
          {product.mode === 'subscription' && (
            <span className="text-neutral-500 ml-1">/month</span>
          )}
        </div>

        <button
          onClick={handlePurchase}
          disabled={loading}
          className={`w-full btn ${
            featured ? 'btn-primary' : 'btn-outline'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </>
          ) : (
            `Get ${product.name}`
          )}
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-neutral-200">
        <ul className="space-y-3">
          <li className="flex items-center">
            <Check size={16} className="text-success-500 mr-3" />
            <span className="text-neutral-600">Access to all features</span>
          </li>
          <li className="flex items-center">
            <Check size={16} className="text-success-500 mr-3" />
            <span className="text-neutral-600">24/7 support</span>
          </li>
          <li className="flex items-center">
            <Check size={16} className="text-success-500 mr-3" />
            <span className="text-neutral-600">Regular updates</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default ProductCard;