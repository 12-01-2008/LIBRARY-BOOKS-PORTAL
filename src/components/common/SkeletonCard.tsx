import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm overflow-hidden relative">
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="space-y-4"
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Media & Details */}
        <div className="flex gap-4">
          <div className="w-20 h-28 sm:w-24 sm:h-32 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mt-2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          </div>
        </div>

        {/* Shelf banner placeholder */}
        <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />

        {/* Footer actions */}
        <div className="pt-2 border-t border-[var(--color-border)] flex gap-2">
          <div className="h-8 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </motion.div>
    </div>
  );
};
