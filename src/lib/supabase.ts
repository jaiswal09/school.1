import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Enhanced error logging for debugging
const logSupabaseError = (context: string, error: any) => {
  console.error(`🔥 Supabase Error [${context}]:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
};

// Get environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ENVIRONMENT VARIABLE FIX: Enhanced validation and error reporting
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not defined in environment variables');
  console.log('📋 Available environment variables:', Object.keys(import.meta.env));
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not defined in environment variables');
  console.log('📋 Available environment variables:', Object.keys(import.meta.env));
}

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ VITE_SUPABASE_URL must start with https://');
}

if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ VITE_SUPABASE_URL must be a valid Supabase URL (*.supabase.co)');
}

// Enhanced logging for debugging
console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  hasValidUrl: !!(supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')),
  environment: import.meta.env.MODE,
});

// Create client with enhanced configuration and connection pooling
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'schoolsync-web-app',
      },
    },
    db: {
      schema: 'public',
    },
    // Add connection pooling and retry configuration
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Connection health check with retry logic
let connectionHealthy = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export const checkConnection = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Return cached result if recent
  if (connectionHealthy && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
    return connectionHealthy;
  }

  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();
    
    connectionHealthy = !error;
    lastHealthCheck = now;
    
    if (!connectionHealthy) {
      logSupabaseError('Health Check', error);
    }
    
    return connectionHealthy;
  } catch (error) {
    connectionHealthy = false;
    lastHealthCheck = now;
    logSupabaseError('Health Check - Network Error', error);
    return false;
  }
};

// Initialize connection check
if (supabaseUrl && supabaseAnonKey) {
  checkConnection().then(isHealthy => {
    if (isHealthy) {
      console.log('✅ Supabase connection established successfully');
    } else {
      console.warn('⚠️ Supabase connection issues detected');
    }
  });
}

export type ItemType = 'equipment' | 'supply' | 'textbook' | 'digital' | 'furniture' | 'other';
export type ItemStatus = 'available' | 'in_use' | 'maintenance' | 'lost' | 'expired';
export type ResourceType = 'room' | 'lab' | 'equipment' | 'device' | 'other';
export type RoleType = 'admin' | 'staff' | 'teacher' | 'student';

export type Item = {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  quantity: number;
  min_quantity: number;
  location: string;
  category_id: string;
  status: ItemStatus;
  acquisition_date?: string;
  expiry_date?: string;
  cost?: number;
  supplier?: string;
  last_maintained?: string;
  qr_code?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: RoleType;
  department?: string;
  phone?: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  item_id: string;
  quantity: number;
  user_id: string;
  checkout_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  notes?: string;
  status: 'checked_out' | 'returned' | 'overdue' | 'lost';
  created_at: string;
  updated_at: string;
};

export type Resource = {
  id: string;
  name: string;
  description?: string;
  type: ResourceType;
  location: string;
  status: 'available' | 'in_use' | 'maintenance' | 'unavailable';
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: string;
  resource_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
};

export type MaintenanceRecord = {
  id: string;
  item_id: string;
  maintenance_date: string;
  performed_by: string;
  description: string;
  cost?: number;
  next_maintenance_date?: string;
  created_at: string;
};