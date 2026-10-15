import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, BellRing, Eye, BookOpen } from 'lucide-react';
import { Book, AvailabilityStatus } from '../../types';
import { Badge } from '../common/Badge';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onRequestNotify: (book: Book) => void;
  isLibrarian?: boolean;
}

// Calculate relative date hint (e.g. "in 3 days", "today", "tomorrow", "overdue")
export function getRelativeDueDateHint(dateStr?: string | null): string {
  if (!dateStr) return 'Return date not confirmed yet';
  const target = new Date(dateStr);
  const now = new Date();
  
  // Strip time for clean day comparison
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`;
  } else if (diffDays === 0) {
    return 'Due back today';
  } else if (diffDays === 1) {
    return 'Due back tomorrow';
  } else if (diffDays <= 7) {
    return `Due back in ${diffDays} days`;
  } else {
    return `Due back on ${target.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
  }
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelect,
  onRequestNotify,
  isLibrarian,
}) => {
  const isAvailable = book.available_copies > 0;
  const isLimited = book.available_copies > 0 && book.available_copies <= 2;
  const status: AvailabilityStatus = isAvailable
    ? (isLimited ? 'Limited' : 'Available')
    : 'Unavailable';

  const relativeReturnHint = !isAvailable ? getRelativeDueDateHint(book.expected_return_date) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-300"
    >
      <div>
        {/* Top Badges: Subject & Availability Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)] truncate max-w-[150px]">
            {book.subject}
          </span>

          <Badge
            status={status}
            availableCopies={book.available_copies}
            totalCopies={book.total_copies}
          />
        </div>

        {/* Book Cover & Title Info */}
        <div className="flex gap-4 mb-3.5">
          <div
            onClick={() => onSelect(book)}
            className="cursor-pointer relative shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-muted)] border border-[var(--color-border)] group-hover:scale-103 transition-transform duration-300"
          >
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[var(--color-text-muted)]">
                <BookOpen className="w-6 h-6 mb-1 text-amber-500" />
                <span className="text-[10px] leading-tight font-serif-academic">{book.title.slice(0, 20)}</span>
              </div>
            )}
            <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/40 to-transparent" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              onClick={() => onSelect(book)}
              className="text-sm sm:text-base font-bold text-[var(--color-text-main)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 cursor-pointer font-serif-academic leading-snug mb-1"
            >
              {book.title}
            </h3>

            <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mb-2 font-medium">
              by {book.author}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
              {book.edition && (
                <span className="bg-[var(--color-surface-muted)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                  {book.edition}
                </span>
              )}
              {book.publication_year && <span>{book.publication_year}</span>}
              <span className="font-mono-code text-[10px] text-slate-400">
                ISBN: {book.isbn.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        {/* Shelf location */}
        <div className="bg-[var(--color-surface-muted)]/70 border border-[var(--color-border)] rounded-xl p-2.5 mb-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[var(--color-text-main)] font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="truncate">{book.shelf_location}</span>
          </div>
        </div>

        {/* Return date alert if Unavailable */}
        {!isAvailable && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 mb-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <div className="truncate">
              <span className="font-bold">{relativeReturnHint}</span>
              {book.expected_return_date && (
                <span className="text-[11px] opacity-80 block sm:inline sm:ml-1">
                  ({new Date(book.expected_return_date).toLocaleDateString()})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2.5 border-t border-[var(--color-border)] flex items-center gap-2">
        <button
          onClick={() => onSelect(book)}
          className="flex-1 py-2 px-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-main)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>View Details</span>
        </button>

        {/* Notify Me / Ask Library on unavailable or limited copies */}
        {(!isAvailable || isLimited) && (
          <button
            onClick={() => onRequestNotify(book)}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            title="Get notified when a copy is back on shelf"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Notify Me</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
