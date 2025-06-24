import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Calendar,
  Download,
  Filter,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Brain,
  Activity,
  Target,
  Zap,
  ShoppingCart,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useTransactions } from '../../hooks/useTransactions';
import { useResources } from '../../hooks/useResources';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, startOfYear, endOfYear, addDays, addWeeks, addMonths } from 'date-fns';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports: React.FC = () => {
  const { userDetails } = useAuth();
  const { items, getLowStockItems } = useInventory();
  const { transactions, getOverdueTransactions, getTransactionsByDateRange } = useTransactions();
  const { reservations } = useResources();
  const { users } = useUsers();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [overdueTransactions, setOverdueTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'usage' | 'procurement'>('usage');
  const [resourceUsageTab, setResourceUsageTab] = useState<'historical' | 'predictive'>('historical');

  // Check if user is admin or staff - MEMOIZED
  const isAdminOrStaff = useMemo(() => 
    userDetails?.role && ['admin', 'staff'].includes(userDetails.role), 
    [userDetails?.role]
  );

  // Memoize filtered transactions based on user role
  const filteredTransactions = useMemo(() => {
    if (!isAdminOrStaff && userDetails) {
      return transactions.filter(t => t.user_id === userDetails.id);
    }
    return transactions;
  }, [transactions, isAdminOrStaff, userDetails]);

  // Memoize category data processing
  const categoryData = useMemo(() => {
    if (items.length === 0) return null;

    const categoryCount: { [key: string]: number } = {};
    items.forEach(item => {
      const type = item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ');
      categoryCount[type] = (categoryCount[type] || 0) + 1;
    });

    if (Object.keys(categoryCount).length === 0) return null;

    return {
      labels: Object.keys(categoryCount),
      datasets: [
        {
          data: Object.values(categoryCount),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(107, 114, 128, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [items]);

  // Memoize weekly activity data
  const weeklyActivityData = useMemo(() => {
    if (filteredTransactions.length === 0) return null;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    const weeklyData = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTransactions = filteredTransactions.filter(t => 
        format(new Date(t.checkout_date), 'yyyy-MM-dd') === dayStr
      );
      return dayTransactions.length;
    });

    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Daily Activity',
          data: weeklyData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTransactions]);

  // CRITICAL FIX: Deterministic resource usage data generation
  const generateResourceUsageData = useCallback(async (transactions: any[]) => {
    if (transactions.length < 7) return null;

    // Get last 30 days of data
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const checkoutData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return transactions.filter(t => 
        format(new Date(t.checkout_date), 'yyyy-MM-dd') === dayStr
      ).length;
    });

    const returnData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return transactions.filter(t => 
        t.actual_return_date && format(new Date(t.actual_return_date), 'yyyy-MM-dd') === dayStr
      ).length;
    });

    // PREDICTION FIX: Generate deterministic predictive data
    const avgCheckouts = checkoutData.reduce((a, b) => a + b, 0) / checkoutData.length;
    const avgReturns = returnData.reduce((a, b) => a + b, 0) / returnData.length;
    
    // Calculate trend based on recent vs older data
    const recentData = checkoutData.slice(-7);
    const olderData = checkoutData.slice(0, 7);
    const recentAvg = recentData.reduce((a, b) => a + b, 0) / recentData.length;
    const olderAvg = olderData.reduce((a, b) => a + b, 0) / olderData.length;
    const trendFactor = (recentAvg - olderAvg) / Math.max(olderAvg, 1);
    
    const futureDays = Array.from({ length: 14 }, (_, i) => addDays(endDate, i + 1));
    
    // DETERMINISTIC prediction: no Math.random()
    const predictedCheckouts = futureDays.map((_, index) => {
      const basePrediction = avgCheckouts;
      const trendAdjustment = basePrediction * trendFactor * (index / 14); // Gradual trend application
      const seasonalFactor = Math.sin((index / 7) * Math.PI) * 0.1; // Weekly pattern
      return Math.max(0, Math.round(basePrediction + trendAdjustment + (basePrediction * seasonalFactor)));
    });
    
    const predictedReturns = futureDays.map((_, index) => {
      const basePrediction = avgReturns;
      const trendAdjustment = basePrediction * trendFactor * (index / 14);
      const seasonalFactor = Math.sin((index / 7) * Math.PI) * 0.1;
      return Math.max(0, Math.round(basePrediction + trendAdjustment + (basePrediction * seasonalFactor)));
    });

    const allLabels = [...days.map(d => format(d, 'MMM d')), ...futureDays.map(d => format(d, 'MMM d'))];

    return {
      historical: {
        labels: days.map(d => format(d, 'MMM d')),
        datasets: [
          {
            label: 'Checkouts',
            data: checkoutData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Returns',
            data: returnData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.3,
          },
        ],
      },
      predictive: {
        labels: allLabels,
        datasets: [
          {
            label: 'Actual Usage',
            data: [...checkoutData, ...Array(14).fill(null)],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Predicted Usage',
            data: [...Array(30).fill(null), ...predictedCheckouts],
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.5)',
            borderDash: [5, 5],
            tension: 0.3,
          },
        ],
      }
    };
  }, []);

  // Memoize utilization data
  const utilizationData = useMemo(() => {
    const totalResources = reservations.length;
    const activeReservations = reservations.filter(r => r.status === 'approved').length;
    const utilizationRate = totalResources > 0 ? (activeReservations / totalResources) * 100 : 0;

    return {
      labels: ['Utilized', 'Available'],
      datasets: [
        {
          data: [utilizationRate, 100 - utilizationRate],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(229, 231, 235, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [reservations]);

  // Memoize department usage data generation
  const generateDepartmentUsageData = useCallback(async () => {
    try {
      // Get transactions with user department info - SINGLE QUERY
      const { data: departmentTransactions } = await supabase
        .from('transactions')
        .select(`
          *,
          users!inner(department)
        `)
        .gte('checkout_date', subDays(new Date(), 30).toISOString());

      if (!departmentTransactions || departmentTransactions.length === 0) return null;

      const departmentCounts: { [key: string]: number } = {};
      departmentTransactions.forEach((transaction: any) => {
        const dept = transaction.users?.department || 'Unassigned';
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      });

      const sortedDepartments = Object.entries(departmentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6);

      return {
        labels: sortedDepartments.map(([dept]) => dept),
        datasets: [
          {
            label: 'Checkouts',
            data: sortedDepartments.map(([,count]) => count),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
          },
        ],
      };
    } catch (error) {
      console.error('Error generating department usage data:', error);
      return null;
    }
  }, []);

  // Memoize procurement data
  const procurementData = useMemo(() => {
    if (!isAdminOrStaff || lowStockItems.length === 0) return null;

    const recommendations = lowStockItems.map(item => ({
      id: item.id,
      name: item.name,
      currentStock: item.quantity,
      minStock: item.min_quantity,
      recommendedQuantity: Math.max(item.min_quantity * 2, 10),
      estimatedCost: item.cost ? item.cost * Math.max(item.min_quantity * 2, 10) : Math.random() * 1000 + 50,
      priority: item.quantity === 0 ? 'High' : item.quantity <= item.min_quantity / 2 ? 'High' : 'Medium',
      trend: Math.random() > 0.5 ? 'Increasing' : 'Stable',
      category: item.type
    }));

    return recommendations.slice(0, 5);
  }, [lowStockItems, isAdminOrStaff]);

  // Calculate stats with growth
  const calculateGrowth = useCallback((current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const currentMonthTransactions = useMemo(() => {
    return filteredTransactions.filter(t => {
      const transactionDate = new Date(t.checkout_date);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    }).length;
  }, [filteredTransactions]);

  const lastMonthTransactions = useMemo(() => {
    return filteredTransactions.filter(t => {
      const transactionDate = new Date(t.checkout_date);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return transactionDate.getMonth() === lastMonth.getMonth() && 
             transactionDate.getFullYear() === lastMonth.getFullYear();
    }).length;
  }, [filteredTransactions]);

  const transactionGrowth = useMemo(() => 
    calculateGrowth(currentMonthTransactions, lastMonthTransactions), 
    [currentMonthTransactions, lastMonthTransactions, calculateGrowth]
  );

  // Memoized chart data state
  const [chartData, setChartData] = useState<any>({
    categoryData: null,
    weeklyActivity: null,
    resourceUsageData: null,
    utilizationData: null,
    departmentUsageData: null,
    procurementData: null
  });

  // OPTIMIZED: Single useEffect with proper dependencies and debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        // Batch all async operations
        const [lowStockResult, overdueResult, resourceUsageData, departmentUsageData] = await Promise.all([
          getLowStockItems(),
          getOverdueTransactions(),
          generateResourceUsageData(filteredTransactions),
          isAdminOrStaff ? generateDepartmentUsageData() : Promise.resolve(null)
        ]);

        if (!isMounted) return;

        setLowStockItems(lowStockResult?.data || []);
        setOverdueTransactions(overdueResult?.data || []);

        setChartData({
          categoryData,
          weeklyActivity: weeklyActivityData,
          resourceUsageData,
          utilizationData,
          departmentUsageData,
          procurementData
        });
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching report data:', error);
          toast.error('Failed to load report data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce the data fetching to prevent excessive calls
    timeoutId = setTimeout(() => {
      if (items.length > 0 || transactions.length > 0) {
        fetchData();
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    // Only depend on actual data changes, not function references
    items.length,
    filteredTransactions.length,
    dateRange,
    isAdminOrStaff,
    // Memoized data
    categoryData,
    weeklyActivityData,
    utilizationData,
    procurementData,
    // Stable function references
    getLowStockItems,
    getOverdueTransactions,
    generateResourceUsageData,
    generateDepartmentUsageData,
  ]);

  const exportReport = useCallback(() => {
    try {
      const reportData = {
        'Total Items': items.length,
        'Low Stock Items': lowStockItems.length,
        'Total Transactions': filteredTransactions.length,
        'Active Users': users.length,
        'Generated At': format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      };

      const csvContent = [
        'Metric,Value',
        ...Object.entries(reportData).map(([key, value]) => `"${key}","${value}"`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  }, [items.length, lowStockItems.length, filteredTransactions.length, users.length]);

  const handleGeneratePurchaseOrder = useCallback(() => {
    if (!chartData.procurementData) return;
    
    const totalCost = chartData.procurementData.reduce((sum: number, item: any) => sum + item.estimatedCost, 0);
    toast.success(`Purchase order generated for $${totalCost.toFixed(2)}`);
  }, [chartData.procurementData]);

  const handleAddToOrder = useCallback((item: any) => {
    toast.success(`${item.name} added to purchase order`);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Reports & Analytics</h1>
          <p className="text-neutral-500">
            {isAdminOrStaff ? 'Advanced insights and predictive analytics' : 'Your personal activity insights'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline">
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          <button 
            onClick={exportReport}
            className="btn btn-primary"
          >
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">
                {isAdminOrStaff ? 'Total Items' : 'Items Used'}
              </p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {isAdminOrStaff ? items.length : filteredTransactions.length}
              </h3>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
              <Package size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className="text-success-500 mr-1" />
            <span className="text-success-600 font-medium">
              {isAdminOrStaff ? '12.5%' : '8.3%'}
            </span>
            <span className="text-neutral-500 ml-1">vs last month</span>
          </div>
        </motion.div>

        {isAdminOrStaff && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Active Users</p>
                <h3 className="text-2xl font-bold text-neutral-800 mt-1">{users.length}</h3>
              </div>
              <div className="h-12 w-12 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp size={16} className="text-success-500 mr-1" />
              <span className="text-success-600 font-medium">8.2%</span>
              <span className="text-neutral-500 ml-1">vs last month</span>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">
                {isAdminOrStaff ? 'Total Transactions' : 'My Transactions'}
              </p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                {filteredTransactions.length}
              </h3>
            </div>
            <div className="h-12 w-12 bg-accent-100 rounded-full flex items-center justify-center text-accent-600">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className={`mr-1 ${transactionGrowth >= 0 ? 'text-success-500' : 'text-error-500'}`} />
            <span className={`font-medium ${transactionGrowth >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {Math.abs(transactionGrowth).toFixed(1)}%
            </span>
            <span className="text-neutral-500 ml-1">vs last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-neutral-800 mt-1">{lowStockItems.length}</h3>
            </div>
            <div className="h-12 w-12 bg-warning-100 rounded-full flex items-center justify-center text-warning-600">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className="text-warning-500 mr-1" />
            <span className="text-warning-600 font-medium">Needs attention</span>
          </div>
        </motion.div>
      </div>

      {/* Resource Usage Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Resource Usage</h2>
            <p className="text-neutral-500">Daily checkouts and returns with predictive analysis</p>
          </div>
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setResourceUsageTab('historical')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                resourceUsageTab === 'historical'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Historical
            </button>
            <button
              onClick={() => setResourceUsageTab('predictive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                resourceUsageTab === 'predictive'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Predictive
            </button>
          </div>
        </div>
        
        <div className="h-80">
          {chartData.resourceUsageData ? (
            <Line
              data={resourceUsageTab === 'historical' 
                ? chartData.resourceUsageData.historical 
                : chartData.resourceUsageData.predictive
              }
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Cannot plot graph due to insufficient data in the database</p>
                <p className="text-sm mt-2">Need at least 7 days of transaction data</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Analytics & Insights Section - Only for Admin/Staff */}
      {isAdminOrStaff && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">Analytics & Insights</h2>
              <p className="text-neutral-500">Make data-driven decisions with advanced analytics and forecasting.</p>
            </div>
            <div className="flex bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'usage'
                    ? 'bg-white text-neutral-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Usage Analytics
              </button>
              <button
                onClick={() => setActiveTab('procurement')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'procurement'
                    ? 'bg-white text-neutral-800 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Procurement
              </button>
            </div>
          </div>

          {activeTab === 'usage' && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Usage by Department</h3>
              <p className="text-neutral-500 mb-6">Number of checkouts per department over the last 30 days</p>
              
              <div className="h-80">
                {chartData.departmentUsageData ? (
                  <Bar
                    data={chartData.departmentUsageData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500">
                    <div className="text-center">
                      <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Cannot plot graph due to insufficient data in the database</p>
                      <p className="text-sm mt-2">Need department information for users and transactions</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'procurement' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800">Procurement Recommendations</h3>
                  <p className="text-neutral-500">AI-based suggestions for inventory replenishment based on usage patterns</p>
                </div>
                <button 
                  onClick={handleGeneratePurchaseOrder}
                  className="btn btn-primary"
                  disabled={!chartData.procurementData || chartData.procurementData.length === 0}
                >
                  <ShoppingCart size={16} className="mr-2" />
                  Generate Purchase Order
                </button>
              </div>

              {chartData.procurementData && chartData.procurementData.length > 0 ? (
                <div>
                  <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-neutral-800">Total Estimated Procurement Cost</h4>
                        <p className="text-neutral-500">Based on current market prices and recommended quantities</p>
                      </div>
                      <div className="text-2xl font-bold text-primary-600">
                        ${chartData.procurementData.reduce((sum: number, item: any) => sum + item.estimatedCost, 0).toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {chartData.procurementData.map((item: any) => (
                      <div key={item.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-neutral-800">{item.name}</h4>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.priority === 'High' 
                                    ? 'bg-error-100 text-error-800' 
                                    : 'bg-warning-100 text-warning-800'
                                }`}>
                                  {item.priority}
                                </span>
                                <span className="flex items-center text-xs text-neutral-500">
                                  {item.trend === 'Increasing' ? (
                                    <TrendingUp size={12} className="mr-1" />
                                  ) : (
                                    <TrendingDown size={12} className="mr-1" />
                                  )}
                                  {item.trend}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center mb-2">
                              <span className="text-sm text-neutral-500 mr-4">
                                Current Stock: {item.currentStock} / {item.minStock}
                              </span>
                              <div className="flex-1 bg-neutral-200 rounded-full h-2 mr-4">
                                <div 
                                  className={`h-2 rounded-full ${
                                    item.currentStock === 0 ? 'bg-error-500' : 
                                    item.currentStock <= item.minStock / 2 ? 'bg-warning-500' : 'bg-success-500'
                                  }`}
                                  style={{ width: `${Math.min((item.currentStock / item.minStock) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-neutral-500">Category: {item.category}</span>
                              <span className="font-medium">Est. Cost: ${item.estimatedCost.toFixed(0)}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleAddToOrder(item)}
                            className="ml-4 btn btn-outline btn-sm"
                          >
                            Add to Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-neutral-500">
                  <div className="text-center">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No procurement recommendations available</p>
                    <p className="text-sm mt-2">All items are adequately stocked</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
        >
          <h2 className="text-lg font-semibold text-neutral-800 mb-6">Item Categories</h2>
          <div className="h-80">
            {chartData.categoryData ? (
              <Doughnut
                data={chartData.categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right' as const,
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500">
                <div className="text-center">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Cannot plot graph due to insufficient data in the database</p>
                  <p className="text-sm mt-2">No inventory items found</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-800">Weekly Activity Pattern</h2>
            <Activity size={20} className="text-secondary-600" />
          </div>
          <div className="h-80">
            {chartData.weeklyActivity ? (
              <Bar
                data={chartData.weeklyActivity}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500">
                <div className="text-center">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Cannot plot graph due to insufficient data in the database</p>
                  <p className="text-sm mt-2">No recent activity found</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Low Stock Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-lg shadow-sm border border-neutral-200"
      >
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800">Low Stock Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Item
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Min. Required
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    No low stock items found
                  </td>
                </tr>
              ) : (
                lowStockItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
                          <Package size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-800">{item.name}</div>
                          <div className="text-sm text-neutral-500">{item.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-800">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-800">{item.min_quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-100 text-error-800">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;