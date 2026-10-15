export type BookAvailabilityStatus = 'available' | 'low_stock' | 'out_of_stock' | 'on_reserve';

export interface ShelfLocation {
  floor: number;
  wing: string; // e.g. "North Tech Wing", "Science Tower", "East Quiet Hall"
  section: string; // e.g. "Computer Science & AI"
  shelf_code: string; // e.g. "CS-04-B"
  call_number: string; // e.g. "QA 76.73 .P98 L88 2024"
  row?: number;
  column?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  subject: string;
  total_copies: number;
  available_copies: number;
  edition: string;
  publisher: string;
  publication_year: number;
  shelf_location: ShelfLocation;
  status: BookAvailabilityStatus;
  description: string;
  cover_image_url: string;
  tags: string[];
  rating: number;
  times_borrowed: number;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  book_id: string;
  book_title: string;
  student_name: string;
  student_id: string;
  student_email: string;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  reserved_at: string;
  pickup_deadline: string;
  pickup_code: string;
}

export interface BorrowRecord {
  id: string;
  book_id: string;
  book_title: string;
  student_name: string;
  student_id: string;
  librarian_name: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
}

export interface UserRoleState {
  role: 'student' | 'librarian';
  librarianName?: string;
  studentId?: string;
  studentName?: string;
}
