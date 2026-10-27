import { Menu } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
      {collapsed && (
        <Button
          onClick={() => setCollapsed(false)}
          variant="outline"
          size="icon"
          aria-label="Open sidebar"
          className="fixed top-3 left-3 z-50 shadow-md"
        >
          <Menu />
        </Button>
      )}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <main
        className={`min-h-screen transition-[margin] ${
          collapsed ? 'ml-0' : 'ml-0 sm:ml-72'
        }`}
      >
        <div className="px-4 pb-6 pt-4 sm:px-6">{childrenWithProps}</div>
      </main>
    </div>
  );
};

export default Layout;
