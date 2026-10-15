import { Request, Response, NextFunction } from 'express';
import { memoryDb } from '../data/seedData.ts';
import { supabaseConfig } from '../config/supabase.ts';

export const issueLoan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { due_date } = req.body;

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data: book, error: bookError } = await supabaseConfig.client
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (bookError || !book) {
        return res.status(404).json({ success: false, error: 'Book not found in library catalog' });
      }

      if (book.available_copies <= 0) {
        return res.status(400).json({
          success: false,
          error: `No copies of "${book.title}" are currently available to issue.`
        });
      }

      const now = new Date();
      const defaultDue = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const loanDueDate = due_date ? new Date(due_date) : defaultDue;

      const { data: loan, error: loanError } = await supabaseConfig.client
        .from('loans')
        .insert({
          book_id: id,
          issued_at: now.toISOString(),
          due_date: loanDueDate.toISOString(),
          issued_by: req.user?.id || null
        })
        .select()
        .single();

      if (loanError) {
        return res.status(400).json({
          success: false,
          error: `Failed to issue loan in Supabase: ${loanError.message}`
        });
      }

      const newAvailable = Math.max(0, book.available_copies - 1);
      const { data: updatedBook } = await supabaseConfig.client
        .from('books')
        .update({ available_copies: newAvailable, updated_at: now.toISOString() })
        .eq('id', id)
        .select()
        .single();

      return res.status(201).json({
        success: true,
        message: `Book issued. Due date set to ${loanDueDate.toLocaleDateString()}.`,
        data: {
          loan,
          book: updatedBook || { ...book, available_copies: newAvailable }
        }
      });
    }

    // In-memory fallback
    const result = memoryDb.issueBookCopy(id, due_date);
    return res.status(201).json({
      success: true,
      message: `Book issued. Due date set to ${new Date(result.loan.due_date).toLocaleDateString()}.`,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to issue book'
    });
  }
};

export const returnLoan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { loan_id } = req.body;

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data: book, error: bookError } = await supabaseConfig.client
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (bookError || !book) {
        return res.status(404).json({ success: false, error: 'Book not found' });
      }

      const now = new Date().toISOString();
      let returnedLoanRecord = null;

      if (loan_id) {
        const { data: returned } = await supabaseConfig.client
          .from('loans')
          .update({ returned_at: now })
          .eq('id', loan_id)
          .select()
          .single();
        returnedLoanRecord = returned;
      } else {
        // Find oldest active loan
        const { data: activeLoans } = await supabaseConfig.client
          .from('loans')
          .select('*')
          .eq('book_id', id)
          .is('returned_at', null)
          .order('due_date', { ascending: true })
          .limit(1);

        if (activeLoans && activeLoans.length > 0) {
          const { data: returned } = await supabaseConfig.client
            .from('loans')
            .update({ returned_at: now })
            .eq('id', activeLoans[0].id)
            .select()
            .single();
          returnedLoanRecord = returned;
        }
      }

      const prevAvailable = book.available_copies;
      const newAvailable = Math.min(book.total_copies, book.available_copies + 1);

      const { data: updatedBook } = await supabaseConfig.client
        .from('books')
        .update({ available_copies: newAvailable, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      // If the book was out of stock and now has available copies, alert staff to notify students
      if (prevAvailable === 0 && newAvailable > 0) {
        const { count: pendingCount } = await supabaseConfig.client
          .from('book_requests')
          .select('*', { count: 'exact', head: true })
          .eq('book_id', id)
          .eq('status', 'pending');

        if (pendingCount && pendingCount > 0) {
          await supabaseConfig.client
            .from('notifications')
            .insert({
              type: 'book_available',
              book_id: id,
              view_count: 1,
              is_read: false,
              is_resolved: false
            });
        }
      }

      return res.json({
        success: true,
        message: 'Book returned to shelf. Available count incremented.',
        data: {
          book: updatedBook || { ...book, available_copies: newAvailable },
          returnedLoan: returnedLoanRecord
        }
      });
    }

    // In-memory fallback
    const result = memoryDb.returnBookCopy(id, loan_id);
    return res.json({
      success: true,
      message: 'Book returned to shelf. Available count incremented.',
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to return book'
    });
  }
};
