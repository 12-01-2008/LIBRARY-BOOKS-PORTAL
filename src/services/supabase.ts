import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Book, Reservation, BorrowRecord, SupabaseConfig } from '../types/library';
import { INITIAL_BOOKS, INITIAL_RESERVATIONS, INITIAL_BORROW_RECORDS } from '../data/initialBooks';

const STORAGE_KEYS = {
  CONFIG: 'bibliosphere_supabase_config',
  BOOKS: 'bibliosphere_books_cache',
  RESERVATIONS: 'bibliosphere_reservations_cache',
  BORROWS: 'bibliosphere_borrows_cache',
};

class LibraryDataService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    isConnected: false,
  };

  constructor() {
    this.init();
  }

  private init() {
    // 1. Check local storage for user entered credentials
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.url && parsed.anonKey) {
          this.config = parsed;
          this.client = createClient(parsed.url, parsed.anonKey);
        }
      } catch (e) {
        console.warn('Failed to parse saved Supabase config', e);
      }
    }

    // 2. Check Vite env variables if not set in local storage
    if (!this.client && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      this.config = { url, anonKey: key, isConnected: true };
      this.client = createClient(url, key);
    }

    // 3. Populate local storage fallback if empty
    if (!localStorage.getItem(STORAGE_KEYS.BOOKS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BORROWS)) {
      localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(INITIAL_BORROW_RECORDS));
    }
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public async setConfig(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      this.client = null;
      this.config = { url: '', anonKey: '', isConnected: false };
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      return { success: true, message: 'Supabase credentials cleared. Using local database.' };
    }

    try {
      const testClient = createClient(cleanUrl, cleanKey);
      // Attempt a lightweight ping or read
      const { error } = await testClient.from('books').select('id').limit(1);
      
      // Even if table doesn't exist yet, if auth / network worked, it's valid
      if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.books" does not exist')) {
        // Some actual auth or connection error
        throw error;
      }

      this.client = testClient;
      this.config = {
        url: cleanUrl,
        anonKey: cleanKey,
        isConnected: true,
        lastChecked: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));

      return {
        success: true,
        message: 'Connected to Supabase! You can sync your catalog or create tables with the provided schema.'
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid URL or Anon Key';
      return {
        success: false,
        message: `Connection failed: ${message}`
      };
    }
  }

  /* ================= BOOKS ================= */

  public async getBooks(): Promise<Book[]> {
    if (this.client && this.config.isConnected) {
      try {
        const { data, error } = await this.client
          .from('books')
          .select('*')
          .order('title', { ascending: true });

        if (!error && data && data.length > 0) {
          // Normalize if needed
          return data as Book[];
        }
      } catch (err) {
        console.warn('Supabase query error, falling back to local database:', err);
      }
    }

    // Local fallback
    const local = localStorage.getItem(STORAGE_KEYS.BOOKS);
    return local ? JSON.parse(local) : INITIAL_BOOKS;
  }

  public async saveBook(book: Book): Promise<Book> {
    const localBooks = await this.getBooks();
    const existingIndex = localBooks.findIndex(b => b.id === book.id);
    let updatedBooks: Book[];

    const now = new Date().toISOString();
    const preparedBook: Book = {
      ...book,
      updated_at: now,
      status: book.available_copies <= 0 ? 'out_of_stock' : book.available_copies <= 2 ? 'low_stock' : 'available'
    };

    if (existingIndex >= 0) {
      updatedBooks = [...localBooks];
      updatedBooks[existingIndex] = preparedBook;
    } else {
      updatedBooks = [preparedBook, ...localBooks];
    }

    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(updatedBooks));

    if (this.client && this.config.isConnected) {
      try {
        await this.client.from('books').upsert(preparedBook);
      } catch (err) {
        console.warn('Failed to upsert book to Supabase:', err);
      }
    }

    return preparedBook;
  }

  public async deleteBook(bookId: string): Promise<boolean> {
    const localBooks = await this.getBooks();
    const filtered = localBooks.filter(b => b.id !== bookId);
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(filtered));

    if (this.client && this.config.isConnected) {
      try {
        await this.client.from('books').delete().eq('id', bookId);
      } catch (err) {
        console.warn('Failed to delete book from Supabase:', err);
      }
    }

    return true;
  }

  /* ================= RESERVATIONS ================= */

  public async getReservations(): Promise<Reservation[]> {
    if (this.client && this.config.isConnected) {
      try {
        const { data, error } = await this.client
          .from('reservations')
          .select('*')
          .order('reserved_at', { ascending: false });

        if (!error && data) {
          return data as Reservation[];
        }
      } catch (err) {
        console.warn('Supabase reservations query error, using local:', err);
      }
    }

    const local = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    return local ? JSON.parse(local) : INITIAL_RESERVATIONS;
  }

  public async createReservation(reservation: Omit<Reservation, 'id' | 'reserved_at' | 'status' | 'pickup_code'>): Promise<Reservation> {
    const pickupCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReservation: Reservation = {
      ...reservation,
      id: `res-${Date.now().toString(36)}`,
      reserved_at: new Date().toISOString(),
      status: 'active',
      pickup_code: pickupCode
    };

    const currentReservations = await this.getReservations();
    const updated = [newReservation, ...currentReservations];
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(updated));

    // Also deduct 1 available copy if available
    const books = await this.getBooks();
    const targetBook = books.find(b => b.id === reservation.book_id);
    if (targetBook && targetBook.available_copies > 0) {
      targetBook.available_copies -= 1;
      await this.saveBook(targetBook);
    }

    if (this.client && this.config.isConnected) {
      try {
        await this.client.from('reservations').insert(newReservation);
      } catch (err) {
        console.warn('Failed to save reservation to Supabase:', err);
      }
    }

    return newReservation;
  }

  public async cancelReservation(id: string): Promise<boolean> {
    const list = await this.getReservations();
    const target = list.find(r => r.id === id);
    if (target && target.status === 'active') {
      target.status = 'cancelled';
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(list));

      // Restore available copy
      const books = await this.getBooks();
      const b = books.find(item => item.id === target.book_id);
      if (b && b.available_copies < b.total_copies) {
        b.available_copies += 1;
        await this.saveBook(b);
      }
    }
    return true;
  }

  /* ================= BORROW / RETURN ================= */

  public async getBorrowRecords(): Promise<BorrowRecord[]> {
    if (this.client && this.config.isConnected) {
      try {
        const { data, error } = await this.client
          .from('borrow_records')
          .select('*')
          .order('borrowed_at', { ascending: false });

        if (!error && data) {
          return data as BorrowRecord[];
        }
      } catch (err) {
        console.warn('Supabase borrow query error:', err);
      }
    }

    const local = localStorage.getItem(STORAGE_KEYS.BORROWS);
    return local ? JSON.parse(local) : INITIAL_BORROW_RECORDS;
  }

  public async checkoutBook(bookId: string, studentName: string, studentId: string, librarianName: string, daysDuration: number = 14): Promise<BorrowRecord> {
    const books = await this.getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) throw new Error('Book not found');
    if (book.available_copies <= 0) throw new Error('No copies currently available for check-out');

    book.available_copies -= 1;
    book.times_borrowed += 1;
    await this.saveBook(book);

    const now = new Date();
    const dueDate = new Date(now.getTime() + daysDuration * 24 * 60 * 60 * 1000);

    const record: BorrowRecord = {
      id: `bor-${Date.now().toString(36)}`,
      book_id: book.id,
      book_title: book.title,
      student_name: studentName,
      student_id: studentId,
      librarian_name: librarianName,
      borrowed_at: now.toISOString(),
      due_date: dueDate.toISOString(),
      returned_at: null,
      status: 'borrowed'
    };

    const currentRecords = await this.getBorrowRecords();
    const updated = [record, ...currentRecords];
    localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(updated));

    if (this.client && this.config.isConnected) {
      try {
        await this.client.from('borrow_records').insert(record);
      } catch (err) {
        console.warn('Failed to insert borrow record into Supabase:', err);
      }
    }

    return record;
  }

  public async returnBook(recordId: string): Promise<boolean> {
    const records = await this.getBorrowRecords();
    const record = records.find(r => r.id === recordId);
    if (!record) return false;

    record.returned_at = new Date().toISOString();
    record.status = 'returned';
    localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(records));

    // Increase available copies on book
    const books = await this.getBooks();
    const book = books.find(b => b.id === record.book_id);
    if (book && book.available_copies < book.total_copies) {
      book.available_copies += 1;
      await this.saveBook(book);
    }

    if (this.client && this.config.isConnected) {
      try {
        await this.client.from('borrow_records').update({
          returned_at: record.returned_at,
          status: 'returned'
        }).eq('id', recordId);
      } catch (err) {
        console.warn('Failed to update return in Supabase:', err);
      }
    }

    return true;
  }

  public resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
    localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(INITIAL_BORROW_RECORDS));
  }

  public getSupabaseSchemaSql(): string {
    return `-- ============================================================
-- BIBLIOSPHERE SMART LIBRARY PORTAL - SUPABASE SQL SCHEMA
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================

-- 1. Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  edition TEXT,
  publisher TEXT,
  publication_year INTEGER,
  shelf_location JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  description TEXT,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC(3, 2) DEFAULT 5.0,
  times_borrowed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Reservations Table
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT PRIMARY KEY,
  book_id TEXT REFERENCES public.books(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  pickup_deadline TIMESTAMPTZ NOT NULL,
  pickup_code TEXT NOT NULL
);

-- 3. Create Borrow Records Table
CREATE TABLE IF NOT EXISTS public.borrow_records (
  id TEXT PRIMARY KEY,
  book_id TEXT REFERENCES public.books(id) ON DELETE SET NULL,
  book_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  librarian_name TEXT NOT NULL,
  borrowed_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'borrowed'
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;

-- 5. Open Policies for Public Read & Write (or restrict by auth as desired)
CREATE POLICY "Public Read Books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Librarian Modify Books" ON public.books FOR ALL USING (true);

CREATE POLICY "Public Read Reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Insert Reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Reservations" ON public.reservations FOR UPDATE USING (true);

CREATE POLICY "Public Read Borrow Records" ON public.borrow_records FOR SELECT USING (true);
CREATE POLICY "Librarian Manage Borrow Records" ON public.borrow_records FOR ALL USING (true);
`;
  }
}

export const libraryService = new LibraryDataService();
