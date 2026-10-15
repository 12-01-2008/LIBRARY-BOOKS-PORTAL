-- ====================================================================
-- SMART LIBRARY BOOK AVAILABILITY PORTAL - SUPABASE SQL SCHEMA
-- Run this complete script in your Supabase Project -> SQL Editor
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'librarian')) DEFAULT 'student',
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  subject TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  total_copies INTEGER NOT NULL CHECK (total_copies >= 1),
  available_copies INTEGER NOT NULL CHECK (available_copies >= 0),
  shelf_location TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  edition TEXT,
  publisher TEXT,
  publication_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_copies_valid CHECK (available_copies <= total_copies)
);

-- 4. Loans Table (Active and Historical checkouts)
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast calculation of active loans and expected return dates
CREATE INDEX IF NOT EXISTS idx_loans_book_active ON public.loans(book_id, returned_at);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON public.loans(due_date);

-- 5. Book Requests Table ("Ask the library" / "Notify me")
CREATE TABLE IF NOT EXISTS public.book_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_contact TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'informed', 'resolved')) DEFAULT 'pending',
  informed_at TIMESTAMPTZ,
  informed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_book_status ON public.book_requests(book_id, status);

-- 6. Notifications Table (Librarian real-time alert feed)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('request', 'view_unavailable', 'book_available')),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.book_requests(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 1,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read, created_at DESC);

-- 7. High Performance Trigram & Text Indexes for Fast Search
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON public.books USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON public.books USING gin (author gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_subject_trgm ON public.books USING gin (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);

-- 8. View: Books with Expected Return Date Calculation
CREATE OR REPLACE VIEW public.books_with_availability AS
SELECT 
  b.id,
  b.title,
  b.author,
  b.subject,
  b.isbn,
  b.total_copies,
  b.available_copies,
  b.shelf_location,
  b.cover_url,
  b.description,
  b.edition,
  b.publisher,
  b.publication_year,
  b.created_at,
  b.updated_at,
  CASE 
    WHEN b.available_copies > 0 THEN 'Available'
    WHEN b.available_copies = 0 AND active_loans.earliest_due IS NOT NULL THEN 'Unavailable'
    ELSE 'Unavailable'
  END AS availability_status,
  active_loans.earliest_due AS expected_return_date,
  COALESCE(active_loans.active_count, 0) AS active_loans_count
FROM public.books b
LEFT JOIN (
  SELECT 
    book_id,
    MIN(due_date) AS earliest_due,
    COUNT(*) AS active_count
  FROM public.loans
  WHERE returned_at IS NULL
  GROUP BY book_id
) active_loans ON b.id = active_loans.book_id;

-- 9. Trigger: When a copy is returned, notify librarian that waiting students can be informed
CREATE OR REPLACE FUNCTION public.handle_loan_return_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_pending_count INT;
BEGIN
  -- When returned_at changes from NULL to a timestamp
  IF OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL THEN
    -- Check if there are pending student requests for this book
    SELECT COUNT(*) INTO v_pending_count 
    FROM public.book_requests 
    WHERE book_id = NEW.book_id AND status = 'pending';

    IF v_pending_count > 0 THEN
      INSERT INTO public.notifications (type, book_id, view_count, is_read, is_resolved)
      VALUES ('book_available', NEW.book_id, v_pending_count, false, false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_loan_return_notify ON public.loans;
CREATE TRIGGER trg_loan_return_notify
AFTER UPDATE OF returned_at ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.handle_loan_return_notification();

-- 10. Trigger: Auto sync updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_books_updated_at ON public.books;
CREATE TRIGGER trg_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 11. Row Level Security (RLS) Configuration
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Books policies: Public read, librarian write
CREATE POLICY "Public can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Librarians can insert books" ON public.books FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);
CREATE POLICY "Librarians can update books" ON public.books FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);
CREATE POLICY "Librarians can delete books" ON public.books FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);

-- Loans policies: Librarians only
CREATE POLICY "Librarians can view loans" ON public.loans FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);
CREATE POLICY "Librarians can manage loans" ON public.loans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);

-- Book requests policies: Public can insert via backend or auth, librarians can view and update
CREATE POLICY "Public can insert requests" ON public.book_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Librarians can view requests" ON public.book_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);
CREATE POLICY "Librarians can update requests" ON public.book_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);

-- Notifications policies: Librarians only
CREATE POLICY "Librarians can view notifications" ON public.notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);
CREATE POLICY "Librarians can update notifications" ON public.notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'librarian')
);

