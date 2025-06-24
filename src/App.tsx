import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout components
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard';
import Inventory from './pages/inventory/Inventory';
import ItemDetails from './pages/inventory/ItemDetails';
import AddItem from './pages/inventory/AddItem';
import EditItem from './pages/inventory/EditItem';
import Categories from './pages/inventory/Categories';
import Transactions from './pages/transactions/Transactions';
import Resources from './pages/resources/Resources';
import ResourceDetails from './pages/resources/ResourceDetails';
import AddResource from './pages/resources/AddResource';
import EditResource from './pages/resources/EditResource';
import Reservations from './pages/resources/Reservations';
import Users from './pages/users/Users';
import UserProfile from './pages/users/UserProfile';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import Scanner from './pages/scanner/Scanner';

// Stripe pages
import Pricing from './pages/stripe/Pricing';
import Success from './pages/stripe/Success';

// Auth provider
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Debug component
import ConnectionDebugger from './components/debug/ConnectionDebugger';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Stripe Routes */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/success" element={<Success />} />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/:id" element={<ItemDetails />} />
            <Route path="inventory/:id/edit" element={<EditItem />} />
            <Route path="inventory/add" element={<AddItem />} />
            <Route path="categories" element={<Categories />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="resources" element={<Resources />} />
            <Route path="resources/:id" element={<ResourceDetails />} />
            <Route path="resources/:id/edit" element={<EditResource />} />
            <Route path="resources/add" element={<AddResource />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserProfile />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Connection Debugger - Only shows in development or when issues detected */}
        <ConnectionDebugger />
      </Router>
    </AuthProvider>
  );
};

export default App;