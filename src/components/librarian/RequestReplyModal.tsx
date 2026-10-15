import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { LibraryNotification, BookRequest } from '../../types';

interface RequestReplyModalProps {
  item: LibraryNotification | BookRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmInformed: (id: string, notes?: string) => Promise<void>;
}

export const RequestReplyModal: React.FC<RequestReplyModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmInformed,
}) => {
  const [librarianNote, setLibrarianNote] = useState('Notified student: copy reserved at circulation desk.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const studentName = 'student_name' in item ? item.student_name : 'Student';
  const studentContact = 'student_contact' in item ? item.student_contact : '';
  const bookTitle = 'book_title' in item ? item.book_title : '';
  const requestId = 'request_id' in item ? (item.request_id || item.id) : item.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmInformed(requestId, librarianNote);
      onClose();
    } catch (err) {
      console.error(err);
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[var(--color-accent)] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-main)] font-serif-academic">
                Inform Student & Mark Resolved
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Record staff communication with student
              </p>
            </div>
          </div>

          {/* Student details */}
          <div className="p-3 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-xs space-y-1 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)]">Book:</span>
              <strong className="text-[var(--color-text-main)] truncate max-w-[220px]">{bookTitle}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)]">Student:</span>
              <span className="font-semibold text-[var(--color-text-main)]">{studentName} ({studentContact})</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--color-text-main)] mb-1.5">
                Communication Method / Resolution Note
              </label>
              <textarea
                rows={3}
                required
                value={librarianNote}
                onChange={(e) => setLibrarianNote(e.target.value)}
                placeholder="e.g. Sent email confirming copy is held at front desk until Friday 5pm."
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Mark Informed'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
