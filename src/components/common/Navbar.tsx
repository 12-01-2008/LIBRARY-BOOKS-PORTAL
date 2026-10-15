import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Bell, 
  Inbox, 
  LayoutDashboard,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationContext } from '../../context/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, isLibrarian, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount, toggleDrawer, hasNewNotificationShake } = useNotificationContext();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--color-bg)]/90 border-b border-[var(--color-border)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-2xl bg-[var(--color-primary)] text-amber-400 p-[1px] shadow-md flex items-center justify-center transition-transform"
          >
            <div className="w-full h-full bg-[var(--color-primary)] rounded-2xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-[var(--color-text-main)] font-serif-academic">
                BiblioSphere
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5" /> Campus Library
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] hidden sm:block">
              Live Shelf Availability & Student Portal
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
          <Link
            to="/catalog"
            className={`px-3.5 py-2 rounded-xl transition-colors ${
              isActive('/catalog')
                ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-main)] font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)]/60'
            }`}
          >
            Browse Catalog
          </Link>

          {isLibrarian && (
            <>
              <Link
                to="/librarian/dashboard"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors ${
                  isActive('/librarian/dashboard')
                    ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-main)] font-bold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)]/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-500" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/librarian/requests"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors ${
                  isActive('/librarian/requests')
                    ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-main)] font-bold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)]/60'
                }`}
              >
                <Inbox className="w-4 h-4 text-indigo-400" />
                <span>Student Holds</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)] transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </motion.button>

          {/* Librarian Notification Bell */}
          {isLibrarian && (
            <motion.button
              animate={hasNewNotificationShake ? { rotate: [-15, 15, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.6 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDrawer}
              className="relative p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)] transition-colors"
              title="Librarian Alerts"
              aria-label="View Librarian Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Librarian Portal Button / User Menu */}
          {isLibrarian ? (
            <div className="flex items-center gap-2">
              <span className="hidden xl:inline-block text-xs font-semibold text-[var(--color-text-muted)]">
                {user?.name || user?.email}
              </span>
              <button
                onClick={() => logout()}
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/librarian/login"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Staff Desk</span>
            </Link>
          )}

        </div>

      </div>
    </header>
  );
};
