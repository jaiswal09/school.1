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

  // It's good practice to validate the format for basic sanity
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

  if (supabaseKey.length < 100) { // Supabase anon keys are usually much longer, e.g., ~400+ characters
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY appears to be very short. Please verify it is your full public API key.');
  }

  console.log('✅ Environment variables appear valid (format check)');

  // --- MODIFIED SECTION FOR BASIC CONNECTIVITY TEST ---
  console.log('🌐 Testing basic connectivity to Supabase REST API root...');
  // Use the REST API root endpoint for a basic GET request.
  // It usually responds with a 400 Bad Request, but with correct CORS headers if configured.
  const restApiRoot = `${supabaseUrl}/rest/v1/`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(restApiRoot, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey, // Essential for any Supabase API endpoint
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`📡 Basic fetch to ${restApiRoot} - Status: ${response.status}`);

    // A 400 Bad Request from the REST API root indicates it's reachable and responding,
    // which is a success for basic connectivity. A 200 OK is also fine.
    if (response.ok || response.status === 400) {
      console.log('✅ Basic connectivity successful (received response from REST API root)');
    } else {
      console.warn(`⚠️ Basic connectivity returned unexpected status: ${response.status}`);
      // If it's a 404 here, it might indicate the URL itself is wrong beyond the base.
    }
  } catch (error) {
    console.error('❌ Basic connectivity failed:', error);
    // Explicitly check for CORS in the error message for better debugging
    if (error instanceof TypeError && error.message.includes('CORS')) {
        console.error('   Hint: This is likely a CORS issue. Double-check your Supabase Project Settings -> Authentication -> URL Configuration to ensure `http://localhost:5173` is listed in "Additional Redirect URLs".');
    }
    return false;
  }
  // --- END MODIFIED SECTION ---

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
    console.log('📊 Testing simple query (fetching user count)...');
    const { data, error } = await supabase
      .from('users') // Assuming 'users' table exists and anon can access count
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Query failed:', error);
      console.error('   Error details:', error.message);
      if (error.code === 'PGRST204') {
          console.warn('   (PGRST204: No rows found, but query might have connected successfully)');
          return true; // Consider it connected even if no users were found
      }
      return false;
    }

    console.log('✅ Query successful (received count):', data);
    return true;

  } catch (error) {
    console.error('❌ Supabase client test failed:', error);
    console.error('   Error details:', error.message);
    return false;
  }
};

// Network diagnostics with improved error handling (No changes needed here unless you want to test specific Auth API GET endpoints)
export const runNetworkDiagnostics = async () => {
  console.log('🌐 Running Network Diagnostics...');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Cannot run diagnostics without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return;
  }

  // Test different endpoints with timeout
  const endpoints = [
    { name: "Base URL (should respond with 404 if direct GET)", url: supabaseUrl },
    { name: "REST API Root", url: `${supabaseUrl}/rest/v1/` },
    { name: "Auth API Root (might not respond to GET)", url: `${supabaseUrl}/auth/v1/` }, // Keep this, as it's still a real endpoint, just not good for GET ping
    { name: "Realtime API Root (might not respond to GET)", url: `${supabaseUrl}/realtime/v1/` },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint.name} (${endpoint.url})`);
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ ${endpoint.name} - Status: ${response.status}, Time: ${duration}ms`);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`❌ ${endpoint.name} - Timeout (>5s)`);
      } else if (error instanceof TypeError && error.message.includes('CORS')) {
        console.error(`❌ ${endpoint.name} - CORS Error: ${error.message}. Check Supabase Project Settings > Authentication > URL Configuration.`);
      } else {
        console.error(`❌ ${endpoint.name} - Error:`, error);
      }
    }
  }
};

// Export for global access (useful for testing in console)
(window as any).debugSupabase = debugSupabaseConnection;
(window as any).runNetworkDiagnostics = runNetworkDiagnostics;