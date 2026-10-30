import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Film,
  UploadCloud,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  PlaySquare,
  Share2,
  Sparkles,
  Plus,
  Home,
  X,
  LogIn,
  UserCheck
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_CREATOR_IMG } from '../../data/mockData';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { projects, userSettings, isDarkMode, toggleTheme } = useProjects();
  const { user, isGuest, openAuthModal } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reelreason_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem('reelreason_sidebar_collapsed', String(nextState));
    } catch (e) {
      console.warn('Failed to persist sidebar state:', e);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const mostRecentProject = projects[0];

  const studioLinks = [
    {
      label: 'Upload Studio',
      href: '/upload',
      icon: UploadCloud,
      badge: 'New',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    },
    {
      label: 'Clip Studio',
      href: mostRecentProject ? `/project/${mostRecentProject.id}/clips` : '/upload',
      icon: PlaySquare,
      badge: mostRecentProject ? `${mostRecentProject.clips.length}` : undefined,
      badgeColor: 'bg-surface-sub text-main border-subtle'
    },
    {
      label: 'Export Hub',
      href: mostRecentProject ? `/project/${mostRecentProject.id}/export` : '/projects',
      icon: Share2,
      badge: mostRecentProject ? `${mostRecentProject.clips.filter(c => c.approvalStatus === 'approved').length}` : undefined,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      label: 'Project Library',
      href: '/projects',
      icon: FolderKanban,
      badge: `${projects.length}`,
      badgeColor: 'bg-surface-ter text-sub'
    },
    {
      label: 'Brand Kit & Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  const currentDisplayName = user?.name || userSettings.displayName;
  const currentHandle = user?.creatorHandle || userSettings.creatorHandle;
  const currentAvatar = user?.avatarUrl || userSettings.avatarUrl || AVATAR_CREATOR_IMG;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-surface-main border-r border-subtle transition-all duration-200 ease-in-out select-none ${
          isMobileOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-subtle">
          <Link
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 overflow-hidden group"
            title="ReelReason Home"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-4 h-4 stroke-[2.2]" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-sm font-extrabold tracking-tight text-main font-sans">
                  Reel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Reason</span>
                </span>
                <span className="text-[10px] text-sub font-semibold tracking-wider uppercase mt-1">
                  Creative Studio
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-sub hover:text-main hover:bg-surface-sub transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xl text-sub hover:text-main hover:bg-surface-sub transition-colors border border-transparent hover:border-subtle cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar width"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          
          {/* Quick Create CTA in Sidebar */}
          <div>
            <Link
              to="/upload"
              onClick={onCloseMobile}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all ${
                isCollapsed ? 'px-0' : 'px-3'
              }`}
              title="Create New Project"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              {!isCollapsed && <span>New Project</span>}
            </Link>
          </div>

          {/* Studio Navigation Group */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold text-sub uppercase tracking-wider">
                Workspace
              </div>
            )}

            {studioLinks.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                    active
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs border border-indigo-500/25'
                      : 'text-sub hover:text-main hover:bg-surface-sub hover:translate-x-0.5'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                  
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold tabular-nums border ${
                        item.badgeColor || 'bg-surface-sub text-sub border-subtle'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Recent Projects List (Expanded) */}
          {!isCollapsed && projects.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-subtle">
              <div className="flex items-center justify-between px-3 text-[11px] font-semibold text-sub uppercase tracking-wider">
                <span>Recent Videos</span>
                <Link to="/projects" className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-mono">
                  All
                </Link>
              </div>

              <div className="space-y-1">
                {projects.slice(0, 3).map((proj) => {
                  const isCurrent = location.pathname.includes(proj.id);
                  return (
                    <Link
                      key={proj.id}
                      to={`/project/${proj.id}/clips`}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-sub hover:text-main hover:bg-surface-sub'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                      <span className="truncate flex-1">{proj.title}</span>
                      <span className="font-mono text-[10px] text-sub tabular-nums">
                        {proj.clips.length}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overview Link */}
          <div className="pt-2 border-t border-subtle">
            <Link
              to="/"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-sub hover:text-main hover:bg-surface-sub transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Public Overview"
            >
              <Home className="w-4 h-4 shrink-0 text-sub" />
              {!isCollapsed && <span>Public Showcase</span>}
            </Link>
          </div>

        </div>

        {/* Footer: User Profile / Guest Mode Status & Theme Switcher */}
        <div className="p-3 border-t border-subtle bg-surface-sub/40 backdrop-blur-md">
          <div className={`flex items-center gap-2.5 ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}`}>
            
            {/* User Avatar & Status */}
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div
                onClick={() => openAuthModal('login')}
                className="relative shrink-0 cursor-pointer group"
                title={isGuest ? 'Guest Demo Mode (Click to Sign In)' : `${currentDisplayName} (Click to Switch Account)`}
              >
                <img
                  src={currentAvatar}
                  alt={currentDisplayName}
                  className="w-8 h-8 rounded-full object-cover border border-subtle group-hover:border-indigo-500 transition-colors"
                />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-surface-main rounded-full ${
                  isGuest ? 'bg-amber-400' : 'bg-emerald-500'
                }`} />
              </div>

              {!isCollapsed && (
                <div className="flex flex-col text-left truncate min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-semibold text-main truncate">
                      {currentDisplayName}
                    </span>
                    {isGuest && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono font-bold uppercase">
                        Guest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-sub">
                    <span className="font-mono truncate">{currentHandle}</span>
                    {isGuest && (
                      <button
                        onClick={() => openAuthModal('login')}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-sub hover:text-main hover:bg-surface-main transition-colors shrink-0 cursor-pointer"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

          </div>
        </div>

      </aside>
    </>
  );
};
