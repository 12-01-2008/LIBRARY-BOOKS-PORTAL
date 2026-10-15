import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  author: z.string().trim().min(1, 'Author is required').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(100),
  isbn: z.string().trim().min(10, 'ISBN must be at least 10 characters').max(20),
  total_copies: z.coerce.number().int().min(1, 'Total copies must be at least 1'),
  available_copies: z.coerce.number().int().min(0, 'Available copies cannot be negative'),
  shelf_location: z.string().trim().min(1, 'Shelf location is required').max(100),
  cover_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  edition: z.string().optional().or(z.literal('')),
  publisher: z.string().optional().or(z.literal('')),
  publication_year: z.coerce.number().int().min(1800).max(2100).optional(),
}).refine(data => data.available_copies <= data.total_copies, {
  message: 'Available copies cannot exceed total copies',
  path: ['available_copies'],
});

export const updateBookSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  author: z.string().trim().min(1).max(255).optional(),
  subject: z.string().trim().min(1).max(100).optional(),
  isbn: z.string().trim().min(10).max(20).optional(),
  total_copies: z.coerce.number().int().min(1).optional(),
  available_copies: z.coerce.number().int().min(0).optional(),
  shelf_location: z.string().trim().min(1).max(100).optional(),
  cover_url: z.string().url().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  edition: z.string().optional().or(z.literal('')),
  publisher: z.string().optional().or(z.literal('')),
  publication_year: z.coerce.number().int().min(1800).max(2100).optional(),
}).refine(data => {
  if (data.available_copies !== undefined && data.total_copies !== undefined) {
    return data.available_copies <= data.total_copies;
  }
  return true;
}, {
  message: 'Available copies cannot exceed total copies',
  path: ['available_copies'],
});

export const createRequestSchema = z.object({
  student_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  student_contact: z.string().trim().min(3, 'Contact (email, phone, or student ID) is required').max(100),
  message: z.string().trim().max(500, 'Message cannot exceed 500 characters').optional().or(z.literal('')),
});

export const issueLoanSchema = z.object({
  due_date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional()),
});

export const patchAvailabilitySchema = z.object({
  action: z.enum(['issue', 'return', 'set']),
  amount: z.coerce.number().int().min(1).optional().default(1),
  value: z.coerce.number().int().min(0).optional(),
});

export const updateNotificationSchema = z.object({
  is_read: z.boolean().optional(),
  is_resolved: z.boolean().optional(),
});

export const updateRequestSchema = z.object({
  status: z.enum(['pending', 'informed', 'resolved']).optional(),
  informed_by: z.string().optional(),
});

export const queryBooksSchema = z.object({
  q: z.string().optional().default(''),
  subject: z.string().optional().default(''),
  available: z.enum(['all', 'true', 'false', 'available', '']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  sort: z.enum(['title', 'author', 'year', 'available', 'created_at']).optional().default('title'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});
