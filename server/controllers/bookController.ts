import { Request, Response, NextFunction } from 'express';
import { supabaseConfig } from '../config/supabase.ts';
import { memoryDb } from '../data/seedData.ts';
import { Book } from '../../src/types/index.ts';

export const getBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, subject, available, page, limit, sort, order } = req.query as any;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 12;
    const search = (q as string || '').trim().toLowerCase();
    const subjectFilter = (subject as string || '').trim();
    const availableOnly = available === 'true' || available === 'available';

    // If live Supabase client is connected
    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        let query = supabaseConfig.client
          .from('books_with_availability')
          .select('*', { count: 'exact' });

        if (search) {
          query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,subject.ilike.%${search}%,isbn.ilike.%${search}%`);
        }

        if (subjectFilter && subjectFilter !== 'all') {
          query = query.eq('subject', subjectFilter);
        }

        if (availableOnly) {
          query = query.gt('available_copies', 0);
        }

        // Sorting
        const sortCol = sort === 'year' ? 'publication_year' : sort === 'available' ? 'available_copies' : 'title';
        query = query.order(sortCol, { ascending: order !== 'desc' });

        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;
        const { data, count, error } = await query.range(from, to);

        if (!error && data) {
          const total = count || data.length;
          const totalPages = Math.ceil(total / limitNum) || 1;

          return res.json({
            success: true,
            data,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages,
              hasMore: pageNum < totalPages
            }
          });
        }
      } catch (err) {
        console.warn('Supabase getBooks error, falling back to memory store:', err);
      }
    }

    // Resilient memory store processing
    let books = memoryDb.getBooksWithReturnDates();

    // Search filter
    if (search) {
      books = books.filter(b => 
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search) ||
        b.subject.toLowerCase().includes(search) ||
        b.isbn.toLowerCase().includes(search) ||
        b.shelf_location.toLowerCase().includes(search)
      );
    }

    // Subject filter
    if (subjectFilter && subjectFilter !== 'all') {
      books = books.filter(b => b.subject.toLowerCase() === subjectFilter.toLowerCase());
    }

    // Availability filter
    if (availableOnly) {
      books = books.filter(b => b.available_copies > 0);
    }

    // Sorting
    books.sort((a, b) => {
      let comp = 0;
      if (sort === 'year') {
        comp = (a.publication_year || 0) - (b.publication_year || 0);
      } else if (sort === 'available') {
        comp = a.available_copies - b.available_copies;
      } else {
        comp = a.title.localeCompare(b.title);
      }
      return order === 'desc' ? -comp : comp;
    });

    const total = books.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = books.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore: pageNum < totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        const { data: book, error } = await supabaseConfig.client
          .from('books_with_availability')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && book) {
          // Fetch anonymized due dates of active loans
          const { data: loans } = await supabaseConfig.client
            .from('loans')
            .select('id, due_date, issued_at')
            .eq('book_id', id)
            .is('returned_at', null)
            .order('due_date', { ascending: true });

          return res.json({
            success: true,
            data: {
              ...book,
              active_loans: loans || []
            }
          });
        }
      } catch (err) {
        console.warn('Supabase getBookById error, falling back:', err);
      }
    }

    const book = memoryDb.getBookById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    const loans = memoryDb.getBookLoans(id);

    return res.json({
      success: true,
      data: {
        ...book,
        active_loans: loans.map(l => ({ id: l.id, due_date: l.due_date, issued_at: l.issued_at, is_overdue: l.is_overdue }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookData = req.body;

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        const { data, error } = await supabaseConfig.client
          .from('books')
          .insert(bookData)
          .select()
          .single();

        if (!error && data) {
          return res.status(201).json({
            success: true,
            message: 'Book added successfully',
            data
          });
        }
      } catch (err) {
        console.warn('Supabase createBook failed, using memory store:', err);
      }
    }

    const created = memoryDb.createBook(bookData);
    return res.status(201).json({
      success: true,
      message: 'Book added to catalog',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        const { data, error } = await supabaseConfig.client
          .from('books')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return res.json({
            success: true,
            message: 'Book updated successfully',
            data
          });
        }
      } catch (err) {
        console.warn('Supabase updateBook failed, using memory store:', err);
      }
    }

    const updated = memoryDb.updateBook(id, updates);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Book not found for update'
      });
    }

    return res.json({
      success: true,
      message: 'Book updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (supabaseConfig.isConfigured && supabaseConfig.client) {
      try {
        const { error } = await supabaseConfig.client
          .from('books')
          .delete()
          .eq('id', id);

        if (!error) {
          return res.json({
            success: true,
            message: 'Book deleted from library catalog'
          });
        }
      } catch (err) {
        console.warn('Supabase deleteBook failed, using memory store:', err);
      }
    }

    const deleted = memoryDb.deleteBook(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    return res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const patchAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, amount = 1, value } = req.body;

    const book = memoryDb.getBookById(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    let targetAvailable = book.available_copies;
    if (action === 'issue') {
      targetAvailable = Math.max(0, book.available_copies - amount);
    } else if (action === 'return') {
      targetAvailable = Math.min(book.total_copies, book.available_copies + amount);
    } else if (action === 'set' && typeof value === 'number') {
      if (value < 0 || value > book.total_copies) {
        return res.status(400).json({
          success: false,
          error: `Available copies must be between 0 and ${book.total_copies}`
        });
      }
      targetAvailable = value;
    }

    const updated = memoryDb.updateBook(id, { available_copies: targetAvailable });
    return res.json({
      success: true,
      message: `Availability updated to ${targetAvailable} copies`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = memoryDb.getBooksWithReturnDates();
    const subs = new Set<string>();
    books.forEach(b => {
      if (b.subject) subs.add(b.subject);
    });
    return res.json({
      success: true,
      data: Array.from(subs).sort()
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = memoryDb.getStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
