import React from 'react';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  LayoutGrid, 
  ListFilter 
} from 'lucide-react';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSubject: string;
  onSelectSubject: (sub: string) => void;
  availabilityFilter: 'all' | 'available' | 'low_stock' | 'out_of_stock';
  onAvailabilityChange: (status: 'all' | 'available' | 'low_stock' | 'out_of_stock') => void;
  selectedFloor: number | 'all';
  onFloorChange: (floor: number | 'all') => void;
  sortBy: 'availability' | 'popularity' | 'title' | 'year';
  onSortChange: (sort: 'availability' | 'popularity' | 'title' | 'year') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  subjects: string[];
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSelectSubject,
  availabilityFilter,
  onAvailabilityChange,
  selectedFloor,
  onFloorChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  subjects,
}) => {
  return (
    <div className="relative pt-6 pb-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-slate-950/40 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Main Search Input */}
        <div className="relative max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-indigo-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by book title, author, subject, ISBN, or shelf code (e.g. 'CLRS', 'Kleppmann', 'CS-04')..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-xl shadow-indigo-950/30 text-sm sm:text-base transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Bar: Availability Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <button
              onClick={() => onAvailabilityChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                availabilityFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All Books
            </button>
            <button
              onClick={() => onAvailabilityChange('available')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                availabilityFilter === 'available'
                  ? 'bg-emerald-600/90 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Available Now
            </button>
            <button
              onClick={() => onAvailabilityChange('low_stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                availabilityFilter === 'low_stock'
                  ? 'bg-amber-600/90 text-white shadow-sm shadow-amber-500/20'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock (≤2)
            </button>
            <button
              onClick={() => onAvailabilityChange('out_of_stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                availabilityFilter === 'out_of_stock'
                  ? 'bg-rose-600/90 text-white shadow-sm shadow-rose-500/20'
                  : 'text-rose-400/80 hover:text-rose-300 hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Out of Stock (Hold)
            </button>
          </div>

          {/* Controls: Floor, Sort, View mode */}
          <div className="flex items-center gap-2">
            
            {/* Floor filter */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-xl text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedFloor}
                onChange={(e) => onFloorChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Floors</option>
                <option value={1} className="bg-slate-900 text-white">Floor 1 (Math & Arts)</option>
                <option value={2} className="bg-slate-900 text-white">Floor 2 (Tech & Eng)</option>
                <option value={3} className="bg-slate-900 text-white">Floor 3 (Bio & Med)</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-xl text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="availability" className="bg-slate-900 text-white">Availability</option>
                <option value="popularity" className="bg-slate-900 text-white">Most Borrowed</option>
                <option value="title" className="bg-slate-900 text-white">Title (A-Z)</option>
                <option value="year" className="bg-slate-900 text-white">Newest Edition</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table List"
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Subject / Department Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectSubject('all')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
              selectedSubject === 'all'
                ? 'bg-slate-100 text-slate-950 font-bold shadow'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => onSelectSubject(sub)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
                selectedSubject === sub
                  ? 'bg-indigo-500 text-white font-bold shadow shadow-indigo-500/25'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
