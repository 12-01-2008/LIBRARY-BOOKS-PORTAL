import { Request, Response, NextFunction } from 'express';
import { memoryDb } from '../data/seedData.ts';
import { supabaseConfig } from '../config/supabase.ts';

export const createStudentRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { student_name, student_contact, message } = req.body;

    const request = memoryDb.createRequest(id, student_name, student_contact, message);

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        await supabaseConfig.client
          .from('book_requests')
          .insert({
            id: request.id,
            book_id: id,
            student_name,
            student_contact,
            message,
            status: 'pending'
          });

        await supabaseConfig.client
          .from('notifications')
          .insert({
            type: 'request',
            book_id: id,
            request_id: request.id,
            view_count: 1,
            is_read: false,
            is_resolved: false
          });
      } catch (err) {
        console.warn('Supabase createStudentRequest sync error:', err);
      }
    }

    return res.status(201).json({
      success: true,
      message: "We've received your notification request! Our librarians will alert you as soon as this title is checked in.",
      data: request
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit request'
    });
  }
};

export const recordBookView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const recorded = memoryDb.recordUnavailableView(id);

    return res.json({
      success: true,
      recorded
    });
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, q } = req.query as any;

    let requests = memoryDb.getRequests();

    if (status && status !== 'all') {
      requests = requests.filter(r => r.status === status);
    }

    if (q) {
      const search = q.toLowerCase();
      requests = requests.filter(r => 
        (r.student_name && r.student_name.toLowerCase().includes(search)) ||
        (r.book_title && r.book_title.toLowerCase().includes(search)) ||
        (r.student_contact && r.student_contact.toLowerCase().includes(search)) ||
        (r.message && r.message.toLowerCase().includes(search))
      );
    }

    return res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, informed_by } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (status === 'informed') {
      updates.informed_at = new Date().toISOString();
      updates.informed_by = informed_by || req.user?.email || 'Librarian Desk';
    }

    const updated = memoryDb.updateRequest(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        await supabaseConfig.client
          .from('book_requests')
          .update(updates)
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateRequest sync error:', err);
      }
    }

    return res.json({
      success: true,
      message: `Request marked as ${status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
