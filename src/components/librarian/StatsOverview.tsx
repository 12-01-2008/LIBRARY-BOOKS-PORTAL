import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  MessageSquare, 
  TrendingUp 
} from 'lucide-react';
import { LibrarianStats } from '../../types';

interface StatsOverviewProps {
  stats: LibrarianStats | null;
  isLoading?: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Catalog Titles',
      value: stats.total_books,
      sub: `${stats.total_copies} total copies`,
      icon: BookOpen,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'On Shelf Ready',
      value: stats.available_copies,
      sub: 'Available now',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Currently Issued',
      value: stats.issued_copies,
      sub: 'Active student loans',
      icon: Clock,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Low Stock (<3)',
      value: stats.low_stock_books,
      sub: 'High demand',
      icon: AlertTriangle,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Overdue Loans',
      value: stats.overdue_loans,
      sub: 'Past due date',
      icon: AlertOctagon,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      highlight: stats.overdue_loans > 0,
    },
    {
      label: 'Pending Holds',
      value: stats.pending_requests,
      sub: 'Student requests',
      icon: MessageSquare,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      highlight: stats.pending_requests > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-2xl bg-[var(--color-surface)] border transition-all ${
              item.highlight
                ? 'border-amber-500/50 shadow-sm'
                : 'border-[var(--color-border)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[var(--color-text-muted)] truncate">
                {item.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${item.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-bold font-serif-academic text-[var(--color-text-main)]">
              {item.value}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
              {item.sub}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};
