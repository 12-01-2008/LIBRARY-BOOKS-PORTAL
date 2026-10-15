import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  AlertTriangle, 
  MapPin, 
  Calendar,
  Layers,
  Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotificationContext } from '../context/NotificationContext';
import { api } from '../services/api';
import { Book, LibrarianStats, AvailabilityStatus } from '../types';
import { StatsOverview } from '../components/librarian/StatsOverview';
import { BookFormModal } from '../components/librarian/BookFormModal';
import { IssueReturnModal } from '../components/librarian/IssueReturnModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ToastContainer, ToastMessage } from '../components/common/Toast';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { isLibrarian, token } = useAuth();
  const { refreshNotifications } = useNotificationContext();
  const navigate = useNavigate();

  const [stats, setStats] = useState<LibrarianStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [searchTable, setSearchTable] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [issueReturnData, setIssueReturnData] = useState<{ mode: 'issue' | 'return'; book: Book } | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Protect route
  useEffect(() => {
    if (!isLibrarian) {
      navigate('/librarian/login', { replace: true });
    }
  }, [isLibrarian, navigate]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, booksRes, subRes] = await Promise.all([
        api.getStats(token || undefined),
        api.getBooks({ limit: 100 }),
        api.getSubjects(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (booksRes.success) setBooks(booksRes.data);
      if (subRes.success) setSubjects(subRes.data);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isLibrarian) {
      loadDashboardData();
    }
  }, [isLibrarian, loadDashboardData]);

  // Handle Book Form Submit (Create or Edit)
  const handleBookSubmit = async (formData: Partial<Book>) => {
    if (bookToEdit) {
      const res = await api.updateBook(bookToEdit.id, formData, token || undefined);
      if (res.success) {
        addToast('success', `Updated "${formData.title}" in catalog`);
        loadDashboardData();
      }
    } else {
      const res = await api.createBook(formData, token || undefined);
      if (res.success) {
        addToast('success', `Added "${formData.title}" to catalog`);
        loadDashboardData();
      }
    }
  };

  // Handle Delete Book
  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    try {
      const res = await api.deleteBook(bookToDelete.id, token || undefined);
      if (res.success) {
        addToast('success', `Removed "${bookToDelete.title}" from library records`);
        setBookToDelete(null);
        loadDashboardData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Delete failed');
    }
  };

  // Handle Issue or Return Confirm
  const handleIssueReturnConfirm = async (dueDate?: string) => {
    if (!issueReturnData) return;
    const { mode, book } = issueReturnData;

    try {
      if (mode === 'issue') {
        const res = await api.issueBook(book.id, dueDate, token || undefined);
        if (res.success) {
          addToast('success', res.message);
          loadDashboardData();
          refreshNotifications();
        }
      } else {
        const res = await api.returnBook(book.id, undefined, token || undefined);
        if (res.success) {
          addToast('success', res.message);
          loadDashboardData();
          refreshNotifications();
        }
      }
    } catch (err: any) {
      addToast('error', err.message || 'Action failed');
    }
  };

  // Filter books for the table
  const filteredBooks = books.filter(b => {
    const matchesSearch = !searchTable || 
      b.title.toLowerCase().includes(searchTable.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTable.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchTable.toLowerCase()) ||
      b.shelf_location.toLowerCase().includes(searchTable.toLowerCase());

    const matchesSubject = subjectFilter === 'all' || b.subject.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-academic text-[var(--color-text-main)]">
            Librarian Command Desk
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Live catalog inventory, loan check-outs, returns, and student hold notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/librarian/requests')}
            className="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-main)] text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Inbox className="w-4 h-4 text-indigo-400" />
            <span>Student Hold Queue</span>
          </button>

          <button
            onClick={() => {
              setBookToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsOverview stats={stats} isLoading={isLoading} />

      {/* Books Table Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        
        {/* Table Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="Search table by title, author, ISBN, or shelf..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text-main)] focus:outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button
              onClick={() => loadDashboardData()}
              className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
              title="Refresh inventory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Title & Author</th>
                <th className="py-3 px-3">Discipline</th>
                <th className="py-3 px-3">Shelf Location</th>
                <th className="py-3 px-3">Availability</th>
                <th className="py-3 px-3">Expected Return</th>
                <th className="py-3 px-3 text-right">Quick Desk Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)]">
                    No books matched your search filters.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const isAvailable = book.available_copies > 0;
                  const isLow = isAvailable && book.available_copies <= 2;
                  const status: AvailabilityStatus = isAvailable ? (isLow ? 'Limited' : 'Available') : 'Unavailable';

                  return (
                    <tr key={book.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                      {/* Title & ISBN */}
                      <td className="py-3.5 px-3 max-w-[260px]">
                        <p className="font-bold text-[var(--color-text-main)] truncate font-serif-academic text-sm">
                          {book.title}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                          by {book.author}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono-code">
                          ISBN: {book.isbn}
                        </p>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] font-medium text-[11px]">
                          {book.subject}
                        </span>
                      </td>

                      {/* Shelf */}
                      <td className="py-3.5 px-3 max-w-[180px]">
                        <div className="flex items-center gap-1 font-semibold text-[var(--color-text-main)]">
                          <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="truncate">{book.shelf_location}</span>
                        </div>
                      </td>

                      {/* Available copies badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <Badge
                          status={status}
                          availableCopies={book.available_copies}
                          totalCopies={book.total_copies}
                          size="sm"
                        />
                      </td>

                      {/* Expected return */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {!isAvailable && book.expected_return_date ? (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(book.expected_return_date).toLocaleDateString()}</span>
                          </div>
                        ) : !isAvailable ? (
                          <span className="text-[11px] text-slate-400">Not confirmed</span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">On shelf</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Issue copy button */}
                          <button
                            disabled={book.available_copies <= 0}
                            onClick={() => setIssueReturnData({ mode: 'issue', book })}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-[var(--color-accent)] hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 transition-colors"
                            title="Issue copy (Check out)"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          {/* Return copy button */}
                          <button
                            disabled={book.available_copies >= book.total_copies}
                            onClick={() => setIssueReturnData({ mode: 'return', book })}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-600 hover:text-white disabled:opacity-30 transition-colors"
                            title="Return copy (Check in)"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>

                          {/* Edit book button */}
                          <button
                            onClick={() => {
                              setBookToEdit(book);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit book records"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete book button */}
                          <button
                            onClick={() => setBookToDelete(book)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete book from catalog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Book Form Modal */}
      <BookFormModal
        isOpen={isFormOpen}
        bookToEdit={bookToEdit}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleBookSubmit}
        subjects={subjects}
      />

      {/* Issue / Return Modal */}
      <IssueReturnModal
        isOpen={Boolean(issueReturnData)}
        mode={issueReturnData?.mode || 'issue'}
        book={issueReturnData?.book || null}
        onClose={() => setIssueReturnData(null)}
        onConfirm={handleIssueReturnConfirm}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(bookToDelete)}
        title="Delete Book Record?"
        message={`Are you sure you want to permanently delete "${bookToDelete?.title}" from the catalog? This will remove all associated loans and history.`}
        confirmLabel="Delete Book"
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookToDelete(null)}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
};
