# BiblioSphere - Smart Library Book Availability Portal

A full-stack, production-quality web application for college libraries. Enables students to search catalog books in real time, see exact shelf aisle locations, check expected return dates for loaned items, and request instant arrival notifications. Provides librarians with inventory management, quick checkout/return controls, and a live notification center.

---

## 🏛️ Features

### For Students (No login required)
- **Instant Search:** Case-insensitive, debounced title, author, subject, ISBN, and shelf location search.
- **Availability Badges:** Distinct academic badges for **Available** (sage green), **Limited** (amber), and **Unavailable** (soft red).
- **Physical Shelf Locator:** Exact floor, wing, section, and shelf code (e.g. `Floor 2, North Wing, Shelf CS-02-A`).
- **Expected Return Dates:** For books with 0 available copies, displays the earliest due date among active student loans with friendly relative hints (e.g., *"Due back in 3 days on 24 Oct"*).
- **Ask the Library / Notify Me:** Spam-protected and rate-limited hold form allowing students to leave contact details for immediate notification upon book return.

### For Librarians (Role-protected authentication)
- **Supabase Auth Login:** Enforced with backend middleware checking `role = 'librarian'` in the `profiles` table.
- **Real-Time Alert Feed:** Bell icon with unread badge count, animated shake on new student requests, and live drawer.
- **Automated Return Alerts:** When an unavailable volume is returned to the shelf, the system automatically flags pending requests for that book as *"Book now available, notify student"*.
- **Inventory Management:** Full CRUD with confirmation dialogs for destructive actions.
- **Quick Issue & Return:** 1-click checkout with configurable due date (defaults to 14 days) and return with instant stock increment.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, TypeScript, React Router 7, Framer Motion, Tailwind CSS v4, Lucide Icons.
- **Backend:** Node.js, Express, Zod validation, Helmet security headers, CORS, Express Rate Limit, Centralized Error Handler.
- **Database & Auth:** Supabase (PostgreSQL with `pg_trgm` search indexes, Triggers, Views, and Row Level Security).

---

## 📁 Folder Structure

```
├── client / src
│   ├── components
│   │   ├── books/         # BookCard, BookFilters, BookDetailModal, RequestNotifyModal
│   │   ├── common/        # Navbar, Footer, Badge, SkeletonCard, ConfirmDialog, Toast, NotificationDrawer
│   │   └── librarian/     # StatsOverview, BookFormModal, IssueReturnModal, RequestReplyModal
│   ├── context/           # AuthContext, ThemeContext, NotificationContext
│   ├── hooks/             # useDebounce, useBooks, useNotifications
│   ├── pages/             # HomePage, CatalogPage, BookDetailPage, LoginPage, DashboardPage, RequestsPage, NotFoundPage
│   ├── services/          # api.ts (REST client), supabaseClient.ts (client SDK)
│   ├── types/             # Shared TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css          # Academic color variables & dark mode
├── server
│   ├── config/            # Supabase service role client & memory fallback
│   ├── controllers/       # bookController, loanController, requestController, notificationController
│   ├── data/              # 22+ realistic academic seed books & sample loans
│   ├── middleware/        # auth.ts, errorHandler.ts, rateLimit.ts, validate.ts
│   ├── routes/            # apiRoutes.ts
│   ├── validators/        # schemas.ts (Zod schemas)
│   ├── app.ts             # Express application
│   └── index.ts           # Standalone production server
├── supabase
│   └── schema.sql         # Complete PostgreSQL schema, views, triggers, and seed script
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Setup & Execution Guide

### 1. Database Setup in Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open your project dashboard and navigate to the **SQL Editor**.
3. Open `supabase/schema.sql` from this repository, paste the entire content, and click **Run**.
4. This will create:
   - `books`, `profiles`, `loans`, `book_requests`, and `notifications` tables.
   - `books_with_availability` view calculating `MIN(due_date)` for active loans.
   - Triggers for automatic return notifications and timestamp updates.
   - Trigram search indexes.
   - 22+ realistic academic books and sample active loans.

### 2. Creating Your First Librarian User
1. In your Supabase Dashboard, go to **Authentication** -> **Users** and click **Add user** (or sign up via the app).
2. Enter an email (e.g. `librarian@college.edu`) and password.
3. In the **SQL Editor**, execute:
   ```sql
   INSERT INTO public.profiles (id, role, name)
   VALUES ('<PASTE-USER-UUID-HERE>', 'librarian', 'Chief Librarian')
   ON CONFLICT (id) DO UPDATE SET role = 'librarian';
   ```

### 3. Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Fill in your credentials from Supabase **Project Settings -> API**:
```ini
PORT=3000
SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-private-key"
```

*Note:* If credentials are not yet set, the portal seamlessly runs with a resilient in-memory database and 1-click demo librarian login so you can evaluate all features immediately!

### 4. Running the Application
```bash
# Install dependencies
npm install

# Start Vite + Express dev server (serves frontend and /api on port 3000)
npm run dev

# Or build and run for production
npm run build
npm run start
```
