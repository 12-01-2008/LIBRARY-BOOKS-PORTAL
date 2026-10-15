import { Request, Response, NextFunction } from 'express';
import { memoryDb } from '../data/seedData.ts';
import { supabaseConfig } from '../config/supabase.ts';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data, error } = await supabaseConfig.client
        .from('notifications')
        .select(`
          id,
          type,
          book_id,
          request_id,
          view_count,
          is_read,
          is_resolved,
          created_at,
          books (
            title,
            shelf_location,
            available_copies
          ),
          book_requests (
            student_name,
            student_contact,
            message
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Failed to fetch notifications from Supabase: ${error.message}. In-memory fallback is disabled.`
        });
      }

      const formatted = (data || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        book_id: n.book_id,
        request_id: n.request_id,
        view_count: n.view_count,
        is_read: n.is_read,
        is_resolved: n.is_resolved,
        created_at: n.created_at,
        book_title: n.books?.title || 'Library Catalog Title',
        shelf_location: n.books?.shelf_location || 'General Stacks',
        available_copies: n.books?.available_copies ?? 0,
        student_name: n.book_requests?.student_name,
        student_contact: n.book_requests?.student_contact,
        student_message: n.book_requests?.message
      }));

      const unreadCount = formatted.filter(n => !n.is_read).length;

      return res.json({
        success: true,
        data: formatted,
        unreadCount
      });
    }

    // In-memory fallback
    const notifications = memoryDb.getNotifications();
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { is_read, is_resolved } = req.body;

    const updates: any = {};
    if (typeof is_read === 'boolean') updates.is_read = is_read;
    if (typeof is_resolved === 'boolean') updates.is_resolved = is_resolved;

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data, error } = await supabaseConfig.client
        .from('notifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to update notification in Supabase: ${error.message}`
        });
      }

      return res.json({
        success: true,
        message: 'Notification updated in Supabase',
        data
      });
    }

    // In-memory fallback
    const updated = memoryDb.updateNotification(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    return res.json({
      success: true,
      message: 'Notification updated',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { error } = await supabaseConfig.client
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to mark notifications read in Supabase: ${error.message}`
        });
      }

      return res.json({
        success: true,
        message: 'All notifications marked as read in Supabase'
      });
    }

    // In-memory fallback
    memoryDb.markAllNotificationsRead();

    return res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
