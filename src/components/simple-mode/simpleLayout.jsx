import React from 'react';
import { Outlet } from '@tanstack/react-router';
import Dock from './dock';

const SimpleLayout = () => {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 overflow-auto mb-16">
        <Outlet />
      </main>
      <div className="fixed bottom-0 left-0 w-full">
        <Dock />
      </div>
    </div>
  );
};

export default SimpleLayout;
