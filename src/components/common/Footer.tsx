import React from 'react';
import { BookOpen, MapPin, Clock, Mail, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-amber-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-[var(--color-text-main)] font-serif-academic">
                BiblioSphere
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              At your college library, knowledge is always within reach. Real-time catalog availability, shelf navigation, and student hold notifications.
            </p>
          </div>

          {/* Library Hours */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] flex items-center gap-1.5 font-serif-academic">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Building Hours
            </h4>
            <div className="text-xs text-[var(--color-text-muted)] space-y-1">
              <p><strong className="text-[var(--color-text-main)]">Mon – Thu:</strong> 7:30 AM – Midnight</p>
              <p><strong className="text-[var(--color-text-main)]">Friday:</strong> 7:30 AM – 9:00 PM</p>
              <p><strong className="text-[var(--color-text-main)]">Weekends:</strong> 10:00 AM – 10:00 PM</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                * 24/7 Quiet Study Wing open with Student ID
              </p>
            </div>
          </div>

          {/* Floor & Stacks Guide */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] flex items-center gap-1.5 font-serif-academic">
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> Stacks Directory
            </h4>
            <div className="text-xs text-[var(--color-text-muted)] space-y-1">
              <p><span className="font-semibold text-[var(--color-text-main)]">Floor 1:</span> Mathematics, Arts & Circulation Desk</p>
              <p><span className="font-semibold text-[var(--color-text-main)]">Floor 2:</span> Computer Science, AI & Engineering</p>
              <p><span className="font-semibold text-[var(--color-text-main)]">Floor 3:</span> Bio-Sciences, Medicine & Archives</p>
            </div>
          </div>

          {/* Support & Staff */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] flex items-center gap-1.5 font-serif-academic">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> Reference Desk
            </h4>
            <p className="text-xs text-[var(--color-text-muted)]">
              Need help finding research papers or course reserves?
            </p>
            <p className="text-xs font-semibold text-[var(--color-text-main)]">
              library-reference@college.edu
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] pt-1">
              Call Circulation Desk: Ext. 4410
            </p>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
          <p>© 2026 Campus Library Information Services. All rights reserved.</p>
          <p className="text-[11px]">Designed with warmth, accessibility, and high performance for students.</p>
        </div>
      </div>
    </footer>
  );
};
