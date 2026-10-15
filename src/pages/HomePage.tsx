import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  Calendar, 
  MapPin, 
  BellRing, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  ShieldCheck,
  Layers
} from 'lucide-react';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/books/BookCard';
import { BookDetailModal } from '../components/books/BookDetailModal';
import { RequestNotifyModal } from '../components/books/RequestNotifyModal';
import { Book } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [notifyBook, setNotifyBook] = useState<Book | null>(null);

  const { books, isLoading } = useBooks({ initialLimit: 6 });

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const popularDisciplines = [
    { name: 'Computer Science', count: 'Algorithms & AI', icon: '💻' },
    { name: 'Engineering', count: 'Circuits & Dynamics', icon: '⚙️' },
    { name: 'Mathematics', count: 'Linear Algebra & Calculus', icon: '📐' },
    { name: 'Biology & Medicine', count: 'Cell Bio & Neuro', icon: '🧬' },
    { name: 'Economics', count: 'Finance & Game Theory', icon: '📊' },
    { name: 'Physics', count: 'Classical & Quantum', icon: '⚛️' },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-12">
      
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-10 overflow-hidden">
        
        {/* Subtle academic background pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #E0A030 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Never waste a trip to empty library shelves</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-text-main)] font-serif-academic tracking-tight leading-[1.15]"
          >
            Let's find your next read, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500">
              ready on the shelf.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed"
          >
            Search college textbook availability in real time. Know exactly which floor and shelf aisle to walk to—or see the exact return date and request an instant alert.
          </motion.p>

          {/* Large Hero Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleHeroSearch}
            className="max-w-2xl mx-auto pt-2"
          >
            <div className="relative flex items-center p-2 rounded-2xl sm:rounded-3xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-xl hover:border-amber-500/60 focus-within:border-amber-500 transition-all">
              <Search className="w-5 h-5 text-amber-500 ml-3 mr-2 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by book title, author, subject, or ISBN (e.g. 'CLRS', 'Deep Learning')..."
                className="w-full bg-transparent text-sm sm:text-base text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none py-2"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl sm:rounded-2xl bg-[var(--color-primary)] text-white text-xs sm:text-sm font-bold hover:bg-[var(--color-primary-light)] transition-colors shrink-0 shadow-sm flex items-center gap-2"
              >
                <span>Check Availability</span>
                <ArrowRight className="w-4 h-4 hidden sm:inline" />
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--color-text-muted)] pt-3">
              <span>Popular searches:</span>
              {['Introduction to Algorithms', 'Designing Data-Intensive Applications', 'Linear Algebra', 'Clean Code'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => navigate(`/catalog?q=${encodeURIComponent(q)}`)}
                  className="underline hover:text-amber-500 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.form>

        </div>
      </section>

      {/* Popular Disciplines Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
          <h2 className="text-2xl font-bold font-serif-academic text-[var(--color-text-main)]">
            Explore by Discipline
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Jump directly into course stacks and reference collections
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {popularDisciplines.map((d, idx) => (
            <motion.div
              key={d.name}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => navigate(`/catalog?subject=${encodeURIComponent(d.name)}`)}
              className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-amber-500/50 cursor-pointer shadow-xs transition-all text-center group flex flex-col justify-between"
            >
              <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">
                {d.icon}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-main)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-serif-academic">
                  {d.name}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                  {d.count}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works / 3-Step Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-12 shadow-sm">
          
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1.5">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-serif-academic">
              Smart Library Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-academic text-[var(--color-text-main)]">
              How BiblioSphere Saves You Time
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Designed around actual campus life, exams, and project deadlines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            <div className="space-y-3 p-5 rounded-2xl bg-[var(--color-surface-muted)]/60 border border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-base font-serif-academic">
                1
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-main)] font-serif-academic">
                Instant Availability & Shelf Map
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Check whether physical copies are on the shelf before heading over. Get the exact floor, wing, and call number (e.g. Floor 2 • Shelf CS-02-A).
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-[var(--color-surface-muted)]/60 border border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-base font-serif-academic">
                2
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-main)] font-serif-academic">
                Expected Return Dates
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                If all copies are checked out, see exactly when the earliest active loan is due back ("due back in 3 days on 24 Oct.") without asking at the counter.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-[var(--color-surface-muted)]/60 border border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-base font-serif-academic">
                3
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-main)] font-serif-academic">
                "Ask Library" & Return Alerts
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Leave your email or student ID. When a peer returns the book, our librarians are automatically notified to inform you and place the hold.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Books on Shelf */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-academic text-[var(--color-text-main)]">
              Featured Course Reserves & Stacks
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Popular volumes across current semester syllabi
            </p>
          </div>
          <button
            onClick={() => navigate('/catalog')}
            className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View All Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.slice(0, 6).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={(b) => setSelectedBook(b)}
              onRequestNotify={(b) => setNotifyBook(b)}
            />
          ))}
        </div>
      </section>

      {/* Modals */}
      <BookDetailModal
        book={selectedBook}
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        onRequestNotify={(b) => setNotifyBook(b)}
      />

      <RequestNotifyModal
        book={notifyBook}
        isOpen={Boolean(notifyBook)}
        onClose={() => setNotifyBook(null)}
      />

    </div>
  );
};
