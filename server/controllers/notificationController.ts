import { Request, Response, NextFunction } from 'express';
import { memoryDb } from '../data/seedData.ts';
import { supabaseConfig } from '../config/supabase.ts';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    const updated = memoryDb.updateNotification(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        await supabaseConfig.client
          .from('notifications')
          .update(updates)
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateNotification sync error:', err);
      }
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
    memoryDb.markAllNotificationsRead();

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        await supabaseConfig.client
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false);
      } catch (err) {
        console.warn('Supabase markAllAsRead sync error:', err);
      }
    }

    return res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
