import { Book, Loan, BookRequest, LibraryNotification, LibrarianStats } from '../../src/types/index.ts';
import { INITIAL_BOOKS } from './sampleBooks.ts';

export interface SeedState {
  books: Book[];
  loans: Loan[];
  requests: BookRequest[];
  notifications: LibraryNotification[];
  viewTracker: Map<string, number>; // bookId -> timestamp of last view notification
}

const now = new Date();
const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
const subDays = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

export const initialLoans: Loan[] = [
  // Deep Learning loans
  {
    id: 'b001b111-0001-4000-8000-000000000001',
    book_id: 'a001a111-0001-4000-8000-000000000003',
    book_title: 'Deep Learning',
    issued_at: subDays(11),
    due_date: addDays(3),
    returned_at: null,
    is_overdue: false,
  },
  {
    id: 'b001b111-0001-4000-8000-000000000002',
    book_id: 'a001a111-0001-4000-8000-000000000003',
    book_title: 'Deep Learning',
    issued_at: subDays(8),
    due_date: addDays(6),
    returned_at: null,
    is_overdue: false,
  },
  // Engineering Mechanics: Dynamics (one overdue!)
  {
    id: 'b001b111-0001-4000-8000-000000000004',
    book_id: 'a001a111-0001-4000-8000-000000000008',
    book_title: 'Engineering Mechanics: Dynamics',
    issued_at: subDays(18),
    due_date: subDays(4), // OVERDUE
    returned_at: null,
    is_overdue: true,
  },
  {
    id: 'b001b111-0001-4000-8000-000000000005',
    book_id: 'a001a111-0001-4000-8000-000000000008',
    book_title: 'Engineering Mechanics: Dynamics',
    issued_at: subDays(10),
    due_date: addDays(4),
    returned_at: null,
    is_overdue: false,
  },
  // Modern Control Engineering
  {
    id: 'b001b111-0001-4000-8000-000000000006',
    book_id: 'a001a111-0001-4000-8000-000000000018',
    book_title: 'Modern Control Engineering',
    issued_at: subDays(9),
    due_date: addDays(5),
    returned_at: null,
    is_overdue: false,
  },
  // Introduction to Algorithms (available copies exist, but also has a loan)
  {
    id: 'b001b111-0001-4000-8000-000000000007',
    book_id: 'a001a111-0001-4000-8000-000000000001',
    book_title: 'Introduction to Algorithms',
    issued_at: subDays(4),
    due_date: addDays(10),
    returned_at: null,
    is_overdue: false,
  }
];

export const initialRequests: BookRequest[] = [
  {
    id: 'c001c111-0001-4000-8000-000000000001',
    book_id: 'a001a111-0001-4000-8000-000000000003',
    book_title: 'Deep Learning',
    student_name: 'Maya Lin',
    student_contact: 'maya.lin@college.edu',
    message: 'Need this for CS482 final project by next Friday. Please let me know if an earlier copy arrives.',
    status: 'pending',
    created_at: subDays(0.2),
  },
  {
    id: 'c001c111-0001-4000-8000-000000000002',
    book_id: 'a001a111-0001-4000-8000-000000000008',
    book_title: 'Engineering Mechanics: Dynamics',
    student_name: 'James Wilson',
    student_contact: 'j.wilson@college.edu',
    message: 'Preparing for the dynamics midterm exam on Tuesday.',
    status: 'pending',
    created_at: subDays(1),
  },
  {
    id: 'c001c111-0001-4000-8000-000000000003',
    book_id: 'a001a111-0001-4000-8000-000000000002',
    book_title: 'Designing Data-Intensive Applications',
    student_name: 'Aisha Khan',
    student_contact: 'aisha.k@college.edu',
    message: 'Can I place a physical hold at the front circulation desk?',
    status: 'informed',
    informed_at: subDays(1),
    informed_by: 'Staff Desk',
    created_at: subDays(2),
  }
];

export const initialNotifications: LibraryNotification[] = [
  {
    id: 'd001d111-0001-4000-8000-000000000001',
    type: 'request',
    book_id: 'a001a111-0001-4000-8000-000000000003',
    book_title: 'Deep Learning',
    shelf_location: 'Floor 2, North Wing, Shelf CS-01-C',
    available_copies: 0,
    total_copies: 8,
    expected_return_date: addDays(3),
    request_id: 'c001c111-0001-4000-8000-000000000001',
    student_name: 'Maya Lin',
    student_contact: 'maya.lin@college.edu',
    message: 'Need this for CS482 final project by next Friday. Please let me know if an earlier copy arrives.',
    view_count: 1,
    is_read: false,
    is_resolved: false,
    created_at: subDays(0.2),
  },
  {
    id: 'd001d111-0001-4000-8000-000000000002',
    type: 'view_unavailable',
    book_id: 'a001a111-0001-4000-8000-000000000008',
    book_title: 'Engineering Mechanics: Dynamics',
    shelf_location: 'Floor 2, North Wing, Shelf ENG-03-C',
    available_copies: 0,
    total_copies: 7,
    expected_return_date: subDays(4), // overdue
    view_count: 4,
    is_read: false,
    is_resolved: false,
    created_at: subDays(0.1),
  },
  {
    id: 'd001d111-0001-4000-8000-000000000003',
    type: 'book_available',
    book_id: 'a001a111-0001-4000-8000-000000000002',
    book_title: 'Designing Data-Intensive Applications',
    shelf_location: 'Floor 2, North Wing, Shelf CS-04-B',
    available_copies: 1,
    total_copies: 6,
    expected_return_date: null,
    view_count: 1,
    is_read: true,
    is_resolved: true,
    created_at: subDays(1),
  }
];

