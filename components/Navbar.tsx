'use client';

import React from 'react';

interface NavbarProps {
  onOpenReportForm: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenReportForm }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
        >
          CivicPulse
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#console"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-slate-900 dark:hover:border-slate-100"
          >
            Live Consoles
          </a>
          <a
            href="#public-issues"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-slate-900 dark:hover:border-slate-100"
          >
            Public Issues
          </a>
          <a
            href="#standards"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-slate-900 dark:hover:border-slate-100"
          >
            Standards
          </a>
          <a
            href="#dispatch"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-slate-900 dark:hover:border-slate-100"
          >
            Civic Dispatch
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenReportForm}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            Report Issue
          </button>
        </div>
      </div>
    </header>
  );
};
