import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus, Sun, Moon, Sparkles, Zap, User, LogIn } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { PageFade } from '../common/Reveal';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';

interface StudioLayoutProps {
  children: React.ReactNode;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('reelreason_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const { isDarkMode, toggleTheme } = useProjects();
  const { user, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleStorage = () => {
      setIsCollapsed(localStorage.getItem('reelreason_sidebar_collapsed') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 400);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full min-w-0 min-h-screen bg-canvas text-main flex overflow-x-clip transition-colors duration-200">
      
      {/* Studio Sidebar */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Studio Viewport */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        
        {/* Sleek Top Studio Bar with Ambient Glow */}
        <header className="h-14 sticky top-0 z-30 bg-surface-main/80 backdrop-blur-xl border-b border-subtle px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="min-w-0 flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-sub hover:text-main hover:bg-surface-sub transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-main whitespace-nowrap">
                Studio Workspace
              </span>
              <span className="hidden sm:inline text-sub">/</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Live Demo Mode
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5">
            {/* User status badge / Sign in button */}
            {!user || user.isGuest ? (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-sub hover:bg-surface-main border border-subtle text-xs font-semibold text-sub hover:text-main transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-sub border border-subtle text-xs">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-indigo-500/40"
                  />
                )}
                <span className="font-bold text-main truncate max-w-[120px]">{user.name}</span>
              </div>
            )}

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-sub hover:text-main hover:bg-surface-sub transition-colors border border-transparent hover:border-subtle cursor-pointer"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle visual theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* New Video CTA */}
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-500/25 transition-all whitespace-nowrap group cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              <span>New Video</span>
            </Link>
          </div>

        </header>

        {/* Content Children */}
        <main className="w-full min-w-0 flex-1 p-3 sm:p-6 lg:p-8">
          <PageFade className="w-full min-w-0">
            {children}
          </PageFade>
        </main>

      </div>

    </div>
  );
};
