import React from 'react';
import { Server } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center space-y-4">
        <Server className="h-12 w-12 text-primary-600 animate-pulse" />
        <h1 className="text-2xl font-semibold text-neutral-800">SchoolSync</h1>
        <div className="w-48 h-1 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-neutral-500">Loading resources...</p>
      </div>
      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;