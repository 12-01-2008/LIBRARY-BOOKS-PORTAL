import React from 'react';
import { Link } from 'react-router-dom';
import { BookX, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <BookX className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold font-serif-academic text-[var(--color-text-main)]">
          Page Not In The Stacks
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
          The shelf or section you are looking for might have been moved or doesn't exist in our catalog.
        </p>
        <div className="pt-2">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-light)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
