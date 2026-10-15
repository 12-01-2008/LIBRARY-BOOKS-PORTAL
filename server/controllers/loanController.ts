import { Request, Response, NextFunction } from 'express';
import { memoryDb } from '../data/seedData.ts';
import { supabaseConfig } from '../config/supabase.ts';

export const issueLoan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { due_date } = req.body;

    const result = memoryDb.issueBookCopy(id, due_date);

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        await supabaseConfig.client
          .from('books')
          .update({ available_copies: result.book.available_copies })
          .eq('id', id);

        await supabaseConfig.client
          .from('loans')
          .insert({
            id: result.loan.id,
            book_id: id,
            issued_at: result.loan.issued_at,
            due_date: result.loan.due_date,
            issued_by: req.user?.id || null
          });
      } catch (err) {
        console.warn('Supabase issueLoan sync error:', err);
      }
    }

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

    const result = memoryDb.returnBookCopy(id, loan_id);

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        await supabaseConfig.client
          .from('books')
          .update({ available_copies: result.book.available_copies })
          .eq('id', id);

        if (result.returnedLoan) {
          await supabaseConfig.client
            .from('loans')
            .update({ returned_at: result.returnedLoan.returned_at })
            .eq('id', result.returnedLoan.id);
        }
      } catch (err) {
        console.warn('Supabase returnLoan sync error:', err);
      }
    }

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
