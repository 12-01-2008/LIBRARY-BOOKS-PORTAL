import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  GraduationCap, 
  Database, 
  Bookmark, 
  Sparkles,
  Lock,
  X,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SupabaseConfig, UserRoleState } from '../types/library';

interface HeaderProps {
  userRole: UserRoleState;
  onRoleChange: (role: 'student' | 'librarian') => void;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  onOpenReservationsDrawer: () => void;
  activeReservationsCount: number;
  totalBooksCount: number;
  availableBooksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  onRoleChange,
  supabaseConfig,
  onOpenSupabaseModal,
  onOpenReservationsDrawer,
  activeReservationsCount,
  totalBooksCount,
  availableBooksCount,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleLibrarianClick = () => {
    if (userRole.role === 'librarian') {
      onRoleChange('student');
    } else {
      setShowPinModal(true);
      setPinInput('');
      setPinError('');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or admin
    if (pinInput === '1234' || pinInput.toLowerCase() === 'admin') {
      onRoleChange('librarian');
      setShowPinModal(false);
      setPinInput('');
    } else {
      setPinError('Incorrect PIN (Default demo PIN is 1234)');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/25 flex items-center justify-center"
            >
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  BiblioSphere
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Campus Smart Library
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Real-Time Book Availability & Shelf Navigator
              </p>
            </div>
          </div>

          {/* Quick Metrics (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">{availableBooksCount}</span>
              <span>Copies Ready on Shelf</span>
            </div>
            <div className="text-slate-500">•</div>
            <div>
              <span className="font-semibold text-slate-200">{totalBooksCount}</span> Titles Cataloged
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Supabase Connection Pill */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenSupabaseModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/30'
                  : 'bg-slate-900 text-slate-300 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
              }`}
              title={supabaseConfig.isConnected ? 'Connected to Supabase' : 'Configure Supabase Database'}
            >
              <Database className={`w-3.5 h-3.5 ${supabaseConfig.isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline">
                {supabaseConfig.isConnected ? 'Supabase Live' : 'Supabase Setup'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfig.isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
            </motion.button>

            {/* Student Reservations Drawer Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenReservationsDrawer}
              className="relative p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2"
              title="My Holds & Reservations"
            >
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Holds</span>
              {activeReservationsCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {activeReservationsCount}
                </span>
              )}
            </motion.button>

            {/* Librarian Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLibrarianClick}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                userRole.role === 'librarian'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-orange-500/20'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {userRole.role === 'librarian' ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Librarian Mode</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Student View</span>
                  <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
                </>
              )}
            </motion.button>

          </div>
        </div>
      </header>

      {/* Librarian PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Key className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-center text-white mb-1">
                Librarian Access Portal
              </h3>
              <p className="text-xs text-slate-400 text-center mb-5">
                Enter your staff authorization PIN to manage book records, check-outs, and catalog stock.
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Security PIN (Demo: <span className="text-amber-400 font-mono">1234</span>)
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter PIN (e.g. 1234)"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  {pinError && (
                    <p className="text-xs text-rose-400 text-center mt-1.5 font-medium">
                      {pinError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinInput('1234');
                      onRoleChange('librarian');
                      setShowPinModal(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
                  >
                    Use Demo PIN
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
                  >
                    Unlock Desk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
