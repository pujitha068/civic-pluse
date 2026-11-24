'use client';

import React, { useState } from 'react';
import { Activity, Ambulance, ArrowRight, Droplets, Wind, Zap } from 'lucide-react';
import { SOCIETAL_SCENARIOS, SocietalScenarioId } from '@/lib/realtimeModels';

interface HeroSectionProps {
  onSelectScenario: (id: SocietalScenarioId) => void;
}

const SCENARIO_ICONS: Record<SocietalScenarioId, React.FC<{ className?: string }>> = {
  air: Wind,
  water: Droplets,
  ems: Ambulance,
  cleangrid: Zap,
};

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectScenario }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      id="top"
      className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-1">
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 mb-4">
                Clean Air · Water Security · Emergency Access · Clean Energy
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 text-3xl sm:text-4xl lg:text-[42px] leading-[1.12] max-w-xl"
                style={{ textWrap: 'balance' }}
              >
                Solve real-time urban, health, and climate challenges live.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Monitor live community infrastructure telemetry, simulate sudden crises—from main
                water leaks to heatwave grid peaks—and coordinate real-time civic interventions that
                protect neighborhoods.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#console"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                Open Live Console
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="#dispatch"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                Civic Dispatch Board
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative min-h-[260px] lg:min-h-[340px]">
              {!imgFailed ? (
                <img
                  src="/images/hero_civic_operations.jpg"
                  alt="Sustainable city neighborhood with rooftop solar, urban tree canopy, electric transit buses, air quality sensor, and clean water station"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <Activity className="w-10 h-10 text-sky-600 dark:text-sky-400 mb-3" aria-hidden="true" />
                  <p className="font-display font-semibold text-slate-900 dark:text-slate-100">
                    CivicPulse Public Operations
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Real-time community infrastructure and environmental monitoring
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          id="public-issues"
          className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {SOCIETAL_SCENARIOS.map((item) => {
            const Icon = SCENARIO_ICONS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectScenario(item.id);
                  document.getElementById('console')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.sector}
                  </span>
                  <Icon
                    className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                  {item.indexLabel.replace(/^\d+\.\s*/, '')}
                </p>
                <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                  {item.targetSummary}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
