import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  BookOpen, 
  BellRing, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  ShieldCheck,
  Building
} from 'lucide-react';
import { api } from '../services/api';
import { Book, AvailabilityStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { getRelativeDueDateHint } from '../components/books/BookCard';
import { RequestNotifyModal } from '../components/books/RequestNotifyModal';

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<(Book & { active_loans?: any[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    api.getBookById(id)
      .then(res => {
        if (res.success) {
          setBook(res.data);
          if (res.data.available_copies <= 0) {
            api.recordBookView(id).catch(() => {});
          }
        }
      })
      .catch(err => setError(err.message || 'Book not found'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--color-text-muted)] font-medium">Looking up library catalog records...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif-academic text-[var(--color-text-main)]">
          Book Not Found
        </h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {error || 'This book ID does not match any current catalog records.'}
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isAvailable = book.available_copies > 0;
  const isLimited = book.available_copies > 0 && book.available_copies <= 2;
  const status: AvailabilityStatus = isAvailable
    ? (isLimited ? 'Limited' : 'Available')
    : 'Unavailable';

  const relativeHint = getRelativeDueDateHint(book.expected_return_date);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Back button */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to catalog</span>
      </Link>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Main layout */}
        <div className="flex flex-col sm:flex-row gap-8">
          
          {/* Cover image */}
          <div className="shrink-0 mx-auto sm:mx-0 w-44 h-64 sm:w-52 sm:h-72 rounded-2xl overflow-hidden shadow-md bg-[var(--color-surface-muted)] border border-[var(--color-border)] relative">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <BookOpen className="w-12 h-12 text-amber-500 mb-2" />
                <span className="text-xs font-serif-academic text-[var(--color-text-muted)]">Campus Collection</span>
              </div>
            )}
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  {book.subject}
                </span>
                <Badge
                  status={status}
                  availableCopies={book.available_copies}
                  totalCopies={book.total_copies}
                  size="md"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-serif-academic text-[var(--color-text-main)] leading-tight">
                {book.title}
              </h1>
              <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">
                by {book.author}
              </p>
            </div>

            {/* Physical location */}
            <div className="p-4 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[var(--color-text-main)]">
                <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Physical Shelf Location:</span>
              </div>
              <p className="pl-6 text-sm font-mono-code font-bold text-[var(--color-text-main)]">
                {book.shelf_location}
              </p>
              <div className="pl-6 flex flex-wrap gap-4 text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]/60">
                <span>ISBN: <strong className="text-[var(--color-text-main)]">{book.isbn}</strong></span>
                {book.publisher && <span>Publisher: {book.publisher}</span>}
                {book.edition && <span>Edition: {book.edition}</span>}
                {book.publication_year && <span>Year: {book.publication_year}</span>}
              </div>
            </div>

            {/* Availability / Expected Return Date */}
            {!isAvailable ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2 font-bold">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Expected Back on Shelf:</span>
                </div>
                <p className="pl-6 text-base font-bold">
                  {relativeHint}
                  {book.expected_return_date && (
                    <span className="text-xs font-normal opacity-85 ml-2">
                      ({new Date(book.expected_return_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })})
                    </span>
                  )}
                </p>
                <div className="pl-6 pt-1">
                  <button
                    onClick={() => setShowNotifyModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Ask the Library / Notify Me</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Ready for checkout at the front desk ({book.available_copies} copies currently on shelf).</span>
                </div>
              </div>
            )}

            {book.description && (
              <div className="pt-2 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-serif-academic">
                  Description & Syllabus Overview
                </h3>
                <p className="text-xs text-[var(--color-text-main)] leading-relaxed">
                  {book.description}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      <RequestNotifyModal
        book={book}
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
      />

    </div>
  );
};
