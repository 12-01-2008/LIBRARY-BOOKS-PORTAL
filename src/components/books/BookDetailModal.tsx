import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  BookOpen, 
  BellRing, 
  Building2, 
  CheckCircle2, 
  Layers, 
  AlertTriangle,
  BookmarkCheck,
  Send
} from 'lucide-react';
import { Book, AvailabilityStatus } from '../../types';
import { Badge } from '../common/Badge';
import { getRelativeDueDateHint } from './BookCard';
import { api } from '../../services/api';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestNotify: (book: Book) => void;
  isLibrarian?: boolean;
  onIssueClick?: (book: Book) => void;
  onReturnClick?: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onRequestNotify,
  isLibrarian,
  onIssueClick,
  onReturnClick,
}) => {
  const [detailData, setDetailData] = useState<(Book & { active_loans?: any[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!book || !isOpen) return;

    setDetailData(book);
    setIsLoading(true);

    // Record unavailable book view for librarian demand tracking
    if (book.available_copies <= 0) {
      api.recordBookView(book.id).catch(() => {});
    }

    // Fetch detailed book data with loan list
    api.getBookById(book.id)
      .then(res => {
        if (res.success) {
          setDetailData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const currentBook = detailData || book;
  const isAvailable = currentBook.available_copies > 0;
  const isLimited = currentBook.available_copies > 0 && currentBook.available_copies <= 2;
  const status: AvailabilityStatus = isAvailable
    ? (isLimited ? 'Limited' : 'Available')
    : 'Unavailable';

  const relativeHint = getRelativeDueDateHint(currentBook.expected_return_date);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row gap-6">
            
            {/* Book Cover Visual */}
            <div className="shrink-0 mx-auto sm:mx-0 w-36 h-52 sm:w-44 sm:h-64 rounded-2xl overflow-hidden shadow-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] relative">
              {currentBook.cover_url ? (
                <img
                  src={currentBook.cover_url}
                  alt={currentBook.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <BookOpen className="w-10 h-10 text-amber-500 mb-2" />
                  <span className="text-xs font-serif-academic text-[var(--color-text-muted)]">No Cover Image</span>
                </div>
              )}
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent" />
            </div>

            {/* Info Column */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                    {currentBook.subject}
                  </span>
                  <Badge
                    status={status}
                    availableCopies={currentBook.available_copies}
                    totalCopies={currentBook.total_copies}
                  />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-main)] font-serif-academic leading-tight">
                  {currentBook.title}
                </h2>
                <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
                  by {currentBook.author}
                </p>
              </div>

              {/* Physical Shelf Navigator Card */}
              <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[var(--color-text-main)]">
                  <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>Physical Shelf Location:</span>
                </div>
                <p className="pl-6 text-[var(--color-text-main)] font-mono-code font-semibold">
                  {currentBook.shelf_location}
                </p>
                <div className="pl-6 flex flex-wrap gap-4 text-[11px] text-[var(--color-text-muted)] pt-1">
                  <span>ISBN: <strong className="text-[var(--color-text-main)]">{currentBook.isbn}</strong></span>
                  {currentBook.publisher && <span>Publisher: {currentBook.publisher}</span>}
                  {currentBook.edition && <span>Edition: {currentBook.edition}</span>}
                </div>
              </div>

              {/* Expected Return Date Card */}
              {!isAvailable ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-2 font-bold">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Expected Back on Shelf:</span>
                  </div>
                  <p className="pl-6 text-sm font-bold">
                    {relativeHint}
                    {currentBook.expected_return_date && (
                      <span className="text-xs font-normal opacity-85 ml-1.5">
                        ({new Date(currentBook.expected_return_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })})
                      </span>
                    )}
                  </p>
                  <p className="pl-6 text-[11px] text-[var(--color-text-muted)]">
                    Calculated from the earliest due date among checked-out copies.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Ready for immediate checkout at the circulation desk!
                  </span>
                </div>
              )}

              {/* Synopsis */}
              {currentBook.description && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Overview
                  </h4>
                  <p className="text-xs text-[var(--color-text-main)] leading-relaxed">
                    {currentBook.description}
                  </p>
                </div>
              )}

              {/* Active Loans List (if available and librarian) */}
              {currentBook.active_loans && currentBook.active_loans.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-bold text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Active Loan Due Dates ({currentBook.active_loans.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentBook.active_loans.map((loan: any, idx: number) => (
                      <div
                        key={loan.id || idx}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          loan.is_overdue
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 font-bold'
                            : 'bg-[var(--color-surface-muted)] border-[var(--color-border)] text-[var(--color-text-main)]'
                        }`}
                      >
                        <span>Copy #{idx + 1}</span>
                        <span>Due: {new Date(loan.due_date).toLocaleDateString()} {loan.is_overdue && '(Overdue)'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--color-text-muted)]">
              {currentBook.available_copies} of {currentBook.total_copies} physical copies in building
            </span>

            <div className="flex items-center gap-2">
              {isLibrarian && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onIssueClick?.(currentBook);
                    }}
                    disabled={currentBook.available_copies <= 0}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors disabled:opacity-50"
                  >
                    Issue Copy
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onReturnClick?.(currentBook);
                    }}
                    disabled={currentBook.available_copies >= currentBook.total_copies}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                  >
                    Return Copy
                  </button>
                </>
              )}

              {(!isAvailable || isLimited) && (
                <button
                  onClick={() => {
                    onClose();
                    onRequestNotify(currentBook);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Ask Library / Notify Me</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
