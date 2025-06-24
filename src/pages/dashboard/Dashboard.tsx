import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  Package, 
  Users, 
  Calendar, 
  Clock,
  BarChart3,
  TrendingUp,
  CheckCircle,
  BookOpen,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfWeek, endOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Item, Transaction, Resource, Reservation } from '../../lib/supabase';
import SubscriptionCard from '../../components/stripe/SubscriptionCard';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title
);

const Dashboard: React.FC = () => {
  const { userDetails } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    activeTransactions: 0,
    pendingReservations: 0,
    totalUsers: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [itemsByType, setItemsByType] = useState<{[key: string]: number}>({});
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([]);

  // Handle payment status from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your subscription is now active.');
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. You can try again anytime.');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch total items count
        const { count: totalItems } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true });
        
        // Fetch low stock items using the RPC function
        const { data: lowStockItems, error: lowStockError } = await supabase
          .rpc('get_low_stock_items');

        if (lowStockError) {
          console.warn('Low stock RPC error:', lowStockError);
        }
        
        // Fetch active transactions
        const { count: activeTransactions } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'checked_out');
        
        // Fetch pending reservations
        const { count: pendingReservations } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        // Fetch total users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        // Fetch recent transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select(`
            *,
            items(name),
            users(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Fetch recent reservations
        const { data: reservations } = await supabase
          .from('reservations')
          .select(`
            *,
            resources(name),
            users(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Fetch items by type for chart
        const { data: items } = await supabase
          .from('items')
          .select('type, quantity');
        
        // Process items by type
        const typeCount: {[key: string]: number} = {};
        items?.forEach(item => {
          if (typeCount[item.type]) {
            typeCount[item.type] += 1;
          } else {
            typeCount[item.type] = 1;
          }
        });

        // Generate real weekly activity data based on actual transactions
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
        
        // Fetch all transactions for this week
        const { data: weekTransactions } = await supabase
          .from('transactions')
          .select('checkout_date')
          .gte('checkout_date', weekStart.toISOString())
          .lte('checkout_date', weekEnd.toISOString());

        // Count transactions per day
        const weeklyData = weekDays.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTransactions = (weekTransactions || []).filter(t => 
            format(new Date(t.checkout_date), 'yyyy-MM-dd') === dayStr
          );
          return dayTransactions.length;
        });
        
        setStats({
          totalItems: totalItems || 0,
          lowStockItems: lowStockItems?.length || 0,
          activeTransactions: activeTransactions || 0,
          pendingReservations: pendingReservations || 0,
          totalUsers: totalUsers || 0
        });
        
        setRecentTransactions(transactions as Transaction[] || []);
        setRecentReservations(reservations as Reservation[] || []);
        setItemsByType(typeCount);
        setWeeklyActivity(weeklyData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Chart data for item types
  const itemTypeChartData = {
    labels: Object.keys(itemsByType).map(type => 
      type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
    ),
    datasets: [
      {
        data: Object.values(itemsByType),
        backgroundColor: [
          '#3B82F6', // blue
          '#10B981', // green
          '#F97316', // orange
          '#8B5CF6', // purple
          '#EC4899', // pink
          '#14B8A6', // teal
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for weekly activity
  const weeklyActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Transactions',
        data: weeklyActivity,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Animations for cards
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
          <p className="text-neutral-500">
            Welcome back, {userDetails?.fullName || 'User'}!
          </p>
        </div>
        <div className="text-right">
          <p className="text-neutral-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-sm text-neutral-400">
            {format(new Date(), 'h:mm a')}
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-neutral-500">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-neutral-500 text-sm font-medium">Total Inventory</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalItems}</h3>
                  <p className="text-success-600 text-xs font-medium flex items-center mt-1">
                    <ArrowUp size={14} className="mr-1" />
                    <span>4.3% from last month</span>
                  </p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <Package size={20} />
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-neutral-500 text-sm font-medium">Low Stock Items</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.lowStockItems}</h3>
                  <p className="text-error-600 text-xs font-medium flex items-center mt-1">
                    <ArrowUp size={14} className="mr-1" />
                    <span>2.1% from last week</span>
                  </p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-error-100 text-error-600">
                  <AlertTriangle size={20} />
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-neutral-500 text-sm font-medium">Active Checkouts</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.activeTransactions}</h3>
                  <p className="text-neutral-500 text-xs font-medium flex items-center mt-1">
                    <span>Currently in use</span>
                  </p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
                  <BookOpen size={20} />
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-neutral-500 text-sm font-medium">Pending Reservations</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.pendingReservations}</h3>
                  <p className="text-accent-600 text-xs font-medium flex items-center mt-1">
                    <Clock size={14} className="mr-1" />
                    <span>Awaiting approval</span>
                  </p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-accent-100 text-accent-600">
                  <Calendar size={20} />
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Subscription Card and Charts Row */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <SubscriptionCard />
            </motion.div>
            
            <motion.div variants={itemVariants} className="card p-5">
              <h3 className="text-lg font-semibold mb-4">Inventory by Type</h3>
              <div className="h-64 flex items-center justify-center">
                {Object.keys(itemsByType).length > 0 ? (
                  <Doughnut 
                    data={itemTypeChartData} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 16
                          }
                        }
                      },
                      cutout: '65%',
                      maintainAspectRatio: false,
                      animation: {
                        animateRotate: true,
                        animateScale: true
                      }
                    }} 
                  />
                ) : (
                  <div className="text-center text-neutral-500">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No inventory data available</p>
                  </div>
                )}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card p-5">
              <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
              <div className="h-64">
                <Line 
                  data={weeklyActivityData} 
                  options={{
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          borderDash: [2]
                        },
                        ticks: {
                          stepSize: 1
                        }
                      }
                    },
                    maintainAspectRatio: false,
                    animation: {
                      duration: 1000
                    }
                  }} 
                />
              </div>
            </motion.div>
          </motion.div>
          
          {/* Recent Activity */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Recent Transactions */}
            <motion.div variants={itemVariants} className="card">
              <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Transactions</h3>
                <Link to="/dashboard/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all
                </Link>
              </div>
              
              <div className="divide-y divide-neutral-200">
                {recentTransactions.length === 0 ? (
                  <div className="p-5 text-center text-neutral-500">
                    No recent transactions
                  </div>
                ) : (
                  recentTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-800">
                            {transaction.items?.name || 'Unknown Item'}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {transaction.users?.full_name || 'Unknown User'} • 
                            {transaction.status === 'checked_out' ? (
                              <span className="text-accent-600 ml-1">Checked out</span>
                            ) : transaction.status === 'returned' ? (
                              <span className="text-success-600 ml-1">Returned</span>
                            ) : transaction.status === 'overdue' ? (
                              <span className="text-error-600 ml-1">Overdue</span>
                            ) : (
                              <span className="text-neutral-600 ml-1">{transaction.status}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Qty: {transaction.quantity}</p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
            
            {/* Recent Reservations */}
            <motion.div variants={itemVariants} className="card">
              <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upcoming Reservations</h3>
                <Link to="/dashboard/reservations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all
                </Link>
              </div>
              
              <div className="divide-y divide-neutral-200">
                {recentReservations.length === 0 ? (
                  <div className="p-5 text-center text-neutral-500">
                    No upcoming reservations
                  </div>
                ) : (
                  recentReservations.map((reservation: any) => (
                    <div key={reservation.id} className="p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-800">
                            {reservation.resources?.name || 'Unknown Resource'}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {reservation.users?.full_name || 'Unknown User'} • 
                            {reservation.status === 'pending' ? (
                              <span className="text-accent-600 ml-1">Pending</span>
                            ) : reservation.status === 'approved' ? (
                              <span className="text-success-600 ml-1">Approved</span>
                            ) : reservation.status === 'rejected' ? (
                              <span className="text-error-600 ml-1">Rejected</span>
                            ) : (
                              <span className="text-neutral-600 ml-1">{reservation.status}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(reservation.start_time), 'MMM d, h:mm a')}
                          </p>
                          <p className="text-xs text-neutral-500">
                            to {format(new Date(reservation.end_time), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
          
          {/* Quick Actions */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <motion.div variants={itemVariants} className="card p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-3">
                <Package size={24} />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">Add New Item</h3>
              <p className="text-sm text-neutral-500 mb-3">Add new inventory items to the system</p>
              <Link to="/dashboard/inventory/add" className="btn btn-primary px-4 py-2 text-sm">
                Add Item
              </Link>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 mb-3">
                <Calendar size={24} />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">Reserve Resource</h3>
              <p className="text-sm text-neutral-500 mb-3">Schedule and reserve resources</p>
              <Link to="/dashboard/resources" className="btn btn-secondary px-4 py-2 text-sm">
                Make Reservation
              </Link>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 mb-3">
                <BarChart3 size={24} />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">View Reports</h3>
              <p className="text-sm text-neutral-500 mb-3">Access usage analytics and reports</p>
              <Link to="/dashboard/reports" className="btn btn-accent px-4 py-2 text-sm">
                View Reports
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="card p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 mb-3">
                <CreditCard size={24} />
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">Upgrade Plan</h3>
              <p className="text-sm text-neutral-500  mb-3">Access premium features</p>
              <Link to="/dashboard/pricing" className="btn btn-outline px-4 py-2 text-sm">
                View Pricing
              </Link>
            </motion.div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Dashboard;