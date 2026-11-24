import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { FormulaAndConverterDesk } from './components/FormulaAndConverterDesk';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { RealLifeProblemsSection } from './components/RealLifeProblemsSection';
import { SandboxWorkspace } from './components/SandboxWorkspace';
import { StudyLogSection } from './components/StudyLogSection';
import { INITIAL_STUDY_LOG, SandboxId, StudyLogItem } from './data/engineeringData';

const STUDY_STORAGE_KEY = 'benchwork_study_log_v1';

export default function App() {
  const [activeSandbox, setActiveSandbox] = useState<SandboxId>('beam');
  const [studyFocusTrigger, setStudyFocusTrigger] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('benchwork_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [studyItems, setStudyItems] = useState<StudyLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STUDY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_STUDY_LOG;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('benchwork_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(studyItems));
    } catch {
      // Ignore storage errors
    }
  }, [studyItems]);

  const handleAddStudyItem = (item: Omit<StudyLogItem, 'id' | 'completed'>) => {
    const next: StudyLogItem = {
      ...item,
      id: `log-${Date.now()}`,
      completed: false,
    };
    setStudyItems((prev) => [next, ...prev]);
  };

  const handleToggleStudyItem = (id: string) => {
    setStudyItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleDeleteStudyItem = (id: string) => {
    setStudyItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleNewLabNote = () => {
    document.getElementById('study-log')?.scrollIntoView({ behavior: 'smooth' });
    setStudyFocusTrigger((n) => n + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-150">
      <Navbar onNewLabNote={handleNewLabNote} />

      <main className="flex-1">
        <HeroSection onSelectSandbox={setActiveSandbox} />

        <SandboxWorkspace
          activeSandbox={activeSandbox}
          onSelectSandbox={setActiveSandbox}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
        />

        <RealLifeProblemsSection onSaveToStudyLog={handleAddStudyItem} />

        <FormulaAndConverterDesk onOpenSandbox={setActiveSandbox} />

        <StudyLogSection
          focusTrigger={studyFocusTrigger}
          items={studyItems}
          onAddItem={handleAddStudyItem}
          onToggleItem={handleToggleStudyItem}
          onDeleteItem={handleDeleteStudyItem}
        />
      </main>

      <Footer />
    </div>
  );
}
