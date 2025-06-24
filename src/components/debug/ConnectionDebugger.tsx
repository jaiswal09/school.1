import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { debugSupabaseConnection, runNetworkDiagnostics } from '../../lib/supabase-debug';

const ConnectionDebugger: React.FC = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [showDebugger, setShowDebugger] = useState(false);

  // Auto-show debugger if connection issues detected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await debugSupabaseConnection();
        if (!result) {
          setShowDebugger(true);
        }
      } catch (error) {
        setShowDebugger(true);
      }
    };

    // Only check in development
    if (import.meta.env.DEV) {
      checkConnection();
    }
  }, []);

  const runFullDiagnostics = async () => {
    setIsDebugging(true);
    console.clear();
    
    try {
      console.log('🚀 Starting Full Supabase Diagnostics...');
      
      // Run connection test
      const connectionResult = await debugSupabaseConnection();
      
      // Run network diagnostics
      await runNetworkDiagnostics();
      
      setDebugResults({
        connectionSuccess: connectionResult,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setDebugResults({
        connectionSuccess: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsDebugging(false);
    }
  };

  if (!import.meta.env.DEV && !showDebugger) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showDebugger && (
        <div className="bg-white border border-error-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-error-500 mr-2" />
              <span className="font-medium text-error-700">Connection Issue</span>
            </div>
            <button
              onClick={() => setShowDebugger(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              ×
            </button>
          </div>
          
          <p className="text-sm text-neutral-600 mb-3">
            Supabase connection failed. Run diagnostics to identify the issue.
          </p>
          
          <button
            onClick={runFullDiagnostics}
            disabled={isDebugging}
            className="w-full btn btn-primary text-sm"
          >
            {isDebugging ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </button>
          
          {debugResults && (
            <div className="mt-3 p-2 bg-neutral-50 rounded text-xs">
              <div className="flex items-center">
                {debugResults.connectionSuccess ? (
                  <CheckCircle className="h-4 w-4 text-success-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-error-500 mr-1" />
                )}
                <span>
                  {debugResults.connectionSuccess ? 'Connection OK' : 'Connection Failed'}
                </span>
              </div>
              <div className="text-neutral-500 mt-1">
                Check console for detailed logs
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionDebugger;