import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { BookRecord, INITIAL_BOOKS } from '../data/sampleBooks.ts';

dotenv.config();

function getEnvUrl(): string {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

function getEnvServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function isValidValue(val: string): boolean {
  return Boolean(val && !val.includes('your-project-id') && !val.includes('your-service-role') && val.trim().length > 5);
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';
let cachedUrl = '';

export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = getEnvUrl();
  const serviceKey = getEnvServiceKey();

  if (!isValidValue(url) || !isValidValue(serviceKey)) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === serviceKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    cachedUrl = url;
    cachedKey = serviceKey;
    return cachedClient;
  } catch (err) {
    console.error('❌ Failed to initialize Supabase Admin Client:', err);
    return null;
  }
}

// In-Memory store as graceful fallback for instant evaluation or offline dev
let memoryBooks: BookRecord[] = [...INITIAL_BOOKS];

export const supabaseConfig = {
  get isConfigured(): boolean {
    return getSupabaseAdminClient() !== null;
  },
  get url(): string {
    return getEnvUrl();
  },
  get client(): SupabaseClient | null {
    return getSupabaseAdminClient();
  },

  // Fallback memory database methods
  memory: {
    getAll(): BookRecord[] {
      return [...memoryBooks];
    },

    getById(id: string): BookRecord | null {
      const book = memoryBooks.find(b => b.id === id);
      return book ? { ...book } : null;
    },

    create(newBook: Omit<BookRecord, 'id' | 'created_at' | 'updated_at'>): BookRecord {
      const now = new Date().toISOString();
      const id = crypto.randomUUID ? crypto.randomUUID() : `book-${Date.now()}`;
      const record: BookRecord = {
        ...newBook,
        id,
        created_at: now,
        updated_at: now
      };
      memoryBooks.unshift(record);
      return record;
    },

    update(id: string, updates: Partial<BookRecord>): BookRecord | null {
      const index = memoryBooks.findIndex(b => b.id === id);
      if (index === -1) return null;
      const updated: BookRecord = {
        ...memoryBooks[index],
        ...updates,
        id, // ensure ID is preserved
        updated_at: new Date().toISOString()
      };
      memoryBooks[index] = updated;
      return { ...updated };
    },

    delete(id: string): boolean {
      const initialLen = memoryBooks.length;
      memoryBooks = memoryBooks.filter(b => b.id !== id);
      return memoryBooks.length < initialLen;
    },

    adjustCopies(id: string, delta: number): BookRecord | null {
      const book = memoryBooks.find(b => b.id === id);
      if (!book) return null;
      const newAvailable = book.available_copies + delta;
      if (newAvailable < 0 || newAvailable > book.total_copies) {
        throw new Error(`Available copies must be between 0 and ${book.total_copies}`);
      }
      book.available_copies = newAvailable;
      book.updated_at = new Date().toISOString();
      return { ...book };
    },

    getSubjects(): string[] {
      const subs = new Set<string>();
      memoryBooks.forEach(b => {
        if (b.subject) subs.add(b.subject);
      });
      return Array.from(subs).sort();
    },

    getStats() {
      const totalBooks = memoryBooks.length;
      let totalCopies = 0;
      let availableCopies = 0;
      let lowStockCount = 0;

      memoryBooks.forEach(b => {
        totalCopies += b.total_copies;
        availableCopies += b.available_copies;
        if (b.available_copies > 0 && b.available_copies <= 2) {
          lowStockCount += 1;
        }
      });

      const issuedCopies = Math.max(0, totalCopies - availableCopies);

      return {
        total_books: totalBooks,
        total_copies: totalCopies,
        available_copies: availableCopies,
        issued_copies: issuedCopies,
        low_stock_books: lowStockCount
      };
    }
  }
};
