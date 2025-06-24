import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateNotification, sendNotification, getStoredNotifications, NotificationData } from '../lib/gemini';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load stored notifications
    const stored = getStoredNotifications();
    setNotifications(stored);

    // Set up real-time monitoring
    const checkForUpdates = async () => {
      try {
        // Check for low stock items
        const { data: lowStockItems } = await supabase.rpc('get_low_stock_items');
        if (lowStockItems && lowStockItems.length > 0) {
          for (const item of lowStockItems) {
            // Check if we already have a recent notification for this item
            const recentNotification = stored.find(n => 
              n.itemId === item.id && 
              n.type === 'warning' &&
              new Date(n.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            );

            if (!recentNotification) {
              const notification = await generateNotification('low stock alert', {
                itemName: item.name,
                currentStock: item.quantity,
                minStock: item.min_quantity,
                location: item.location
              });
              notification.itemId = item.id;
              await sendNotification(notification);
            }
          }
        }

        // Check for overdue transactions
        const today = new Date().toISOString();
        const { data: overdueTransactions } = await supabase
          .from('transactions')
          .select(`
            *,
            items(name),
            users(full_name)
          `)
          .eq('status', 'checked_out')
          .lt('expected_return_date', today);

        if (overdueTransactions && overdueTransactions.length > 0) {
          for (const transaction of overdueTransactions) {
            const recentNotification = stored.find(n => 
              n.title.includes('Overdue') &&
              n.message.includes(transaction.items?.name || '') &&
              new Date(n.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            );

            if (!recentNotification) {
              const notification = await generateNotification('overdue item', {
                itemName: transaction.items?.name,
                userName: transaction.users?.full_name,
                daysOverdue: Math.floor((Date.now() - new Date(transaction.expected_return_date).getTime()) / (1000 * 60 * 60 * 24))
              });
              await sendNotification(notification);
            }
          }
        }

        // Refresh notifications
        const updatedNotifications = getStoredNotifications();
        setNotifications(updatedNotifications);
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check immediately and then every 5 minutes
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const createNotification = async (context: string, data: any) => {
    setLoading(true);
    try {
      const notification = await generateNotification(context, data);
      await sendNotification(notification);
      setNotifications(getStoredNotifications());
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    const updated = notifications.map(n => 
      n.timestamp === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  return {
    notifications,
    loading,
    createNotification,
    markAsRead,
    clearAll
  };
};