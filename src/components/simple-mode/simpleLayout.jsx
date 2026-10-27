import { useLocation } from '@tanstack/react-router';
import Dock, { isDocklessPath } from './dock';

const SimpleLayout = ({ children }) => {
  const { pathname } = useLocation();
  const showDock = !isDocklessPath(pathname);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className={`flex-1 ${showDock ? 'pb-[var(--dock-height)]' : ''}`}>
        {children}
      </main>
      {showDock && <Dock />}
    </div>
  );
};

export default SimpleLayout;
