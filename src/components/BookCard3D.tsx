import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookMarked, 
  Eye, 
  CornerDownRight,
  TrendingUp,
  Hash
} from 'lucide-react';
import { Book } from '../types/library';

interface BookCard3DProps {
  book: Book;
  onSelectBook: (book: Book) => void;
  onReserveClick: (book: Book) => void;
  isLibrarianMode?: boolean;
  onQuickCheckout?: (book: Book) => void;
}

export const BookCard3D: React.FC<BookCard3DProps> = ({
  book,
  onSelectBook,
  onReserveClick,
  isLibrarianMode,
  onQuickCheckout,
}) => {
  const isAvailable = book.available_copies > 0;
  const isLowStock = book.available_copies > 0 && book.available_copies <= 2;

  // Status configuration
  const statusConfig = {
    available: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      text: `${book.available_copies} of ${book.total_copies} Available`,
      icon: CheckCircle2,
    },
    low_stock: {
      bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse',
      text: `Only ${book.available_copies} Left (Low Stock)`,
      icon: AlertTriangle,
    },
    out_of_stock: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      text: 'All Checked Out (Waitlist Open)',
      icon: XCircle,
    },
    on_reserve: {
      bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400',
      text: 'On Course Reserve',
      icon: AlertTriangle,
    }
  };

  const currentStatus = isAvailable 
    ? (isLowStock ? statusConfig.low_stock : statusConfig.available) 
    : statusConfig.out_of_stock;

  const StatusIcon = currentStatus.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-indigo-950/40"
    >
      {/* Top Section: Subject Badge & Availability Pill */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 truncate max-w-[150px]">
            {book.subject}
          </span>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${currentStatus.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
            <span>{currentStatus.text}</span>
          </div>
        </div>

        {/* Book Media & Title Layout */}
        <div className="flex gap-4 mb-3.5">
          {/* Book Cover with 3D spine illusion */}
          <div 
            onClick={() => onSelectBook(book)}
            className="relative cursor-pointer shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shadow-md group-hover:shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300 bg-slate-800 border border-slate-700/60"
          >
            <img 
              src={book.cover_image_url} 
              alt={book.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Visual spine shading */}
            <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
              <span className="text-[10px] text-white font-medium flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded">
                <Eye className="w-2.5 h-2.5" /> View
              </span>
            </div>
          </div>

          {/* Book info */}
          <div className="flex-1 min-w-0">
            <h3 
              onClick={() => onSelectBook(book)}
              className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 cursor-pointer leading-snug mb-1"
            >
              {book.title}
            </h3>
            
            <p className="text-xs text-slate-400 line-clamp-1 mb-2 font-medium">
              by {book.author}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                {book.edition}
              </span>
              <span>{book.publication_year}</span>
              <span className="flex items-center gap-0.5 text-amber-400/90 font-semibold">
                ★ {book.rating}
              </span>
            </div>
          </div>
        </div>

        {/* Precise Shelf & Location Finder Banner */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 mb-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Floor {book.shelf_location.floor} • {book.shelf_location.wing}</span>
            </div>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-sky-950/50 text-sky-300 border border-sky-800/60">
              {book.shelf_location.shelf_code}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Hash className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">Call: {book.shelf_location.call_number}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
        <button
          onClick={() => onSelectBook(book)}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Shelf Map</span>
        </button>

        {isLibrarianMode ? (
          <button
            onClick={() => onQuickCheckout?.(book)}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Check-Out</span>
          </button>
        ) : (
          <button
            onClick={() => onReserveClick(book)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              isAvailable
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
            }`}
          >
            {isAvailable ? (
              <>
                <BookMarked className="w-3.5 h-3.5" />
                <span>Hold / Reserve</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Join Waitlist</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};
