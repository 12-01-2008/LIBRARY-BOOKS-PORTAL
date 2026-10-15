import { 
  Book, 
  BooksResponse, 
  BookRequest, 
  LibraryNotification, 
  LibrarianStats 
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.details ? data.details.map((d: any) => d.message).join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Public endpoints
  async getBooks(params: {
    q?: string;
    subject?: string;
    available?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  } = {}): Promise<BooksResponse> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.subject && params.subject !== 'all') searchParams.set('subject', params.subject);
    if (params.available && params.available !== 'all') searchParams.set('available', params.available);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.order) searchParams.set('order', params.order);

    const query = searchParams.toString();
    return request<BooksResponse>(`/books${query ? `?${query}` : ''}`);
  },

  async getBookById(id: string): Promise<{ success: boolean; data: Book & { active_loans?: any[] } }> {
    return request<{ success: boolean; data: Book & { active_loans?: any[] } }>(`/books/${id}`);
  },

  async getSubjects(): Promise<{ success: boolean; data: string[] }> {
    return request<{ success: boolean; data: string[] }>('/subjects');
  },

  async submitBookRequest(bookId: string, payload: {
    student_name: string;
    student_contact: string;
    message?: string;
  }): Promise<{ success: boolean; message: string; data: BookRequest }> {
    return request(`/books/${bookId}/requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async recordBookView(bookId: string): Promise<{ success: boolean; recorded: boolean }> {
    return request(`/books/${bookId}/view`, {
      method: 'POST',
    });
  },

  // Librarian Protected Endpoints
  async getStats(token?: string): Promise<{ success: boolean; data: LibrarianStats }> {
    return request('/stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async createBook(bookData: Partial<Book>, token?: string): Promise<{ success: boolean; data: Book; message: string }> {
    return request('/books', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(bookData),
    });
  },

  async updateBook(id: string, updates: Partial<Book>, token?: string): Promise<{ success: boolean; data: Book; message: string }> {
    return request(`/books/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(updates),
    });
  },

  async deleteBook(id: string, token?: string): Promise<{ success: boolean; message: string }> {
    return request(`/books/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async issueBook(id: string, dueDate?: string, token?: string): Promise<{ success: boolean; data: any; message: string }> {
    return request(`/books/${id}/issue`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ due_date: dueDate }),
    });
  },

  async returnBook(id: string, loanId?: string, token?: string): Promise<{ success: boolean; data: any; message: string }> {
    return request(`/books/${id}/return`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ loan_id: loanId }),
    });
  },

  async patchAvailability(id: string, action: 'issue' | 'return' | 'set', amount: number = 1, token?: string): Promise<{ success: boolean; data: Book }> {
    return request(`/books/${id}/availability`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ action, amount }),
    });
  },

  async getNotifications(token?: string): Promise<{ success: boolean; data: LibraryNotification[]; unreadCount: number }> {
    return request('/notifications', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async updateNotification(id: string, updates: { is_read?: boolean; is_resolved?: boolean }, token?: string): Promise<{ success: boolean; data: LibraryNotification }> {
    return request(`/notifications/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(updates),
    });
  },

  async markAllNotificationsRead(token?: string): Promise<{ success: boolean; message: string }> {
    return request('/notifications/read-all', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async getRequests(params: { status?: string; q?: string } = {}, token?: string): Promise<{ success: boolean; data: BookRequest[] }> {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.q) searchParams.set('q', params.q);

    const query = searchParams.toString();
    return request(`/requests${query ? `?${query}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async updateRequest(id: string, updates: { status?: string; informed_by?: string }, token?: string): Promise<{ success: boolean; data: BookRequest; message: string }> {
    return request(`/requests/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(updates),
    });
  },
};
