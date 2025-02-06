import React from 'react';
import Dock from './dock';

const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 overflow-auto">
        {children}
      </main>

      <Dock />
    </div>
  );
};

export default SimpleLayout;
