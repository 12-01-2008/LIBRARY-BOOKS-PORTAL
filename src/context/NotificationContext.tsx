import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LibraryNotification } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseClientConfigured } from '../services/supabaseClient';

interface NotificationContextType {
  notifications: LibraryNotification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  hasNewNotificationShake: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAsResolved: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLibrarian, token } = useAuth();
  const [notifications, setNotifications] = useState<LibraryNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotificationShake, setHasNewNotificationShake] = useState(false);
  const [latestToast, setLatestToast] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isLibrarian || !token) return;
    try {
      const res = await api.getNotifications(token);
      if (res.success) {
        // Detect if count increased for bell shake
        if (res.unreadCount > unreadCount && unreadCount > 0) {
          setHasNewNotificationShake(true);
          setTimeout(() => setHasNewNotificationShake(false), 2000);
        }
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to fetch librarian notifications:', err);
    }
  }, [isLibrarian, token, unreadCount]);

  useEffect(() => {
    if (!isLibrarian || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    // Polling fallback every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    // Supabase Realtime subscription if available
    let channel: any = null;
    if (isSupabaseClientConfigured && supabase) {
      try {
        channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            (payload) => {
              setHasNewNotificationShake(true);
              setTimeout(() => setHasNewNotificationShake(false), 2500);
              fetchNotifications();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel error:', err);
      }
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [isLibrarian, token, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.updateNotification(id, { is_read: true }, token || undefined);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      await api.updateNotification(id, { is_resolved: true, is_read: true }, token || undefined);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_resolved: true, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as resolved:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead(token || undefined);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        hasNewNotificationShake,
        openDrawer: () => setIsOpen(true),
        closeDrawer: () => setIsOpen(false),
        toggleDrawer: () => setIsOpen(prev => !prev),
        markAsRead,
        markAsResolved,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
