import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Server } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Left panel - decoration and branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8 flex-col justify-between">
        <div className="flex items-center space-x-2">
          <Server className="h-8 w-8" />
          <span className="text-xl font-semibold">SchoolSync</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold">Intelligent Resource Management for Schools</h1>
          <p className="text-lg text-primary-100">
            Streamline your school's inventory, simplify resource allocation, and make data-driven decisions with our comprehensive management platform.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-lg">Real-time Tracking</h3>
              <p className="text-primary-100 mt-1">Monitor inventory levels and receive automatic alerts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-lg">Smart Scheduling</h3>
              <p className="text-primary-100 mt-1">Efficiently allocate shared resources and avoid conflicts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-lg">Analytics Dashboard</h3>
              <p className="text-primary-100 mt-1">Make data-driven decisions with insightful reports</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-lg">Digital Check-in/out</h3>
              <p className="text-primary-100 mt-1">Streamlined workflows for resource management</p>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-primary-200">
          © {new Date().getFullYear()} SchoolSync. All rights reserved.
        </div>
      </div>
      
      {/* Right panel - auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center mb-8">
            <Server className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-neutral-800 ml-2">SchoolSync</span>
          </div>
          
          {/* Auth content from child routes */}
          <Outlet />
          
          {/* Mobile footer */}
          <div className="mt-8 text-center text-sm text-neutral-500 md:hidden">
            © {new Date().getFullYear()} SchoolSync. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;