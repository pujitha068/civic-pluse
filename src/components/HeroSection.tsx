import React, { useState } from 'react';
import { ArrowRight, Compass, Cpu, Gauge, Ruler } from 'lucide-react';
import { SandboxId } from '../data/engineeringData';

interface HeroSectionProps {
  onSelectSandbox: (id: SandboxId) => void;
}

const SANDBOX_SHORTCUTS: {
  id: SandboxId;
  title: string;
  discipline: string;
  metric: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'beam',
    title: 'Structural Beam Lab',
    discipline: 'Statics & Materials',
    metric: 'Shear · Moment · Deflection',
    icon: Ruler,
  },
  {
    id: 'rlc',
    title: 'RLC Frequency Analyzer',
    discipline: 'Circuits & Signals',
    metric: 'Impedance · Phase · Resonance',
    icon: Cpu,
  },
  {
    id: 'projectile',
    title: 'Aerodynamic Trajectory',
    discipline: 'Flight & Dynamics',
    metric: 'Quadratic Drag · Apogee · Range',
    icon: Compass,
  },
  {
    id: 'pid',
    title: 'PID Loop Tuner',
    discipline: 'Feedback Controls',
    metric: 'Overshoot · Rise · Settling',
    icon: Gauge,
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectSandbox }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section id="top" className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-1">
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 mb-4">
                Statics · Circuits · Dynamics · Controls
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 text-3xl sm:text-4xl lg:text-[42px] leading-[1.12] max-w-xl"
                style={{ textWrap: 'balance' }}
              >
                Interactive engineering labs, formulas, and study tools in one workbench.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Test structural beam loads, sweep RLC resonance curves, compare aerodynamic drag
                trajectories, tune PID controllers, and keep your lab deadlines organized without
                juggling scattered spreadsheets.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#sandboxes"
                onClick={() => onSelectSandbox('beam')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                Open Interactive Labs
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="#real-life"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                Solve Real-Life Cases
              </a>
              <a
                href="#formulas"
                className="inline-flex items-center gap-1 px-2 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                Formula Sheet
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative min-h-[260px] lg:min-h-[340px]">
              {!imageFailed ? (
                <img
                  src="/src/assets/images/hero_engineering_workbench_1795494791143.jpg"
                  alt="Engineering lab bench with aluminum test beam fixture, brass calipers, and copper inductor coil"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <Ruler className="w-10 h-10 text-sky-600 dark:text-sky-400 mb-3" aria-hidden="true" />
                  <p className="font-display font-semibold text-slate-900 dark:text-slate-100">
                    Benchwork Laboratory Apparatus
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Interactive mechanics, circuits, dynamics, and control models
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SANDBOX_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSandbox(item.id);
                  document.getElementById('sandboxes')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.discipline}
                  </span>
                  <Icon
                    className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                  {item.title}
                </p>
                <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                  {item.metric}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
