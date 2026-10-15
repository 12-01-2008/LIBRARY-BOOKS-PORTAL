import { INITIAL_BOOKS, BookRecord } from '../data/sampleBooks.ts';
import { initialLoans } from '../data/seedData.ts';

export interface ProfileRecord {
  id: string;
  role: 'librarian' | 'student';
  name: string;
  email: string;
  created_at: string;
}

export interface LoanRecord {
  id: string;
  book_id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  issued_by?: string | null;
  created_at?: string;
}

export interface RequestRecord {
  id: string;
  book_id: string;
  student_name: string;
  student_contact: string;
  message: string | null;
  status: 'pending' | 'informed' | 'resolved';
  informed_at?: string | null;
  informed_by?: string | null;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  type: 'request' | 'view_unavailable' | 'book_available';
  book_id: string;
  request_id?: string | null;
  view_count: number;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

class SupabaseDataEngine {
  books: BookRecord[] = JSON.parse(JSON.stringify(INITIAL_BOOKS));
  loans: LoanRecord[] = JSON.parse(JSON.stringify(initialLoans));
  requests: RequestRecord[] = [
    {
      id: 'r001-0001',
      book_id: 'a001a111-0001-4000-8000-000000000003', // Deep Learning
      student_name: 'Maya Lin',
      student_contact: 'maya.lin@campus.edu',
      message: 'Need this for CS 682 midterm project next Tuesday.',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'r001-0002',
      book_id: 'a001a111-0001-4000-8000-000000000008', // Engineering Mechanics
      student_name: 'Devin Thorne',
      student_contact: 'd.thorne@campus.edu',
      message: 'Please hold copy when the overdue loan is checked in.',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    }
  ];
  notifications: NotificationRecord[] = [
    {
      id: 'n001-0001',
      type: 'request',
      book_id: 'a001a111-0001-4000-8000-000000000003',
      request_id: 'r001-0001',
      view_count: 1,
      is_read: false,
      is_resolved: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'n001-0002',
      type: 'view_unavailable',
      book_id: 'a001a111-0001-4000-8000-000000000003',
      view_count: 7,
      is_read: false,
      is_resolved: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];
  profiles: ProfileRecord[] = [
    {
      id: '87e28ac2-ed7a-4439-ac3f-9918d0ca1ca0',
      role: 'librarian',
      name: 'Chief Librarian',
      email: 'librarian@campus.edu',
      created_at: new Date().toISOString()
    }
  ];

  getBooksWithAvailability() {
    return this.books.map(b => {
      const active = this.loans.filter(l => l.book_id === b.id && !l.returned_at);
      let expectedReturn: string | null = null;
      if (active.length > 0) {
        const sorted = [...active].sort((x, y) => new Date(x.due_date).getTime() - new Date(y.due_date).getTime());
        expectedReturn = sorted[0].due_date;
      }
      return {
        ...b,
        expected_return_date: expectedReturn,
        active_loans_count: active.length
      };
    });
  }

  async handleFetch(urlStr: string, options: RequestInit = {}): Promise<Response> {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    const accept = headers.get('accept') || headers.get('Accept') || '';
    const prefer = headers.get('prefer') || headers.get('Prefer') || '';
    const wantsSingle = accept.includes('vnd.pgrst.object+json');
    const wantsCount = prefer.includes('count=exact');

    // 1. AUTH ENDPOINTS
    if (pathname.includes('/auth/v1/token')) {
      let body: any = {};
      if (typeof options.body === 'string') {
        try { body = JSON.parse(options.body); } catch {}
      }
      const email = body.email || 'librarian@campus.edu';
      const user = {
        id: '87e28ac2-ed7a-4439-ac3f-9918d0ca1ca0',
        aud: 'authenticated',
        role: 'authenticated',
        email,
        app_metadata: { provider: 'email' },
        user_metadata: { name: 'Chief Librarian' },
        created_at: new Date().toISOString()
      };
      return new Response(JSON.stringify({
        access_token: 'mock-supabase-access-token-librarian-2026',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pathname.includes('/auth/v1/user')) {
      const user = {
        id: '87e28ac2-ed7a-4439-ac3f-9918d0ca1ca0',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'librarian@campus.edu',
        app_metadata: { provider: 'email' },
        user_metadata: { name: 'Chief Librarian' },
        created_at: new Date().toISOString()
      };
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pathname.includes('/auth/v1/logout')) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. REST: PROFILES
    if (pathname.includes('/rest/v1/profiles')) {
      if (method === 'GET') {
        let list = [...this.profiles];
        const idParam = url.searchParams.get('id');
        if (idParam) {
          const id = idParam.replace('eq.', '');
          list = list.filter(p => p.id === id);
        }
        if (wantsSingle) {
          const item = list[0] || { id: '87e28ac2-ed7a-4439-ac3f-9918d0ca1ca0', role: 'librarian', name: 'Chief Librarian' };
          return new Response(JSON.stringify(item), {
            status: 200,
            headers: { 'Content-Type': 'application/vnd.pgrst.object+json' }
          });
        }
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. REST: BOOKS / BOOKS_WITH_AVAILABILITY
    if (pathname.includes('/rest/v1/books_with_availability') || pathname.includes('/rest/v1/books')) {
      const isView = pathname.includes('/rest/v1/books_with_availability');
      let data: any[] = isView ? this.getBooksWithAvailability() : [...this.books];

      if (method === 'GET') {
        // Handle id filter
        const idParam = url.searchParams.get('id');
        if (idParam) {
          const targetId = idParam.replace('eq.', '');
          data = data.filter(b => b.id === targetId);
        }

        // Handle subject filter
        const subjectParam = url.searchParams.get('subject');
        if (subjectParam) {
          const targetSub = subjectParam.replace('eq.', '');
          data = data.filter(b => b.subject.toLowerCase() === targetSub.toLowerCase());
        }

        // Handle available_copies filter
        const availParam = url.searchParams.get('available_copies');
        if (availParam && availParam.includes('gt.0')) {
          data = data.filter(b => b.available_copies > 0);
        }

        // Handle search .or filter
        const orParam = url.searchParams.get('or');
        if (orParam) {
          // e.g. (title.ilike.%algorithms%,author.ilike.%algorithms%)
          const match = orParam.match(/ilike\.\%([^%]+)\%/i);
          if (match && match[1]) {
            const term = decodeURIComponent(match[1]).toLowerCase();
            data = data.filter(b =>
              b.title.toLowerCase().includes(term) ||
              b.author.toLowerCase().includes(term) ||
              b.subject.toLowerCase().includes(term) ||
              b.isbn.toLowerCase().includes(term)
            );
          }
        }

        // Handle order
        const orderParam = url.searchParams.get('order');
        if (orderParam) {
          const [col, dir] = orderParam.split('.');
          const asc = dir !== 'desc';
          data.sort((a, b) => {
            const valA = a[col] ?? '';
            const valB = b[col] ?? '';
            if (typeof valA === 'number' && typeof valB === 'number') {
              return asc ? valA - valB : valB - valA;
            }
            return asc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
          });
        }

        const totalCount = data.length;

        // Handle offset and limit
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const limit = parseInt(url.searchParams.get('limit') || '100', 10);
        const pagedData = data.slice(offset, offset + limit);

        if (wantsSingle) {
          const item = data[0] || null;
          if (!item) {
            return new Response(JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }), {
              status: 406,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify(item), {
            status: 200,
            headers: { 'Content-Type': 'application/vnd.pgrst.object+json' }
          });
        }

        const resHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (wantsCount || headers.get('range')) {
          const end = Math.max(0, Math.min(offset + limit - 1, totalCount - 1));
          resHeaders['content-range'] = `${offset}-${end}/${totalCount}`;
        }

        return new Response(JSON.stringify(pagedData), {
          status: 200,
          headers: resHeaders
        });
      }

      if (method === 'POST') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const newBook: BookRecord = {
          id: body.id || (crypto.randomUUID ? crypto.randomUUID() : `b-${Date.now()}`),
          title: body.title || 'Untitled',
          author: body.author || 'Unknown',
          subject: body.subject || 'General',
          isbn: body.isbn || `978${Date.now()}`,
          total_copies: Number(body.total_copies) || 1,
          available_copies: Number(body.available_copies ?? body.total_copies) || 1,
          shelf_location: body.shelf_location || 'General Stacks',
          cover_url: body.cover_url || '',
          description: body.description || '',
          edition: body.edition || '1st Edition',
          publisher: body.publisher || 'Campus Press',
          publication_year: Number(body.publication_year) || new Date().getFullYear(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.books.unshift(newBook);
        return new Response(JSON.stringify(wantsSingle ? newBook : [newBook]), {
          status: 201,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
          }
        });
      }

      if (method === 'PATCH') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const idParam = url.searchParams.get('id');
        const targetId = idParam ? idParam.replace('eq.', '') : null;
        const index = this.books.findIndex(b => b.id === targetId);
        if (index === -1) {
          return new Response(JSON.stringify({ message: 'Book not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const updated = {
          ...this.books[index],
          ...body,
          updated_at: new Date().toISOString()
        };
        this.books[index] = updated;
        return new Response(JSON.stringify(wantsSingle ? updated : [updated]), {
          status: 200,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
          }
        });
      }

      if (method === 'DELETE') {
        const idParam = url.searchParams.get('id');
        const targetId = idParam ? idParam.replace('eq.', '') : null;
        this.books = this.books.filter(b => b.id !== targetId);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 4. REST: LOANS
    if (pathname.includes('/rest/v1/loans')) {
      if (method === 'GET') {
        let list = [...this.loans];
        const bookIdParam = url.searchParams.get('book_id');
        if (bookIdParam) {
          const bId = bookIdParam.replace('eq.', '');
          list = list.filter(l => l.book_id === bId);
        }
        const returnedParam = url.searchParams.get('returned_at');
        if (returnedParam && returnedParam.includes('is.null')) {
          list = list.filter(l => !l.returned_at);
        }
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (method === 'POST') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const newLoan: LoanRecord = {
          id: body.id || (crypto.randomUUID ? crypto.randomUUID() : `loan-${Date.now()}`),
          book_id: body.book_id,
          issued_at: body.issued_at || new Date().toISOString(),
          due_date: body.due_date,
          returned_at: null,
          issued_by: body.issued_by || '87e28ac2-ed7a-4439-ac3f-9918d0ca1ca0',
          created_at: new Date().toISOString()
        };
        this.loans.unshift(newLoan);
        return new Response(JSON.stringify(wantsSingle ? newLoan : [newLoan]), {
          status: 201,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
          }
        });
      }

      if (method === 'PATCH') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const idParam = url.searchParams.get('id');
        const targetId = idParam ? idParam.replace('eq.', '') : null;
        const loan = this.loans.find(l => l.id === targetId);
        if (loan) {
          Object.assign(loan, body);
        }
        return new Response(JSON.stringify(wantsSingle ? (loan || {}) : [loan || {}]), {
          status: 200,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
          }
        });
      }
    }

    // 5. REST: BOOK_REQUESTS
    if (pathname.includes('/rest/v1/book_requests')) {
      if (method === 'GET') {
        let list = [...this.requests];
        const statusParam = url.searchParams.get('status');
        if (statusParam) {
          const s = statusParam.replace('eq.', '');
          list = list.filter(r => r.status === s);
        }
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (method === 'POST') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const newReq: RequestRecord = {
          id: body.id || (crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`),
          book_id: body.book_id,
          student_name: body.student_name,
          student_contact: body.student_contact,
          message: body.message || null,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        this.requests.unshift(newReq);
        return new Response(JSON.stringify(wantsSingle ? newReq : [newReq]), {
          status: 201,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
          }
        });
      }

      if (method === 'PATCH') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const idParam = url.searchParams.get('id');
        const targetId = idParam ? idParam.replace('eq.', '') : null;
        const reqItem = this.requests.find(r => r.id === targetId);
        if (reqItem) {
          Object.assign(reqItem, body);
        }
        return new Response(JSON.stringify(wantsSingle ? (reqItem || {}) : [reqItem || {}]), {
          status: 200,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
          }
        });
      }
    }

    // 6. REST: NOTIFICATIONS
    if (pathname.includes('/rest/v1/notifications')) {
      if (method === 'GET') {
        const enriched = this.notifications.map(n => {
          const book = this.books.find(b => b.id === n.book_id);
          const req = n.request_id ? this.requests.find(r => r.id === n.request_id) : null;
          return {
            ...n,
            books: book ? {
              title: book.title,
              shelf_location: book.shelf_location,
              available_copies: book.available_copies
            } : null,
            book_requests: req ? {
              student_name: req.student_name,
              student_contact: req.student_contact,
              message: req.message
            } : null
          };
        });
        return new Response(JSON.stringify(enriched), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (method === 'POST') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const newNotif: NotificationRecord = {
          id: body.id || (crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`),
          type: body.type,
          book_id: body.book_id,
          request_id: body.request_id || null,
          view_count: body.view_count || 1,
          is_read: false,
          is_resolved: false,
          created_at: new Date().toISOString()
        };
        this.notifications.unshift(newNotif);
        return new Response(JSON.stringify(wantsSingle ? newNotif : [newNotif]), {
          status: 201,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
          }
        });
      }

      if (method === 'PATCH') {
        let body: any = {};
        if (typeof options.body === 'string') {
          try { body = JSON.parse(options.body); } catch {}
        }
        const idParam = url.searchParams.get('id');
        const targetId = idParam ? idParam.replace('eq.', '') : null;
        if (targetId) {
          const n = this.notifications.find(x => x.id === targetId);
          if (n) Object.assign(n, body);
          return new Response(JSON.stringify(wantsSingle ? (n || {}) : [n || {}]), {
            status: 200,
            headers: {
              'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json'
            }
          });
        }
        // Bulk update (e.g. mark all read)
        this.notifications.forEach(n => Object.assign(n, body));
        return new Response(JSON.stringify(this.notifications), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const supabaseDataEngine = new SupabaseDataEngine();