class MemoryDatabase {
  private state: SeedState;

  constructor() {
    this.state = {
      books: [...INITIAL_BOOKS],
      loans: [...initialLoans],
      requests: [...initialRequests],
      notifications: [...initialNotifications],
      viewTracker: new Map<string, number>(),
    };
  }

  // Calculate expected return date for any book from its active loans
  private getExpectedReturnDate(bookId: string): { earliest: string | null; activeCount: number } {
    const active = this.state.loans.filter(l => l.book_id === bookId && !l.returned_at);
    if (active.length === 0) return { earliest: null, activeCount: 0 };
    
    // Sort ascending by due_date
    active.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return {
      earliest: active[0].due_date,
      activeCount: active.length
    };
  }

  public getBooksWithReturnDates(): Book[] {
    return this.state.books.map(b => {
      const { earliest, activeCount } = this.getExpectedReturnDate(b.id);
      return {
        ...b,
        expected_return_date: earliest,
        active_loans_count: activeCount
      };
    });
  }

  public getBookById(id: string): Book | null {
    const book = this.state.books.find(b => b.id === id);
    if (!book) return null;
    const { earliest, activeCount } = this.getExpectedReturnDate(book.id);
    return {
      ...book,
      expected_return_date: earliest,
      active_loans_count: activeCount
    };
  }

  public getBookLoans(bookId: string): Loan[] {
    const currentDate = new Date();
    return this.state.loans
      .filter(l => l.book_id === bookId && !l.returned_at)
      .map(l => ({
        ...l,
        is_overdue: new Date(l.due_date).getTime() < currentDate.getTime()
      }));
  }

  public createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Book {
    const id = crypto.randomUUID ? crypto.randomUUID() : `book-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newBook: Book = {
      ...bookData,
      id,
      created_at: timestamp,
      updated_at: timestamp
    };
    this.state.books.unshift(newBook);
    return newBook;
  }

  public updateBook(id: string, updates: Partial<Book>): Book | null {
    const idx = this.state.books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    const updated: Book = {
      ...this.state.books[idx],
      ...updates,
      id,
      updated_at: new Date().toISOString()
    };
    this.state.books[idx] = updated;
    const { earliest, activeCount } = this.getExpectedReturnDate(id);
    return { ...updated, expected_return_date: earliest, active_loans_count: activeCount };
  }

  public deleteBook(id: string): boolean {
    const initialLen = this.state.books.length;
    this.state.books = this.state.books.filter(b => b.id !== id);
    this.state.loans = this.state.loans.filter(l => l.book_id !== id);
    this.state.requests = this.state.requests.filter(r => r.book_id !== id);
    this.state.notifications = this.state.notifications.filter(n => n.book_id !== id);
    return this.state.books.length < initialLen;
  }

  public issueBookCopy(bookId: string, dueDateStr?: string): { book: Book; loan: Loan } {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book) throw new Error('Book not found');
    if (book.available_copies <= 0) throw new Error('Cannot issue: 0 copies available');

    // Default 14 days
    const due = dueDateStr ? new Date(dueDateStr) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const loan: Loan = {
      id: crypto.randomUUID ? crypto.randomUUID() : `loan-${Date.now()}`,
      book_id: bookId,
      book_title: book.title,
      issued_at: new Date().toISOString(),
      due_date: due.toISOString(),
      returned_at: null,
      is_overdue: false,
    };

    book.available_copies -= 1;
    book.updated_at = new Date().toISOString();
    this.state.loans.unshift(loan);

    const { earliest, activeCount } = this.getExpectedReturnDate(bookId);
    return {
      book: { ...book, expected_return_date: earliest, active_loans_count: activeCount },
      loan
    };
  }

  public returnBookCopy(bookId: string, loanId?: string): { book: Book; returnedLoan: Loan | null } {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book) throw new Error('Book not found');
    if (book.available_copies >= book.total_copies) {
      throw new Error('All copies of this book are already in the library');
    }

    let returnedLoan: Loan | null = null;
    if (loanId) {
      const l = this.state.loans.find(item => item.id === loanId);
      if (l) {
        l.returned_at = new Date().toISOString();
        returnedLoan = l;
      }
    } else {
      // Find oldest active loan
      const active = this.state.loans.find(item => item.book_id === bookId && !item.returned_at);
      if (active) {
        active.returned_at = new Date().toISOString();
        returnedLoan = active;
      }
    }

    book.available_copies += 1;
    book.updated_at = new Date().toISOString();

    // TRIGGER BEHAVIOR:
    // If there were pending student requests for this book, generate a "book_available" notification
    const pendingRequests = this.state.requests.filter(r => r.book_id === bookId && r.status === 'pending');
    if (pendingRequests.length > 0) {
      const notif: LibraryNotification = {
        id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
        type: 'book_available',
        book_id: bookId,
        book_title: book.title,
        shelf_location: book.shelf_location,
        available_copies: book.available_copies,
        total_copies: book.total_copies,
        view_count: pendingRequests.length,
        is_read: false,
        is_resolved: false,
        created_at: new Date().toISOString(),
      };
      this.state.notifications.unshift(notif);
    }

    const { earliest, activeCount } = this.getExpectedReturnDate(bookId);
    return {
      book: { ...book, expected_return_date: earliest, active_loans_count: activeCount },
      returnedLoan
    };
  }

  public createRequest(bookId: string, studentName: string, studentContact: string, message?: string): BookRequest {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book) throw new Error('Book not found');

    const request: BookRequest = {
      id: crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`,
      book_id: bookId,
      book_title: book.title,
      student_name: studentName,
      student_contact: studentContact,
      message,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    this.state.requests.unshift(request);

    // Create librarian notification
    const { earliest } = this.getExpectedReturnDate(bookId);
    const notification: LibraryNotification = {
      id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      type: 'request',
      book_id: bookId,
      book_title: book.title,
      shelf_location: book.shelf_location,
      available_copies: book.available_copies,
      total_copies: book.total_copies,
      expected_return_date: earliest,
      request_id: request.id,
      student_name: studentName,
      student_contact: studentContact,
      message,
      view_count: 1,
      is_read: false,
      is_resolved: false,
      created_at: new Date().toISOString(),
    };

    this.state.notifications.unshift(notification);
    return request;
  }