-- Enable Realtime publication for notifications and book requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;

-- ====================================================================
-- SEED DATA: 22+ Authentic Academic College Books with Active Loans & Requests
-- ====================================================================

INSERT INTO public.books (id, title, author, subject, isbn, total_copies, available_copies, shelf_location, cover_url, description, edition, publisher, publication_year)
VALUES
  ('a001a111-0001-4000-8000-000000000001', 'Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 'Computer Science', '9780262046305', 10, 4, 'Floor 2, North Wing, Shelf CS-02-A', 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=600&q=80', 'The premier algorithms textbook worldwide. Comprehensive coverage of modern algorithms, graph algorithms, dynamic programming, and greedy algorithms.', '4th Edition', 'MIT Press', 2022),
  ('a001a111-0001-4000-8000-000000000002', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'Computer Science', '9781449373320', 6, 1, 'Floor 2, North Wing, Shelf CS-04-B', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 'The definitive guide to the architectures of reliable, scalable, and maintainable systems. Essential reading on replication, partitioning, and stream processing.', '1st Edition', 'O''Reilly Media', 2017),
  ('a001a111-0001-4000-8000-000000000003', 'Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', 'Computer Science', '9780262035613', 8, 0, 'Floor 2, North Wing, Shelf CS-01-C', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', 'An authoritative text offering mathematical and conceptual foundations for deep feedforward networks, regularization, convolutional networks, and autoencoders.', '1st Edition', 'MIT Press', 2016),
  ('a001a111-0001-4000-8000-000000000004', 'Linear Algebra and Its Applications', 'Gilbert Strang', 'Mathematics', '9780030105678', 12, 7, 'Floor 1, East Hall, Shelf MATH-03-A', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', 'A classic university text renowned for connecting concrete matrix algebra with abstract geometric intuition, eigenvalues, singular value decomposition, and applications.', '5th Edition', 'Wellesley-Cambridge Press', 2021),
  ('a001a111-0001-4000-8000-000000000005', 'Molecular Biology of the Cell', 'Bruce Alberts, Rebecca Heald, Alexander Johnson', 'Biology & Medicine', '9780393884821', 5, 2, 'Floor 3, Science Tower, Shelf BIO-05-D', 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=600&q=80', 'The gold standard for medical and life science education, exploring cell physiology, gene expression, membrane trafficking, and signal transduction.', '7th Edition', 'W. W. Norton & Company', 2022),
  ('a001a111-0001-4000-8000-000000000006', 'Principles of Neural Science', 'Eric R. Kandel, John D. Koester, Sarah H. Mack', 'Biology & Medicine', '9781259642234', 4, 1, 'Floor 3, Science Tower, Shelf BIO-02-B', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80', 'The preeminent neuroscience reference deciphering how cellular and molecular neurobiology generate perception, action, emotion, and memory.', '6th Edition', 'McGraw-Hill', 2021),
  ('a001a111-0001-4000-8000-000000000007', 'Microeconomic Theory', 'Andreu Mas-Colell, Michael D. Whinston, Jerry R. Green', 'Economics', '9780195073409', 6, 4, 'Floor 1, East Hall, Shelf ECON-01-A', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80', 'The rigorous standard for graduate and advanced undergraduate economic study: consumer theory, production sets, competitive equilibrium, and social choice.', '1st Edition', 'Oxford University Press', 1995),
  ('a001a111-0001-4000-8000-000000000008', 'Engineering Mechanics: Dynamics', 'J. L. Meriam, L. G. Kraige, J. N. Bolton', 'Engineering', '9781119665281', 7, 0, 'Floor 2, North Wing, Shelf ENG-03-C', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 'Fundamental dynamic engineering principles: particle kinematics, planar kinetics of rigid bodies, work-energy, and mechanical vibration systems.', '9th Edition', 'Wiley', 2020),
  ('a001a111-0001-4000-8000-000000000009', 'The Art of Electronics', 'Paul Horowitz, Winfield Hill', 'Engineering', '9780521809269', 5, 3, 'Floor 2, North Wing, Shelf ENG-06-B', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80', 'Widely regarded as the bible of hands-on electronic design. Op-amps, active filters, transistor modeling, and micro-controller interfacing.', '3rd Edition', 'Cambridge University Press', 2015),
  ('a001a111-0001-4000-8000-000000000010', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Computer Science', '9780132350884', 8, 5, 'Floor 2, North Wing, Shelf CS-08-A', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80', 'Best practices, design heuristics, and discipline for writing maintainable, readable, and robust software systems in team environments.', '1st Edition', 'Prentice Hall', 2008),
  ('a001a111-0001-4000-8000-000000000011', 'Operating Systems: Three Easy Pieces', 'Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau', 'Computer Science', '9781985086593', 6, 2, 'Floor 2, North Wing, Shelf CS-03-D', 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80', 'Clear pedagogical guide to virtualization (CPU and memory), concurrency (locks and semaphores), and persistence (file systems and storage).', '1.1 Edition', 'Arpaci-Dusseau Books', 2023),
  ('a001a111-0001-4000-8000-000000000012', 'Thinking, Fast and Slow', 'Daniel Kahneman', 'Psychology', '9780374533557', 7, 3, 'Floor 1, East Hall, Shelf PSY-02-A', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80', 'Nobel laureate Kahneman explores the dual systems of human cognition: fast instinctive heuristics vs deliberate analytical reasoning.', '1st Edition', 'Farrar, Straus and Giroux', 2011),
  ('a001a111-0001-4000-8000-000000000013', 'Classical Mechanics', 'Herbert Goldstein, Charles P. Poole, John L. Safko', 'Physics', '9780201657029', 5, 2, 'Floor 3, Science Tower, Shelf PHYS-04-B', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80', 'The advanced physics standard on Lagrangian mechanics, Hamiltonian formulation, canonical transformations, and relativistic mechanics.', '3rd Edition', 'Pearson', 2002),
  ('a001a111-0001-4000-8000-000000000014', 'Organic Chemistry', 'Paula Yurkanis Bruice', 'Chemistry', '9780134042282', 8, 1, 'Floor 3, Science Tower, Shelf CHEM-01-A', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80', 'Reaction mechanisms, synthesis strategies, and orbital symmetry principles essential for pre-med and biochemistry majors.', '8th Edition', 'Pearson', 2016),
  ('a001a111-0001-4000-8000-000000000015', 'Calculus: Early Transcendentals', 'James Stewart', 'Mathematics', '9781285741550', 15, 6, 'Floor 1, East Hall, Shelf MATH-01-C', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', 'The most widely assigned calculus textbook in North America, renowned for mathematical precision, problem variety, and geometric clarity.', '8th Edition', 'Cengage Learning', 2015),
  ('a001a111-0001-4000-8000-000000000016', 'Justice: What''s the Right Thing to Do?', 'Michael J. Sandel', 'Philosophy & Law', '9780374532505', 6, 4, 'Floor 1, East Hall, Shelf PHIL-03-B', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80', 'Harvard professor Sandel guides readers through fundamental moral dilemmas: utilitarianism, Kantian ethics, affirmative action, and social contracts.', '1st Edition', 'Farrar, Straus and Giroux', 2010),
  ('a001a111-0001-4000-8000-000000000017', 'Computer Networking: A Top-Down Approach', 'James F. Kurose, Keith W. Ross', 'Computer Science', '9780136681557', 7, 2, 'Floor 2, North Wing, Shelf CS-05-A', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80', 'Pedagogical top-down approach focusing on application layer down through transport, network, and physical links. Comprehensive HTTP, DNS, TCP/IP, and wireless.', '8th Edition', 'Pearson', 2021),
  ('a001a111-0001-4000-8000-000000000018', 'Modern Control Engineering', 'Katsuhiko Ogata', 'Engineering', '9780136156734', 5, 0, 'Floor 2, North Wing, Shelf ENG-02-D', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80', 'Classic treatment of continuous-time control systems: Laplace transforms, root-locus techniques, frequency-response analysis, and state-space models.', '5th Edition', 'Prentice Hall', 2010),
  ('a001a111-0001-4000-8000-000000000019', 'Robotics: Modelling, Planning and Control', 'Bruno Siciliano, Lorenzo Sciavicco, Luigi Villani, Giuseppe Oriolo', 'Engineering', '9781846286414', 4, 2, 'Floor 2, North Wing, Shelf ENG-07-A', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80', 'Kinematics, dynamics, motion planning, and trajectory control for industrial robot manipulators and autonomous mobile platforms.', '1st Edition', 'Springer', 2009),
  ('a001a111-0001-4000-8000-000000000020', 'Corporate Finance', 'Jonathan Berk, Peter DeMarzo', 'Economics', '9780135161081', 9, 5, 'Floor 1, East Hall, Shelf ECON-04-C', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80', 'Modern financial decisions grounded in the Law of One Price: capital budgeting, risk and return, capital structure, and corporate valuation.', '5th Edition', 'Pearson', 2020),
  ('a001a111-0001-4000-8000-000000000021', 'Guns, Germs, and Steel: The Fates of Human Societies', 'Jared Diamond', 'History & Anthropology', '9780393354324', 8, 6, 'Floor 1, East Hall, Shelf HIST-01-B', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', 'Pulitzer Prize-winning analysis demonstrating how environmental and geographic factors shaped the distinct fates of human civilizations over 13,000 years.', '20th Anniversary Edition', 'W. W. Norton & Company', 2017),
  ('a001a111-0001-4000-8000-000000000022', 'Quantum Computation and Quantum Information', 'Michael A. Nielsen, Isaac L. Chuang', 'Physics', '9781107002173', 5, 2, 'Floor 3, Science Tower, Shelf PHYS-08-A', 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600&q=80', 'Known affectionately in the field as "Mike and Ike". The definitive introduction to qubits, quantum gates, error correction, and quantum algorithms.', '10th Anniversary Edition', 'Cambridge University Press', 2010)
ON CONFLICT (isbn) DO NOTHING;

-- Seed Active Loans (Includes future due dates and overdue loans for unavailable books)
INSERT INTO public.loans (id, book_id, issued_at, due_date, returned_at)
VALUES
  -- Deep Learning (8 copies all issued, 0 available)
  ('b001b111-0001-4000-8000-000000000001', 'a001a111-0001-4000-8000-000000000003', NOW() - INTERVAL '11 days', NOW() + INTERVAL '3 days', NULL),
  ('b001b111-0001-4000-8000-000000000002', 'a001a111-0001-4000-8000-000000000003', NOW() - INTERVAL '8 days', NOW() + INTERVAL '6 days', NULL),
  ('b001b111-0001-4000-8000-000000000003', 'a001a111-0001-4000-8000-000000000003', NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', NULL),

  -- Engineering Mechanics: Dynamics (7 copies all issued, 0 available)
  ('b001b111-0001-4000-8000-000000000004', 'a001a111-0001-4000-8000-000000000008', NOW() - INTERVAL '18 days', NOW() - INTERVAL '4 days', NULL), -- OVERDUE!
  ('b001b111-0001-4000-8000-000000000005', 'a001a111-0001-4000-8000-000000000008', NOW() - INTERVAL '10 days', NOW() + INTERVAL '4 days', NULL),

  -- Modern Control Engineering (5 copies all issued, 0 available)
  ('b001b111-0001-4000-8000-000000000006', 'a001a111-0001-4000-8000-000000000018', NOW() - INTERVAL '9 days', NOW() + INTERVAL '5 days', NULL),

  -- Introduction to Algorithms (6 copies issued, 4 available)
  ('b001b111-0001-4000-8000-000000000007', 'a001a111-0001-4000-8000-000000000001', NOW() - INTERVAL '4 days', NOW() + INTERVAL '10 days', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Student Book Requests
INSERT INTO public.book_requests (id, book_id, student_name, student_contact, message, status, created_at)
VALUES
  ('c001c111-0001-4000-8000-000000000001', 'a001a111-0001-4000-8000-000000000003', 'Maya Lin', 'maya.lin@college.edu', 'Need this for CS482 final project by next Friday. Please let me know if an earlier copy arrives.', 'pending', NOW() - INTERVAL '4 hours'),
  ('c001c111-0001-4000-8000-000000000002', 'a001a111-0001-4000-8000-000000000008', 'James Wilson', 'j.wilson@college.edu', 'Preparing for the dynamics midterm exam.', 'pending', NOW() - INTERVAL '1 day'),
  ('c001c111-0001-4000-8000-000000000003', 'a001a111-0001-4000-8000-000000000002', 'Aisha Khan', 'aisha.k@college.edu', 'Can I place a physical hold at the front circulation desk?', 'informed', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Notifications for Librarians
INSERT INTO public.notifications (id, type, book_id, request_id, view_count, is_read, is_resolved, created_at)
VALUES
  ('d001d111-0001-4000-8000-000000000001', 'request', 'a001a111-0001-4000-8000-000000000003', 'c001c111-0001-4000-8000-000000000001', 1, false, false, NOW() - INTERVAL '4 hours'),
  ('d001d111-0001-4000-8000-000000000002', 'view_unavailable', 'a001a111-0001-4000-8000-000000000008', NULL, 4, false, false, NOW() - INTERVAL '2 hours'),
  ('d001d111-0001-4000-8000-000000000003', 'book_available', 'a001a111-0001-4000-8000-000000000002', NULL, 1, true, true, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
