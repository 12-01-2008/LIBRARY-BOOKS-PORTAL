import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AvailabilityStatus } from '../../types';

interface BadgeProps {
  status: AvailabilityStatus;
  availableCopies?: number;
  totalCopies?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  availableCopies,
  totalCopies,
  showIcon = true,
  size = 'md',
}) => {
  const configs: Record<AvailabilityStatus, {
    bg: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }> = {
    Available: {
      bg: 'bg-[var(--color-available-bg)] text-[var(--color-available)] border-[var(--color-available)]/30',
      dot: 'bg-[var(--color-available)] shadow-[0_0_8px_rgba(79,143,107,0.6)]',
      icon: CheckCircle2,
      label: availableCopies !== undefined && totalCopies !== undefined
        ? `${availableCopies} of ${totalCopies} Available`
        : 'Available',
    },
    Limited: {
      bg: 'bg-[var(--color-limited-bg)] text-[var(--color-limited)] border-[var(--color-limited)]/30',
      dot: 'bg-[var(--color-limited)] shadow-[0_0_8px_rgba(217,130,43,0.6)] animate-pulse',
      icon: AlertTriangle,
      label: availableCopies !== undefined && totalCopies !== undefined
        ? `Only ${availableCopies} of ${totalCopies} Left`
        : 'Limited Stock',
    },
    Unavailable: {
      bg: 'bg-[var(--color-unavailable-bg)] text-[var(--color-unavailable)] border-[var(--color-unavailable)]/30',
      dot: 'bg-[var(--color-unavailable)]',
      icon: XCircle,
      label: totalCopies !== undefined
        ? `0 of ${totalCopies} Available`
        : 'Unavailable',
    },
  };

  const current = configs[status] || configs.Available;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center rounded-full font-semibold border ${current.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">{current.label}</span>
    </motion.span>
  );
};
