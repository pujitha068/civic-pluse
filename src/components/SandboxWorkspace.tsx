import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { SandboxId } from '../data/engineeringData';
import { BeamDeflectionLab } from './sandboxes/BeamDeflectionLab';
import { PidControlLab } from './sandboxes/PidControlLab';
import { ProjectileDragLab } from './sandboxes/ProjectileDragLab';
import { RlcCircuitLab } from './sandboxes/RlcCircuitLab';

interface SandboxWorkspaceProps {
  activeSandbox: SandboxId;
  onSelectSandbox: (id: SandboxId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const SANDBOX_TABS: { id: SandboxId; label: string }[] = [
  { id: 'beam', label: '01. Beam & Bending' },
  { id: 'rlc', label: '02. RLC Resonance' },
  { id: 'projectile', label: '03. Aerodynamic Drag' },
  { id: 'pid', label: '04. PID Control Loop' },
];

export const SandboxWorkspace: React.FC<SandboxWorkspaceProps> = ({
  activeSandbox,
  onSelectSandbox,
  isDark,
  onToggleTheme,
}) => {
  return (
    <section id="sandboxes" className="py-12 lg:py-16 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Interactive Simulation Sandboxes
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Manipulate physical parameters directly and inspect live curves, internal diagrams,
              and stability limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light drafting theme' : 'Switch to dark slate theme'}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  Light Canvas
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  Dark Canvas
                </>
              )}
            </button>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div
          role="tablist"
          aria-label="Engineering sandboxes"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl mb-6"
        >
          {SANDBOX_TABS.map((tab) => {
            const isActive = activeSandbox === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onSelectSandbox(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          {activeSandbox === 'beam' && <BeamDeflectionLab />}
          {activeSandbox === 'rlc' && <RlcCircuitLab />}
          {activeSandbox === 'projectile' && <ProjectileDragLab />}
          {activeSandbox === 'pid' && <PidControlLab />}
        </div>
      </div>
    </section>
  );
};
