'use client';

import React, { useEffect, useState } from 'react';
import {
  CommunityReport,
  INITIAL_COMMUNITY_REPORTS,
  SocietalScenarioId,
} from '@/lib/realtimeModels';
import { CivicDispatchDesk } from './CivicDispatchDesk';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { Navbar } from './Navbar';
import { RealtimeConsole } from './RealtimeConsole';

const REPORTS_STORAGE_KEY = 'civicpulse_reports_v1';

export const CivicClientApp: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<SocietalScenarioId>('air');
  const [reportFocusTrigger, setReportFocusTrigger] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [reports, setReports] = useState<CommunityReport[]>(INITIAL_COMMUNITY_REPORTS);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('civicpulse_theme');
      if (savedTheme === 'dark') setIsDark(true);

      const savedReports = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (savedReports) {
        const parsed = JSON.parse(savedReports);
        if (Array.isArray(parsed)) setReports(parsed);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('civicpulse_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // Ignore storage errors
    }
  }, [reports]);

  const handleOpenReportForm = () => {
    document.getElementById('dispatch')?.scrollIntoView({ behavior: 'smooth' });
    setReportFocusTrigger((n) => n + 1);
  };

  const handleAddReport = (report: CommunityReport) => {
    setReports((prev) => [report, ...prev]);
  };

  const handleCycleStatus = (id: string) => {
    setReports((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus: CommunityReport['status'] =
          item.status === 'Open'
            ? 'Dispatched'
            : item.status === 'Dispatched'
            ? 'Resolved'
            : 'Open';
        return { ...item, status: nextStatus };
      })
    );
  };

  const handleDeleteReport = (id: string) => {
    setReports((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-150">
      <Navbar onOpenReportForm={handleOpenReportForm} />

      <main className="flex-1">
        <HeroSection onSelectScenario={setActiveScenario} />

        <RealtimeConsole
          activeScenario={activeScenario}
          onSelectScenario={setActiveScenario}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onLogVerifiedAction={handleAddReport}
        />

        <CivicDispatchDesk
          reports={reports}
          onAddReport={handleAddReport}
          onCycleStatus={handleCycleStatus}
          onDeleteReport={handleDeleteReport}
          onOpenScenario={setActiveScenario}
          focusTrigger={reportFocusTrigger}
        />
      </main>

      <Footer />
    </div>
  );
};
