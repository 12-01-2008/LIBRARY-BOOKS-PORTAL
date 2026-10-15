export type AvailabilityStatus = 'Available' | 'Limited' | 'Unavailable';

export interface Book {
  id: string;
  title: string;
  author: string;
  subject: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  cover_url?: string;
  description?: string;
  edition?: string;
  publisher?: string;
  publication_year?: number;
  expected_return_date?: string | null;
  active_loans_count?: number;
  active_loans?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  book_id: string;
  book_title?: string;
  issued_at: string;
  due_date: string;
  returned_at?: string | null;
  issued_by?: string;
  is_overdue?: boolean;
}

export type RequestStatus = 'pending' | 'informed' | 'resolved';

export interface BookRequest {
  id: string;
  book_id: string;
  book_title?: string;
  student_name: string;
  student_contact: string;
  message?: string;
  status: RequestStatus;
  informed_at?: string | null;
  informed_by?: string | null;
  created_at: string;
}

export type NotificationType = 'request' | 'view_unavailable' | 'book_available';

export interface LibraryNotification {
  id: string;
  type: NotificationType;
  book_id: string;
  book_title: string;
  shelf_location?: string;
  available_copies?: number;
  total_copies?: number;
  expected_return_date?: string | null;
  request_id?: string | null;
  student_name?: string;
  student_contact?: string;
  message?: string;
  view_count: number;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface LibrarianStats {
  total_books: number;
  total_copies: number;
  available_copies: number;
  issued_copies: number;
  low_stock_books: number;
  overdue_loans: number;
  pending_requests: number;
  unread_notifications: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface BooksResponse {
  success: boolean;
  data: Book[];
  pagination: PaginationMeta;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'librarian';
  name?: string;
}
