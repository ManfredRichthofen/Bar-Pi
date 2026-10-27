import { motion } from 'motion/react';
import React from 'react';
import Dock from './dock';

const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 overflow-auto pb-24">{children}</main>
      <Dock />
    </div>
  );
};

export default SimpleLayout;
