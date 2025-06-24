import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      const { error } = await resetPassword(email);
      
      if (error) {
        throw new Error(error.message || 'Failed to send password reset email');
      }
      
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Reset your password</h1>
        <p className="text-neutral-600 mt-2">
          Enter your email and we'll send you instructions to reset your password
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
            <CheckCircle className="h-6 w-6 text-success-600" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900">Check your email</h3>
          <p className="mt-2 text-neutral-600">
            We've sent a password reset link to <span className="font-medium">{email}</span>
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              try again
            </button>
          </p>
          <div className="mt-6">
            <Link to="/login" className="btn btn-outline w-full">
              Back to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-neutral-500" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          
          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default ForgotPassword;