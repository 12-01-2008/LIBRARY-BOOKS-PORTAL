import { Request, Response, NextFunction } from 'express';
import { supabaseConfig } from '../config/supabase.ts';
import { memoryDb } from '../data/seedData.ts';

export const getBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, subject, available, page, limit, sort, order } = req.query as any;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 12;
    const search = (q as string || '').trim().toLowerCase();
    const subjectFilter = (subject as string || '').trim();
    const availableOnly = available === 'true' || available === 'available';

    // If Supabase is configured: strictly use Supabase; in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({
          success: false,
          error: 'Supabase client is not available despite credentials being set.'
        });
      }

      // Try view with availability calculations first
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

      const sortCol = sort === 'year' ? 'publication_year' : sort === 'available' ? 'available_copies' : 'title';
      query = query.order(sortCol, { ascending: order !== 'desc' });

      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      let { data, count, error } = await query.range(from, to);

      // If view is not yet created in Supabase SQL editor, fall back to books table directly in Supabase
      if (error && (error.message.includes('books_with_availability') || error.code === '42P01')) {
        let fallbackQuery = supabaseConfig.client
          .from('books')
          .select('*', { count: 'exact' });

        if (search) {
          fallbackQuery = fallbackQuery.or(`title.ilike.%${search}%,author.ilike.%${search}%,subject.ilike.%${search}%,isbn.ilike.%${search}%`);
        }

        if (subjectFilter && subjectFilter !== 'all') {
          fallbackQuery = fallbackQuery.eq('subject', subjectFilter);
        }

        if (availableOnly) {
          fallbackQuery = fallbackQuery.gt('available_copies', 0);
        }

        fallbackQuery = fallbackQuery.order(sortCol, { ascending: order !== 'desc' });
        const res2 = await fallbackQuery.range(from, to);
        data = res2.data;
        count = res2.count;
        error = res2.error;
      }

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Supabase query error: ${error.message}. In-memory fallback is disabled because SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.`
        });
      }

      const total = count ?? (data ? data.length : 0);
      const totalPages = Math.ceil(total / limitNum) || 1;

      return res.json({
        success: true,
        data: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore: pageNum < totalPages
        }
      });
    }

    // In-memory fallback is ONLY used when Supabase credentials are NOT set
    let books = memoryDb.getBooksWithReturnDates();

    if (search) {
      books = books.filter(b => 
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search) ||
        b.subject.toLowerCase().includes(search) ||
        b.isbn.toLowerCase().includes(search) ||
        b.shelf_location.toLowerCase().includes(search)
      );
    }

    if (subjectFilter && subjectFilter !== 'all') {
      books = books.filter(b => b.subject.toLowerCase() === subjectFilter.toLowerCase());
    }

    if (availableOnly) {
      books = books.filter(b => b.available_copies > 0);
    }

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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      let { data: book, error } = await supabaseConfig.client
        .from('books_with_availability')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error && (error.message.includes('books_with_availability') || error.code === '42P01')) {
        const res2 = await supabaseConfig.client
          .from('books')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        book = res2.data;
        error = res2.error;
      }

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Supabase query error: ${error.message}. In-memory fallback is disabled.`
        });
      }

      if (!book) {
        return res.status(404).json({
          success: false,
          error: 'Book not found'
        });
      }

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

    // In-memory fallback only when Supabase is not configured
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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data, error } = await supabaseConfig.client
        .from('books')
        .insert(bookData)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Supabase insert failed: ${error.message}. In-memory fallback is disabled.`
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Book added to Supabase catalog successfully',
        data
      });
    }

    // In-memory fallback
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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data, error } = await supabaseConfig.client
        .from('books')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Supabase update failed: ${error.message}. In-memory fallback is disabled.`
        });
      }

      return res.json({
        success: true,
        message: 'Book updated successfully',
        data
      });
    }

    // In-memory fallback
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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { error } = await supabaseConfig.client
        .from('books')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({
          success: false,
          error: `Supabase delete failed: ${error.message}. In-memory fallback is disabled.`
        });
      }

      return res.json({
        success: true,
        message: 'Book deleted from Supabase library catalog'
      });
    }

    // In-memory fallback
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

    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data: book, error: findError } = await supabaseConfig.client
        .from('books')
        .select('available_copies, total_copies')
        .eq('id', id)
        .single();

      if (findError || !book) {
        return res.status(404).json({
          success: false,
          error: 'Book not found in Supabase'
        });
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

      const { data: updated, error: updateError } = await supabaseConfig.client
        .from('books')
        .update({ available_copies: targetAvailable, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({
          success: false,
          error: `Failed to update availability in Supabase: ${updateError.message}`
        });
      }

      return res.json({
        success: true,
        message: `Availability updated to ${targetAvailable} copies in Supabase`,
        data: updated
      });
    }

    // In-memory fallback
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
    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data, error } = await supabaseConfig.client
        .from('books')
        .select('subject');

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Failed to fetch subjects from Supabase: ${error.message}`
        });
      }

      const subs = new Set<string>();
      (data || []).forEach((b: any) => {
        if (b.subject) subs.add(b.subject);
      });

      return res.json({
        success: true,
        data: Array.from(subs).sort()
      });
    }

    // In-memory fallback
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
    // Supabase path: in-memory fallback is disabled
    if (supabaseConfig.isConfigured) {
      if (!supabaseConfig.client) {
        return res.status(500).json({ success: false, error: 'Supabase client not initialized' });
      }

      const { data: books, error: booksError } = await supabaseConfig.client
        .from('books')
        .select('total_copies, available_copies');

      if (booksError) {
        return res.status(500).json({
          success: false,
          error: `Failed to fetch book stats from Supabase: ${booksError.message}`
        });
      }

      const { count: overdueCount } = await supabaseConfig.client
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .is('returned_at', null)
        .lt('due_date', new Date().toISOString());

      const { count: pendingRequests } = await supabaseConfig.client
        .from('book_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const totalBooks = (books || []).length;
      let totalCopies = 0;
      let availableCopies = 0;
      let lowStockCount = 0;

      (books || []).forEach((b: any) => {
        totalCopies += b.total_copies || 0;
        availableCopies += b.available_copies || 0;
        if (b.available_copies > 0 && b.available_copies <= 2) {
          lowStockCount += 1;
        }
      });

      const issuedCopies = Math.max(0, totalCopies - availableCopies);

      return res.json({
        success: true,
        data: {
          total_books: totalBooks,
          total_copies: totalCopies,
          available_copies: availableCopies,
          issued_copies: issuedCopies,
          low_stock_books: lowStockCount,
          overdue_loans: overdueCount || 0,
          pending_requests: pendingRequests || 0
        }
      });
    }

    // In-memory fallback
    const stats = memoryDb.getStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
