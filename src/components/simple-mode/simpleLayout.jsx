import React from 'react';
import Dock from './dock';

const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <main className="flex-1 overflow-auto pb-20">{children}</main>
      <Dock />
    </div>
  );
};

export default SimpleLayout;
