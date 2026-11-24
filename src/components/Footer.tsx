import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          <span className="font-display font-semibold text-slate-900 dark:text-slate-100">
            Benchwork
          </span>{' '}
          · Open calculation and simulation desk for engineering students
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-5">
          <a href="#sandboxes" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Sandboxes
          </a>
          <a href="#real-life" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Real-Life
          </a>
          <a href="#formulas" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Formulas
          </a>
          <a href="#converter" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Converter
          </a>
          <a href="#study-log" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Study Log
          </a>
        </nav>
      </div>
    </footer>
  );
};
