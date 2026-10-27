import React, { useState } from 'react';
import HeaderBar from './HeaderBar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface WithSidebarCollapsed {
  sidebarCollapsed?: boolean;
}

const Layout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 640);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(
        child as React.ReactElement<WithSidebarCollapsed>,
        {
          sidebarCollapsed: collapsed,
        },
      );
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <main
        className={`transition-[margin] min-h-screen ${
          collapsed ? 'ml-0' : 'ml-0 sm:ml-72'
        }`}
      >
        <div className="px-4 pb-6 pt-16 sm:px-6">{childrenWithProps}</div>
      </main>
    </div>
  );
};

export default Layout;
