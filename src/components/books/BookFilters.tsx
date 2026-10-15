import React from 'react';
import { Search, X, SlidersHorizontal, CheckCircle2, BookOpen } from 'lucide-react';

interface BookFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSubject: string;
  onSubjectChange: (sub: string) => void;
  availabilityFilter: string;
  onAvailabilityChange: (status: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  subjects: string[];
  totalResults?: number;
}

export const BookFilters: React.FC<BookFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  availabilityFilter,
  onAvailabilityChange,
  sort,
  onSortChange,
  subjects,
  totalResults,
}) => {
  const isAvailableOnly = availabilityFilter === 'available' || availabilityFilter === 'true';

  return (
    <div className="space-y-4">
      
      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, author, subject, ISBN, or shelf location (e.g. 'Algorithms', 'Kleppmann', 'CS-02')..."
          className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-sm text-sm sm:text-base transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        
        {/* Availability Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-2xl">
          <button
            onClick={() => onAvailabilityChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !isAvailableOnly
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            All Books
          </button>
          <button
            onClick={() => onAvailabilityChange(isAvailableOnly ? 'all' : 'available')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAvailableOnly
                ? 'bg-[var(--color-available)] text-white shadow-xs'
                : 'text-[var(--color-available)] hover:bg-[var(--color-available-bg)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Available on Shelf</span>
          </button>
        </div>

        {/* Sort & Count */}
        <div className="flex items-center gap-3">
          {totalResults !== undefined && (
            <span className="text-xs text-[var(--color-text-muted)] font-medium">
              <strong className="text-[var(--color-text-main)]">{totalResults}</strong> titles found
            </span>
          )}

          <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5 rounded-xl text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-[var(--color-text-main)] text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="title" className="bg-[var(--color-surface)] text-[var(--color-text-main)]">Title (A-Z)</option>
              <option value="available" className="bg-[var(--color-surface)] text-[var(--color-text-main)]">Most Available Copies</option>
              <option value="year" className="bg-[var(--color-surface)] text-[var(--color-text-main)]">Publication Year</option>
            </select>
          </div>
        </div>

      </div>

      {/* Subject Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => onSubjectChange('all')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
            selectedSubject === 'all'
              ? 'bg-[var(--color-primary)] text-white font-bold shadow-xs'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border)] hover:border-slate-400'
          }`}
        >
          All Disciplines
        </button>
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => onSubjectChange(sub)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
              selectedSubject === sub
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border)] hover:border-slate-400'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

    </div>
  );
};
