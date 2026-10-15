import { useState, useEffect, useCallback } from 'react';
import { Book, PaginationMeta } from '../types';
import { api } from '../services/api';
import { useDebounce } from './useDebounce';

interface UseBooksOptions {
  initialQuery?: string;
  initialSubject?: string;
  initialAvailable?: string;
  initialPage?: number;
  initialLimit?: number;
  debounceMs?: number;
}

export function useBooks(options: UseBooksOptions = {}) {
  const [searchQuery, setSearchQuery] = useState(options.initialQuery || '');
  const [selectedSubject, setSelectedSubject] = useState(options.initialSubject || 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState(options.initialAvailable || 'all');
  const [page, setPage] = useState(options.initialPage || 1);
  const [limit, setLimit] = useState(options.initialLimit || 12);
  const [sort, setSort] = useState('title');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, options.debounceMs || 300);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getBooks({
        q: debouncedQuery,
        subject: selectedSubject,
        available: availabilityFilter,
        page,
        limit,
        sort,
        order,
      });

      if (res.success) {
        setBooks(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch books catalog');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, selectedSubject, availabilityFilter, page, limit, sort, order]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Reset to page 1 when search or filters change
  const handleQueryChange = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  const handleSubjectChange = (sub: string) => {
    setSelectedSubject(sub);
    setPage(1);
  };

  const handleAvailabilityChange = (status: string) => {
    setAvailabilityFilter(status);
    setPage(1);
  };

  return {
    books,
    pagination,
    isLoading,
    error,
    searchQuery,
    setSearchQuery: handleQueryChange,
    selectedSubject,
    setSelectedSubject: handleSubjectChange,
    availabilityFilter,
    setAvailabilityFilter: handleAvailabilityChange,
    page,
    setPage,
    limit,
    setLimit,
    sort,
    setSort,
    order,
    setOrder,
    refetch: fetchBooks,
  };
}
