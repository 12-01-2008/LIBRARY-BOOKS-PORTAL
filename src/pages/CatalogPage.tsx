import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  SearchX, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/books/BookCard';
import { BookFilters } from '../components/books/BookFilters';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { BookDetailModal } from '../components/books/BookDetailModal';
import { RequestNotifyModal } from '../components/books/RequestNotifyModal';
import { api } from '../services/api';
import { Book } from '../types';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [notifyBook, setNotifyBook] = useState<Book | null>(null);

  const initialQ = searchParams.get('q') || '';
  const initialSub = searchParams.get('subject') || 'all';
  const initialAvail = searchParams.get('available') || 'all';

  const {
    books,
    pagination,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    availabilityFilter,
    setAvailabilityFilter,
    page,
    setPage,
    sort,
    setSort,
    refetch,
  } = useBooks({
    initialQuery: initialQ,
    initialSubject: initialSub,
    initialAvailable: initialAvail,
    initialLimit: 12,
  });

  // Sync URL search params
  useEffect(() => {
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedSubject !== 'all') params.subject = selectedSubject;
    if (availabilityFilter !== 'all') params.available = availabilityFilter;
    if (page > 1) params.page = page.toString();
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedSubject, availabilityFilter, page, setSearchParams]);

  // Load subject list
  useEffect(() => {
    api.getSubjects()
      .then(res => {
        if (res.success) setSubjects(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header banner */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-academic text-[var(--color-text-main)]">
          Library Catalog & Availability
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
          Real-time physical copy counts, exact shelf locations, and expected return dates.
        </p>
      </div>

      {/* Filters Toolbar */}
      <BookFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        availabilityFilter={availabilityFilter}
        onAvailabilityChange={setAvailabilityFilter}
        sort={sort}
        onSortChange={setSort}
        subjects={subjects}
        totalResults={pagination.total}
      />

      {/* Results Section */}
      {error ? (
        <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-500">
            {error}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 sm:p-16 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center space-y-4 max-w-lg mx-auto shadow-xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <SearchX className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-main)] font-serif-academic">
              No Matching Books Found
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
              We couldn't find any titles matching "{searchQuery}". Try searching by an author's last name or selecting "All Disciplines".
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
              setAvailabilityFilter('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
          >
            Clear All Filters
          </button>
        </motion.div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSelect={(b) => setSelectedBook(b)}
                  onRequestNotify={(b) => setNotifyBook(b)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                Showing page <strong className="text-[var(--color-text-main)]">{pagination.page}</strong> of <strong className="text-[var(--color-text-main)]">{pagination.totalPages}</strong> ({pagination.total} total items)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(pagination.page - 1)}
                  className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)] disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors ${
                      pagination.page === p
                        ? 'bg-[var(--color-primary)] text-white font-bold'
                        : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={!pagination.hasMore}
                  onClick={() => setPage(pagination.page + 1)}
                  className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)] disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Book Modals */}
      <BookDetailModal
        book={selectedBook}
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        onRequestNotify={(b) => setNotifyBook(b)}
      />

      <RequestNotifyModal
        book={notifyBook}
        isOpen={Boolean(notifyBook)}
        onClose={() => setNotifyBook(null)}
      />

    </div>
  );
};
