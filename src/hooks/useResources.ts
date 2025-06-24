import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Resource, Reservation } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all resources
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name');

      if (error) throw error;
      setResources(data as Resource[]);
    } catch (error) {
      const e = error as Error;
      setError(e.message);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all reservations
  const fetchReservations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          resources(id, name, type),
          users(id, full_name, email)
        `)
        .order('start_time');

      if (error) throw error;
      setReservations(data as Reservation[]);
    } catch (error) {
      const e = error as Error;
      setError(e.message);
      toast.error('Failed to load reservations');
    }
  }, []);

  // CRITICAL FIX: Memoized fetch reservations for a specific resource
  const fetchResourceReservations = useCallback(async (resourceId: string) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users(id, full_name, email)
        `)
        .eq('resource_id', resourceId)
        .order('start_time');

      if (error) throw error;
      return { data: data as Reservation[], error: null };
    } catch (error) {
      const e = error as Error;
      setError(e.message);
      toast.error('Failed to load reservations');
      return { data: null, error: e };
    }
  }, []);

  // Add a new resource
  const addResource = useCallback(async (resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([
          { 
            ...resource,
            updated_at: new Date().toISOString(),
          }
        ])
        .select();

      if (error) throw error;
      
      toast.success('Resource added successfully');
      await fetchResources(); // Refresh the list
      return { data: data[0] as Resource, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to add resource');
      return { data: null, error: e };
    }
  }, [fetchResources]);

  // Update an existing resource
  const updateResource = useCallback(async (id: string, updates: Partial<Resource>) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      toast.success('Resource updated successfully');
      await fetchResources(); // Refresh the list
      return { data: data[0] as Resource, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to update resource');
      return { data: null, error: e };
    }
  }, [fetchResources]);

  // Create a new reservation
  const createReservation = useCallback(async (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // First check for conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .from('reservations')
        .select('*')
        .eq('resource_id', reservation.resource_id)
        .or(`start_time.lte.${reservation.end_time},end_time.gte.${reservation.start_time}`)
        .neq('status', 'rejected')
        .neq('status', 'cancelled');

      if (conflictError) throw conflictError;
      
      if (conflicts && conflicts.length > 0) {
        throw new Error('This time slot conflicts with an existing reservation');
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert([
          { 
            ...reservation,
            updated_at: new Date().toISOString(),
          }
        ])
        .select(`
          *,
          resources(id, name, type),
          users(id, full_name, email)
        `);

      if (error) throw error;
      
      toast.success('Reservation created successfully');
      await fetchReservations(); // Refresh the list
      return { data: data[0] as Reservation, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to create reservation');
      return { data: null, error: e };
    }
  }, [fetchReservations]);

  // Update reservation status
  const updateReservationStatus = useCallback(async (id: string, status: 'approved' | 'rejected' | 'cancelled' | 'completed') => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          resources(id, name, type),
          users(id, full_name, email)
        `);

      if (error) throw error;
      
      toast.success(`Reservation ${status} successfully`);
      await fetchReservations(); // Refresh the list
      return { data: data[0] as Reservation, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to update reservation');
      return { data: null, error: e };
    }
  }, [fetchReservations]);

  // CRITICAL FIX: Memoized get resource by ID function
  const getResourceById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: data as Resource, error: null };
    } catch (error) {
      const e = error as Error;
      return { data: null, error: e };
    }
  }, []);

  // Delete a resource
  const deleteResource = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Resource deleted successfully');
      await fetchResources(); // Refresh the list
      return { error: null };
    } catch (error) {
      const e = error as Error;
      toast.error('Failed to delete resource');
      return { error: e };
    }
  }, [fetchResources]);

  // Initialize by fetching resources and reservations
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      if (isMounted) {
        await fetchResources();
        await fetchReservations();
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, [fetchResources, fetchReservations]);

  return useMemo(() => ({
    resources,
    reservations,
    loading,
    error,
    fetchResources,
    fetchReservations,
    fetchResourceReservations,
    addResource,
    updateResource,
    createReservation,
    updateReservationStatus,
    getResourceById,
    deleteResource,
  }), [
    resources,
    reservations,
    loading,
    error,
    fetchResources,
    fetchReservations,
    fetchResourceReservations,
    addResource,
    updateResource,
    createReservation,
    updateReservationStatus,
    getResourceById,
    deleteResource,
  ]);
};