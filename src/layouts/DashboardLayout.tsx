import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  Server, 
  LayoutDashboard, 
  Package, 
  Tag, 
  RepeatIcon, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  User, 
  LogOut,
  Scan,
  Bell,
  Search,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { userDetails, signOut } = useAuth();
  const { notifications, markAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Check if user is admin or staff
  const isAdminOrStaff = userDetails?.role && ['admin', 'staff'].includes(userDetails.role);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Inventory', path: '/dashboard/inventory', icon: <Package size={20} /> },
    // FEATURE FIX: Hide Categories from regular users
    ...(isAdminOrStaff ? [{ name: 'Categories', path: '/dashboard/categories', icon: <Tag size={20} /> }] : []),
    { name: 'Transactions', path: '/dashboard/transactions', icon: <RepeatIcon size={20} /> },
    { name: 'Resources', path: '/dashboard/resources', icon: <Server size={20} /> },
    { name: 'Reservations', path: '/dashboard/reservations', icon: <Calendar size={20} /> },
    { name: 'Users', path: '/dashboard/users', icon: <Users size={20} />, adminOnly: true },
    { name: 'Reports', path: '/dashboard/reports', icon: <BarChart3 size={20} /> },
    { name: 'Scanner', path: '/dashboard/scanner', icon: <Scan size={20} /> },
    { name: 'Pricing', path: '/dashboard/pricing', icon: <CreditCard size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;
  const isAdmin = userDetails?.role === 'admin';
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-800/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
            <Link to="/dashboard" className="flex items-center">
              <Server className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-semibold text-neutral-800 ml-2">SchoolSync</span>
            </Link>
            <button
              className="lg:hidden text-neutral-500 hover:text-neutral-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              // Skip admin-only items for non-admin users
              if (item.adminOnly && !isAdmin) return null;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  {userDetails?.fullName?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {userDetails?.fullName || 'User'}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {userDetails?.role || 'user'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-neutral-200 h-16 flex items-center z-30 relative">
          <div className="px-4 w-full flex items-center justify-between">
            <div className="flex items-center">
              <button
                className="text-neutral-500 hover:text-neutral-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              
              <div className="ml-4 lg:ml-0 relative max-w-xs">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  className="flex items-center justify-center h-8 w-8 rounded-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserMenuOpen(false);
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-accent-500 text-white text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-neutral-200 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                      <h3 className="font-medium text-neutral-800">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="text-xs text-neutral-500 hover:text-neutral-700"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-neutral-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-200">
                          {notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.timestamp}
                              className={`p-4 hover:bg-neutral-50 cursor-pointer ${
                                !notification.read ? 'bg-blue-50/50' : ''
                              }`}
                              onClick={() => markAsRead(notification.timestamp)}
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-medium text-neutral-800">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <span className="h-2 w-2 bg-primary-600 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600 mt-1">
                                {notification.message}
                              </p>
                              <span className="text-xs text-neutral-500 mt-1 block">
                                {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 text-neutral-700 hover:text-neutral-900"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotificationsOpen(false);
                  }}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {userDetails?.fullName?.charAt(0) || 'U'}
                  </div>
                </button>
                
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-neutral-200 z-50"
                  >
                    <div className="py-1">
                      <Link
                        to={`/dashboard/users/${userDetails?.id}`}
                        className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={16} className="mr-3 text-neutral-500" />
                        Profile
                      </Link>
                      <Link
                        to="/dashboard/settings"
                        className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings size={16} className="mr-3 text-neutral-500" />
                        Settings
                      </Link>
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        onClick={handleSignOut}
                      >
                        <LogOut size={16} className="mr-3 text-neutral-500" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;