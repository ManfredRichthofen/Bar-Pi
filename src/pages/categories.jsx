import React from 'react';
import useAuthStore from '../store/authStore';
import { Navigate } from '@tanstack/react-router';

const Categories = ({ sidebarCollapsed = false }) => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Categories</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-base-content/40 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Drink Categories</h3>
            <p className="text-base-content/60 text-center text-sm">
              Manage drink categories and classifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
