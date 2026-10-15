import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Inbox, 
  Search, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  User, 
  Mail, 
  ArrowLeft,
  RefreshCw,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BookRequest } from '../types';
import { RequestReplyModal } from '../components/librarian/RequestReplyModal';
import { ToastContainer, ToastMessage } from '../components/common/Toast';

export const RequestsPage: React.FC = () => {
  const { isLibrarian, token } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequestForReply, setSelectedRequestForReply] = useState<BookRequest | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    if (!isLibrarian) {
      navigate('/librarian/login', { replace: true });
    }
  }, [isLibrarian, navigate]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getRequests(
        { status: statusFilter, q: searchQuery },
        token || undefined
      );
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to fetch student requests');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, token]);

  useEffect(() => {
    if (isLibrarian) {
      loadRequests();
    }
  }, [isLibrarian, loadRequests]);

  const handleMarkInformed = async (id: string, notes?: string) => {
    try {
      const res = await api.updateRequest(id, { status: 'informed' }, token || undefined);
      if (res.success) {
        addToast('success', 'Student marked as informed!');
        loadRequests();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Update failed');
    }
  };

  const handleMarkResolved = async (id: string) => {
    try {
      const res = await api.updateRequest(id, { status: 'resolved' }, token || undefined);
      if (res.success) {
        addToast('success', 'Hold request marked as resolved.');
        loadRequests();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Update failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/librarian/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-academic text-[var(--color-text-main)]">
            Student Hold & Notification Requests
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Students who asked to be alerted when unavailable volumes are returned to the shelf.
          </p>
        </div>

        <button
          onClick={() => loadRequests()}
          className="p-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] bg-[var(--color-surface)] self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-2xl text-xs">
          {['all', 'pending', 'informed', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, contact, or book title..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs text-[var(--color-text-main)] focus:outline-none focus:border-amber-500"
          />
        </div>

      </div>

      {/* Requests Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Student & Contact</th>
                <th className="py-3 px-3">Requested Book</th>
                <th className="py-3 px-3">Note / Message</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Logged Date</th>
                <th className="py-3 px-3 text-right">Librarian Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--color-text-muted)]">
                    Loading student hold requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--color-text-muted)]">
                    No student hold requests found for this filter.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--color-surface-muted)]/40 transition-colors">
                    
                    {/* Student */}
                    <td className="py-3 px-3">
                      <p className="font-bold text-[var(--color-text-main)] text-sm">
                        {req.student_name}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {req.student_contact}
                      </p>
                    </td>

                    {/* Book */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="font-semibold text-[var(--color-text-main)] truncate font-serif-academic text-sm">
                        {req.book_title || 'Catalog Book'}
                      </p>
                    </td>

                    {/* Message */}
                    <td className="py-3 px-3 max-w-[240px]">
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate italic">
                        {req.message ? `"${req.message}"` : '—'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === 'pending'
                          ? 'bg-amber-500/15 text-[var(--color-accent)]'
                          : req.status === 'informed'
                          ? 'bg-sky-500/15 text-sky-500'
                          : 'bg-emerald-500/15 text-emerald-500'
                      }`}>
                        {req.status === 'pending' && <Clock className="w-3 h-3" />}
                        {req.status === 'informed' && <Send className="w-3 h-3" />}
                        {req.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                        <span className="capitalize">{req.status}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => setSelectedRequestForReply(req)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--color-accent)] text-slate-950 font-bold text-[11px] hover:bg-[var(--color-accent-hover)] transition-colors"
                          >
                            Reply & Inform
                          </button>
                        )}
                        {req.status !== 'resolved' && (
                          <button
                            onClick={() => handleMarkResolved(req.id)}
                            className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text-main)] text-[11px] font-semibold transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      <RequestReplyModal
        item={selectedRequestForReply}
        isOpen={Boolean(selectedRequestForReply)}
        onClose={() => setSelectedRequestForReply(null)}
        onConfirmInformed={handleMarkInformed}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />

    </div>
  );
};
