import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BellRing, CheckCircle2, AlertCircle, Send, ShieldCheck } from 'lucide-react';
import { Book } from '../../types';
import { api } from '../../services/api';

interface RequestNotifyModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const RequestNotifyModal: React.FC<RequestNotifyModalProps> = ({
  book,
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentContact, setStudentContact] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !book) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentContact.trim()) {
      setError('Please provide your name and contact info (email or student ID).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.submitBookRequest(book.id, {
        student_name: studentName.trim(),
        student_contact: studentContact.trim(),
        message: message.trim() || undefined,
      });

      if (res.success) {
        setIsSuccess(true);
        onSuccessToast?.(`Hold request logged for "${book.title}". Librarians notified!`);
        setTimeout(() => {
          setIsSuccess(false);
          setStudentName('');
          setStudentContact('');
          setMessage('');
          onClose();
        }, 2200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
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
          className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-7 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-main)] font-serif-academic">
                Request Recorded!
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto leading-relaxed">
                Our campus librarians have been alerted. We will notify <strong className="text-[var(--color-text-main)]">{studentContact}</strong> the moment a copy is scanned back onto the shelf.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-[var(--color-accent)] flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-main)] font-serif-academic">
                    Ask the Library / Notify Me
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    For <strong className="text-[var(--color-text-main)]">{book.title}</strong>
                  </p>
                </div>
              </div>

              {/* Friendly availability context */}
              <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-2xl p-3.5 mb-5 text-xs text-[var(--color-text-muted)] space-y-1">
                <p>
                  Current Shelf Status: <strong className="text-[var(--color-text-main)]">{book.available_copies} of {book.total_copies} Copies Available</strong>
                </p>
                {book.expected_return_date ? (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    Earliest active loan is due on: {new Date(book.expected_return_date).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-slate-400">
                    No confirmed loan return date yet. Asking prompts librarians to locate copies or verify reserves.
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 mb-4 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1.5">
                    Your Full Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1.5">
                    Email, Student ID, or Phone <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentContact}
                    onChange={(e) => setStudentContact(e.target.value)}
                    placeholder="e.g. maya.lin@college.edu or STU-88210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1.5">
                    Optional Note to Librarian
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Need this for CS482 final project by next Friday..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Spam-protected & rate-limited
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text-main)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
