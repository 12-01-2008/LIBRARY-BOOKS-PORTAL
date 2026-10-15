import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  Eye, 
  BookMarked, 
  MessageSquare, 
  User, 
  MapPin, 
  Sparkles,
  Calendar
} from 'lucide-react';
import { useNotificationContext } from '../../context/NotificationContext';
import { LibraryNotification } from '../../types';

interface NotificationDrawerProps {
  onOpenReplyModal?: (notification: LibraryNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onOpenReplyModal }) => {
  const { 
    isOpen, 
    closeDrawer, 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAsResolved, 
    markAllAsRead 
  } = useNotificationContext();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDrawer}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[var(--color-accent)] flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-main)] font-serif-academic">
                    Librarian Alerts
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {unreadCount} unread student requests & interest
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 font-medium"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[var(--color-text-muted)]">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-sm text-[var(--color-text-main)]">
                    All caught up!
                  </h4>
                  <p className="text-xs mt-1">
                    No active student hold alerts or unavailable book searches at the moment.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isRequest = notif.type === 'request';
                  const isAvailableAlert = notif.type === 'book_available';
                  const isViewAlert = notif.type === 'view_unavailable';

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-all ${
                        !notif.is_read
                          ? 'bg-[var(--color-surface-muted)] border-amber-500/40 shadow-sm'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] opacity-85'
                      }`}
                    >
                      {/* Top Type Indicator & Time */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isRequest
                            ? 'bg-amber-500/15 text-[var(--color-accent)]'
                            : isAvailableAlert
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-indigo-500/15 text-indigo-400'
                        }`}>
                          {isRequest && <MessageSquare className="w-3 h-3" />}
                          {isAvailableAlert && <Sparkles className="w-3 h-3" />}
                          {isViewAlert && <Eye className="w-3 h-3" />}
                          {isRequest && 'Student Request'}
                          {isAvailableAlert && 'Copy Returned - Alert Waiting Student!'}
                          {isViewAlert && `Unavailable Search (${notif.view_count} student views)`}
                        </span>

                        <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Book Title */}
                      <h4 className="text-sm font-bold text-[var(--color-text-main)] leading-snug">
                        {notif.book_title}
                      </h4>

                      {/* Location & Status details */}
                      <div className="mt-2 text-xs text-[var(--color-text-muted)] space-y-1">
                        {notif.shelf_location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                            <span className="truncate">{notif.shelf_location}</span>
                          </div>
                        )}
                        {notif.expected_return_date && (
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>Due back on {new Date(notif.expected_return_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Student info if provided */}
                      {notif.student_name && (
                        <div className="mt-3 p-2.5 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--color-border)] text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-main)]">
                            <User className="w-3 h-3 text-indigo-400" />
                            <span>{notif.student_name}</span>
                            <span className="text-[11px] text-[var(--color-text-muted)] font-normal">
                              ({notif.student_contact})
                            </span>
                          </div>
                          {notif.message && (
                            <p className="text-[11px] text-[var(--color-text-muted)] italic">
                              "{notif.message}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                        {!notif.is_read ? (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                          >
                            Mark Read
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Read</span>
                        )}

                        <div className="flex items-center gap-2">
                          {isRequest && (
                            <button
                              onClick={() => {
                                onOpenReplyModal?.(notif);
                                markAsRead(notif.id);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--color-accent)] text-slate-950 hover:bg-[var(--color-accent-hover)] transition-colors"
                            >
                              Reply / Inform Student
                            </button>
                          )}

                          {!notif.is_resolved && (
                            <button
                              onClick={() => markAsResolved(notif.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[var(--color-border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text-main)]"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