  public recordUnavailableView(bookId: string): boolean {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book || book.available_copies > 0) return false;

    const nowMs = Date.now();
    const lastViewed = this.state.viewTracker.get(bookId) || 0;
    const ONE_HOUR = 60 * 60 * 1000;

    // Check if an existing unread view notification for this book exists within 1 hour
    const existing = this.state.notifications.find(
      n => n.type === 'view_unavailable' && n.book_id === bookId && !n.is_resolved
    );

    if (existing) {
      existing.view_count += 1;
      existing.is_read = false;
      return true;
    }

    if (nowMs - lastViewed < ONE_HOUR) {
      return false; // deduplicated
    }

    this.state.viewTracker.set(bookId, nowMs);

    const { earliest } = this.getExpectedReturnDate(bookId);
    const notification: LibraryNotification = {
      id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      type: 'view_unavailable',
      book_id: bookId,
      book_title: book.title,
      shelf_location: book.shelf_location,
      available_copies: 0,
      total_copies: book.total_copies,
      expected_return_date: earliest,
      view_count: 1,
      is_read: false,
      is_resolved: false,
      created_at: new Date().toISOString(),
    };

    this.state.notifications.unshift(notification);
    return true;
  }

  public getNotifications(): LibraryNotification[] {
    return [...this.state.notifications];
  }

  public updateNotification(id: string, updates: Partial<LibraryNotification>): LibraryNotification | null {
    const notif = this.state.notifications.find(n => n.id === id);
    if (!notif) return null;
    Object.assign(notif, updates);
    return { ...notif };
  }

  public markAllNotificationsRead(): void {
    this.state.notifications.forEach(n => { n.is_read = true; });
  }

  public getRequests(): BookRequest[] {
    return [...this.state.requests];
  }

  public updateRequest(id: string, updates: Partial<BookRequest>): BookRequest | null {
    const req = this.state.requests.find(r => r.id === id);
    if (!req) return null;
    Object.assign(req, updates);
    return { ...req };
  }

  public getStats(): LibrarianStats {
    const books = this.state.books;
    const totalBooks = books.length;
    let totalCopies = 0;
    let availableCopies = 0;
    let lowStock = 0;

    books.forEach(b => {
      totalCopies += b.total_copies;
      availableCopies += b.available_copies;
      if (b.available_copies > 0 && b.available_copies <= 2) {
        lowStock += 1;
      }
    });

    const issuedCopies = Math.max(0, totalCopies - availableCopies);
    const nowMs = Date.now();
    const overdueLoans = this.state.loans.filter(
      l => !l.returned_at && new Date(l.due_date).getTime() < nowMs
    ).length;

    const pendingRequests = this.state.requests.filter(r => r.status === 'pending').length;
    const unreadNotifs = this.state.notifications.filter(n => !n.is_read).length;

    return {
      total_books: totalBooks,
      total_copies: totalCopies,
      available_copies: availableCopies,
      issued_copies: issuedCopies,
      low_stock_books: lowStock,
      overdue_loans: overdueLoans,
      pending_requests: pendingRequests,
      unread_notifications: unreadNotifs
    };
  }
}

export const memoryDb = new MemoryDatabase();
