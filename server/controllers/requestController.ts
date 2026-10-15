import { Request, Response, NextFunction } from 'express';
import { memoryDb } from '../data/seedData.ts';
import { supabaseConfig } from '../config/supabase.ts';

export const createStudentRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { student_name, student_contact, message } = req.body;

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      // Verify book exists
      const { data: book, error: bookError } = await supabaseConfig.client
        .from('books')
        .select('id, title')
        .eq('id', id)
        .single();

      if (bookError || !book) {
        return res.status(404).json({ success: false, error: 'Book not found' });
      }

      const { data: request, error: reqError } = await supabaseConfig.client
        .from('book_requests')
        .insert({
          book_id: id,
          student_name,
          student_contact,
          message: message || null,
          status: 'pending'
        })
        .select()
        .single();

      if (reqError) {
        return res.status(400).json({
          success: false,
          error: `Failed to save request in Supabase: ${reqError.message}`
        });
      }

      // Create librarian notification for this request
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

      return res.status(201).json({
        success: true,
        message: "We've received your notification request! Our librarians will alert you as soon as this title is checked in.",
        data: {
          ...request,
          book_title: book.title
        }
      });
    }

    // In-memory fallback
    const request = memoryDb.createRequest(id, student_name, student_contact, message);
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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: existing } = await supabaseConfig.client
        .from('notifications')
        .select('id, view_count')
        .eq('book_id', id)
        .eq('type', 'view_unavailable')
        .eq('is_resolved', false)
        .gt('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        await supabaseConfig.client
          .from('notifications')
          .update({ view_count: (existing[0].view_count || 1) + 1 })
          .eq('id', existing[0].id);
      } else {
        await supabaseConfig.client
          .from('notifications')
          .insert({
            type: 'view_unavailable',
            book_id: id,
            view_count: 1,
            is_read: false,
            is_resolved: false
          });
      }

      return res.json({
        success: true,
        recorded: true
      });
    }

    // In-memory fallback
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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      let query = supabaseConfig.client
        .from('book_requests')
        .select(`
          id,
          book_id,
          student_name,
          student_contact,
          message,
          status,
          informed_at,
          informed_by,
          created_at,
          books (
            title,
            shelf_location,
            author,
            available_copies
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Failed to fetch book requests from Supabase: ${error.message}`
        });
      }

      let formatted = (data || []).map((r: any) => ({
        id: r.id,
        book_id: r.book_id,
        book_title: r.books?.title || 'Catalog Book',
        author: r.books?.author || '',
        shelf_location: r.books?.shelf_location || 'General Stacks',
        available_copies: r.books?.available_copies ?? 0,
        student_name: r.student_name,
        student_contact: r.student_contact,
        message: r.message,
        status: r.status,
        informed_at: r.informed_at,
        informed_by: r.informed_by,
        created_at: r.created_at
      }));

      if (q) {
        const search = q.toLowerCase();
        formatted = formatted.filter((r: any) =>
          r.student_name?.toLowerCase().includes(search) ||
          r.book_title?.toLowerCase().includes(search) ||
          r.student_contact?.toLowerCase().includes(search) ||
          r.message?.toLowerCase().includes(search)
        );
      }

      return res.json({
        success: true,
        data: formatted
      });
    }

    // In-memory fallback
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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data, error } = await supabaseConfig.client
        .from('book_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to update request in Supabase: ${error.message}`
        });
      }

      // If resolved or informed, update corresponding notifications
      if (status === 'informed' || status === 'resolved') {
        await supabaseConfig.client
          .from('notifications')
          .update({ is_resolved: true })
          .eq('request_id', id);
      }

      return res.json({
        success: true,
        message: `Request marked as ${status}`,
        data
      });
    }

    // In-memory fallback
    const updated = memoryDb.updateRequest(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Request not found' });
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
