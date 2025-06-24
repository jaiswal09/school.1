// Comprehensive Supabase connection debugging utility
import { createClient } from '@supabase/supabase-js';

// Debug function to test Supabase connection
export const debugSupabaseConnection = async () => {
  console.log('🔍 Starting Supabase Connection Debug...');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present (length: ' + import.meta.env.VITE_SUPABASE_ANON_KEY.length + ')' : 'Missing');
  
  // Validate URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL is not defined');
    return false;
  }
  
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format. Expected: https://[project-id].supabase.co');
    return false;
  }
  
  // Validate API key
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY is not defined');
    return false;
  }
  
  if (supabaseKey.length < 100) {
    console.error('❌ VITE_SUPABASE_ANON_KEY appears to be invalid (too short)');
    return false;
  }
  
  console.log('✅ Environment variables appear valid');
  
  // Test basic connectivity with timeout
  console.log('🌐 Testing basic connectivity...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(supabaseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Basic fetch response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Basic connectivity successful');
    } else {
      console.warn('⚠️ Basic connectivity returned non-200 status');
    }
  } catch (error) {
    console.error('❌ Basic connectivity failed:', error);
    return false;
  }
  
  // Test Supabase client initialization
  console.log('🔧 Testing Supabase client initialization...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase client created successfully');
    
    // Test a simple query with timeout
    console.log('📊 Testing simple query...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Query failed:', error);
      return false;
    }
    
    console.log('✅ Query successful:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Supabase client test failed:', error);
    return false;
  }
};

// Network diagnostics with improved error handling
export const runNetworkDiagnostics = async () => {
  console.log('🌐 Running Network Diagnostics...');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ Cannot run diagnostics without VITE_SUPABASE_URL');
    return;
  }
  
  // Test different endpoints with timeout
  const endpoints = [
    supabaseUrl,
    `${supabaseUrl}/rest/v1/`,
    `${supabaseUrl}/auth/v1/`,
    `${supabaseUrl}/realtime/v1/`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ ${endpoint} - Status: ${response.status}, Time: ${duration}ms`);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`❌ ${endpoint} - Timeout (>5s)`);
      } else {
        console.error(`❌ ${endpoint} - Error:`, error);
      }
    }
  }
};

// Export for global access
(window as any).debugSupabase = debugSupabaseConnection;
(window as any).runNetworkDiagnostics = runNetworkDiagnostics;