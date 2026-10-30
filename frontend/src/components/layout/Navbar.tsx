import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Film,
  Sun,
  Moon,
  PlusCircle,
  Menu,
  X,
  Sparkles,
  User,
  LogIn,
  UserPlus,
  LogOut,
  FolderKanban,
  Check
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useProjects();
  const { user, isGuest, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { label: 'Studio Showcase', href: '/' },
    { label: 'Upload Studio', href: '/upload' },
    { label: 'Project Library', href: '/projects' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface-main/90 backdrop-blur-md border-b border-subtle transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Brand Wordmark with Studio Gradient Icon */}
        <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Film className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-main font-sans">
              Reel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Reason</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Studio
            </span>
          </div>
        </Link>

        {/* Clean Nav Links with Underline Animations */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-sub">
          {navLinks.map(link => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                to={link.href}
                className={`whitespace-nowrap transition-colors duration-150 hover:text-main relative py-1 group ${
                  active ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
                }`}
              >
                <span>{link.label}</span>
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-200 ${
                  active ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-50'
                }`} />
              </Link>
            );
          })}
        </nav>

        {/* Actions (Auth / Demo Mode / Theme Toggle / New Project) */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="p-2 rounded-xl text-sub hover:text-main hover:bg-surface-sub transition-colors duration-150 cursor-pointer"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* User Auth / Profile Badge */}
          <div className="relative">
            {user && !isGuest ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-sub border border-transparent hover:border-subtle transition-all cursor-pointer"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                  <span className="hidden sm:block text-xs font-bold text-main max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-main border border-subtle shadow-xl py-2 z-50 animate-scale-in">
                    <div className="px-4 py-2 border-b border-subtle">
                      <p className="text-xs font-bold text-main truncate">{user.name}</p>
                      <p className="text-[11px] text-sub truncate font-mono">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold uppercase">
                        Pro Creator
                      </span>
                    </div>

                    <Link
                      to="/projects"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full px-4 py-2 text-xs text-sub hover:text-main hover:bg-surface-sub flex items-center gap-2 transition-colors"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                      <span>My Projects</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        openAuthModal('login');
                      }}
                      className="w-full px-4 py-2 text-xs text-sub hover:text-main hover:bg-surface-sub flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Switch Account</span>
                    </button>

                    <div className="border-t border-subtle my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out (Back to Guest)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-main hover:bg-surface-sub border border-subtle rounded-xl transition-all duration-150 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-sub" />
                  <span>Log In</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all duration-150 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAuthModal('guest')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-lg border border-indigo-500/30 hover:opacity-90 transition-opacity cursor-pointer"
                  title="Demo / Guest Creator Mode Active"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span className="hidden xs:inline">Try Demo</span>
                </button>
              </div>
            )}
          </div>

          {/* New Video Primary CTA */}
          <Link
            to="/upload"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-500/25 transition-all duration-150 whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>New Video</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-sub hover:text-main hover:bg-surface-sub transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-subtle bg-surface-main px-4 pt-3 pb-5 space-y-3 animate-slide-up">
          <nav className="flex flex-col space-y-1.5">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-sub hover:bg-surface-sub hover:text-main'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Auth Actions */}
          <div className="pt-2 border-t border-subtle grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }}
              className="px-3 py-2 text-xs font-semibold text-main bg-surface-sub rounded-xl border border-subtle flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); openAuthModal('signup'); }}
              className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          <div>
            <Link
              to="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md shadow-indigo-500/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Repurposing Video</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
