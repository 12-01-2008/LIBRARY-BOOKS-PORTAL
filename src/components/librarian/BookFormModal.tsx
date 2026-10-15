import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookPlus, Edit3, AlertCircle, Save } from 'lucide-react';
import { Book } from '../../types';

interface BookFormModalProps {
  isOpen: boolean;
  bookToEdit: Book | null;
  onClose: () => void;
  onSubmit: (formData: Partial<Book>) => Promise<void>;
  subjects: string[];
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  bookToEdit,
  onClose,
  onSubmit,
  subjects,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: 'Computer Science',
    isbn: '',
    total_copies: 5,
    available_copies: 5,
    shelf_location: 'Floor 2, North Wing, Shelf CS-01-A',
    cover_url: '',
    description: '',
    edition: '1st Edition',
    publisher: '',
    publication_year: 2024,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        title: bookToEdit.title || '',
        author: bookToEdit.author || '',
        subject: bookToEdit.subject || 'Computer Science',
        isbn: bookToEdit.isbn || '',
        total_copies: bookToEdit.total_copies ?? 1,
        available_copies: bookToEdit.available_copies ?? 1,
        shelf_location: bookToEdit.shelf_location || '',
        cover_url: bookToEdit.cover_url || '',
        description: bookToEdit.description || '',
        edition: bookToEdit.edition || '1st Edition',
        publisher: bookToEdit.publisher || '',
        publication_year: bookToEdit.publication_year || 2024,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        subject: 'Computer Science',
        isbn: `978${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        total_copies: 5,
        available_copies: 5,
        shelf_location: 'Floor 2, North Wing, Shelf CS-01-A',
        cover_url: '',
        description: '',
        edition: '1st Edition',
        publisher: '',
        publication_year: 2024,
      });
    }
    setError(null);
  }, [bookToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.available_copies > formData.total_copies) {
      setError('Available copies cannot exceed total copies.');
      return;
    }

    if (formData.available_copies < 0 || formData.total_copies < 1) {
      setError('Copies count must be non-negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save book record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-7 shadow-2xl relative my-6"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[var(--color-accent)] flex items-center justify-center">
              {bookToEdit ? <Edit3 className="w-5 h-5" /> : <BookPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text-main)] font-serif-academic">
                {bookToEdit ? 'Edit Book Record' : 'Add New Book to Catalog'}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Keep the college library inventory up to date
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 mb-4 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Author(s) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Andrew S. Tanenbaum"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Academic Subject *
                </label>
                <input
                  type="text"
                  required
                  list="subjects-datalist"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
                <datalist id="subjects-datalist">
                  {subjects.map(s => <option key={s} value={s} />)}
                  <option value="Computer Science" />
                  <option value="Mathematics" />
                  <option value="Engineering" />
                  <option value="Biology & Medicine" />
                  <option value="Economics" />
                  <option value="Physics" />
                  <option value="Psychology" />
                  <option value="Philosophy & Law" />
                </datalist>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  ISBN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="e.g. 9780132350884"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 font-mono-code"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Shelf Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shelf_location}
                  onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                  placeholder="e.g. Floor 2, North Wing, Shelf CS-04-B"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Total Copies in Library *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.total_copies}
                  onChange={(e) => {
                    const total = parseInt(e.target.value) || 1;
                    setFormData({
                      ...formData,
                      total_copies: total,
                      available_copies: Math.min(formData.available_copies, total)
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Available Copies on Shelf *
                </label>
                <input
                  type="number"
                  min={0}
                  max={formData.total_copies}
                  required
                  value={formData.available_copies}
                  onChange={(e) => setFormData({ ...formData, available_copies: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Edition
                </label>
                <input
                  type="text"
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  placeholder="e.g. 3rd Edition"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Publication Year
                </label>
                <input
                  type="number"
                  value={formData.publication_year}
                  onChange={(e) => setFormData({ ...formData, publication_year: parseInt(e.target.value) || 2024 })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.cover_url}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[var(--color-text-main)] mb-1">
                  Description / Syllabus Topics
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key concepts, topics, or course tags..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text-main)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{bookToEdit ? 'Save Changes' : 'Add to Catalog'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
