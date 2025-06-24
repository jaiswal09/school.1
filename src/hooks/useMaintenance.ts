import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateNotification, sendNotification } from '../lib/gemini';
import toast from 'react-hot-toast';

export interface MaintenanceRecord {
  id: string;
  item_id: string;
  maintenance_date: string;
  performed_by: string;
  description: string;
  cost?: number;
  next_maintenance_date?: string;
  created_at: string;
}

export const useMaintenance = () => {
  const [loading, setLoading] = useState(false);
  const { userDetails } = useAuth();

  const scheduleMaintenance = useCallback(async (
    itemId: string,
    maintenanceDate: string,
    description: string,
    cost?: number,
    nextMaintenanceDate?: string
  ) => {
    if (!userDetails) {
      toast.error('You must be logged in to schedule maintenance');
      return { data: null, error: new Error('Not authenticated') };
    }

    setLoading(true);
    try {
      // Get item details
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('name')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Create maintenance record
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .insert([
          {
            item_id: itemId,
            maintenance_date: maintenanceDate,
            performed_by: userDetails.fullName,
            description,
            cost,
            next_maintenance_date: nextMaintenanceDate,
          }
        ])
        .select()
        .single();

      if (maintenanceError) throw maintenanceError;

      // Update item status to maintenance if the date is today or in the past
      const maintenanceDateTime = new Date(maintenanceDate);
      const now = new Date();
      
      if (maintenanceDateTime <= now) {
        await supabase
          .from('items')
          .update({ 
            status: 'maintenance',
            last_maintained: maintenanceDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);
      }

      // Generate notification
      const notification = await generateNotification('Maintenance scheduled', {
        itemName: item.name,
        maintenanceDate,
        performedBy: userDetails.fullName,
        description
      });
      
      await sendNotification(notification);
      
      toast.success('Maintenance scheduled successfully');
      return { data: maintenance, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to schedule maintenance');
      return { data: null, error: e };
    } finally {
      setLoading(false);
    }
  }, [userDetails]);

  // CRITICAL FIX: Memoized maintenance records function with caching
  const getMaintenanceRecords = useCallback(async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('item_id', itemId)
        .order('maintenance_date', { ascending: false });

      if (error) throw error;
      return { data: data as MaintenanceRecord[], error: null };
    } catch (error) {
      const e = error as Error;
      return { data: null, error: e };
    }
  }, []);

  const completeMaintenance = useCallback(async (
    maintenanceId: string,
    itemId: string,
    actualCost?: number,
    notes?: string
  ) => {
    setLoading(true);
    try {
      // Update maintenance record
      const { error: maintenanceError } = await supabase
        .from('maintenance_records')
        .update({
          cost: actualCost,
          description: notes ? `${notes}` : undefined,
        })
        .eq('id', maintenanceId);

      if (maintenanceError) throw maintenanceError;

      // Update item status back to available
      const { error: itemError } = await supabase
        .from('items')
        .update({ 
          status: 'available',
          last_maintained: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (itemError) throw itemError;

      toast.success('Maintenance completed successfully');
      return { error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to complete maintenance');
      return { error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    scheduleMaintenance,
    getMaintenanceRecords,
    completeMaintenance,
    loading
  }), [scheduleMaintenance, getMaintenanceRecords, completeMaintenance, loading]);
};