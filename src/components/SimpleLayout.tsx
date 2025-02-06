import React from 'react';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-100">
      <main className="p-4">{children}</main>
    </div>
  );
};

export default SimpleLayout; 