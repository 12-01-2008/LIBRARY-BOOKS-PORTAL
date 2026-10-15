import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Book } from '../../types';

interface IssueReturnModalProps {
  isOpen: boolean;
  mode: 'issue' | 'return';
  book: Book | null;
  onClose: () => void;
  onConfirm: (dueDate?: string) => Promise<void>;
}

export const IssueReturnModal: React.FC<IssueReturnModalProps> = ({
  isOpen,
  mode,
  book,
  onClose,
  onConfirm,
}) => {
  // Default due date: 14 days from today formatted as YYYY-MM-DD
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState<string>(defaultDueDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !book) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'issue') {
        await onConfirm(dueDate);
      } else {
        await onConfirm();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              mode === 'issue'
                ? 'bg-amber-500/10 text-[var(--color-accent)]'
                : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {mode === 'issue' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-main)] font-serif-academic">
                {mode === 'issue' ? 'Issue Book to Student' : 'Process Book Return'}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[260px]">
                {book.title}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 mb-4 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'issue' ? (
              <>
                <div className="p-3 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span>Current Available Copies:</span>
                    <strong className="text-[var(--color-text-main)]">{book.available_copies} of {book.total_copies}</strong>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>After Checkout:</span>
                    <strong>{book.available_copies - 1} Remaining</strong>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--color-text-main)] mb-1.5">
                    Loan Due Date (Default 14 Days)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    The student must return this volume by 5:00 PM on the due date.
                  </p>
                </div>
              </>
            ) : (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ready to restock this copy
                </p>
                <p className="text-[11px] opacity-90">
                  Returning this copy will increase shelf availability from <strong className="font-bold">{book.available_copies}</strong> to <strong className="font-bold">{book.available_copies + 1}</strong>.
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                  * If any students requested notification for this title, an alert will be flagged immediately!
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                  mode === 'issue'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isSubmitting ? 'Processing...' : mode === 'issue' ? 'Issue Book' : 'Confirm Return'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
