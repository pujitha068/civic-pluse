'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  CivicIssueCategory,
  CivicSeverity,
  CommunityReport,
  SOCIETAL_SCENARIOS,
  SocietalScenarioId,
} from '@/lib/realtimeModels';

interface CivicDispatchDeskProps {
  reports: CommunityReport[];
  onAddReport: (report: CommunityReport) => void;
  onCycleStatus: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onOpenScenario: (id: SocietalScenarioId) => void;
  focusTrigger: number;
}

const CATEGORIES: CivicIssueCategory[] = [
  'Air & Heat',
  'Water & Sanitation',
  'Emergency & Safety',
  'Power & Outage',
];

const SEVERITIES: CivicSeverity[] = ['Advisory', 'Urgent', 'Critical'];

const PUBLIC_STANDARDS: {
  id: SocietalScenarioId;
  standardTitle: string;
  agency: string;
  threshold: string;
  whyItMatters: string;
}[] = [
  {
    id: 'air',
    standardTitle: 'Particulate Matter & Urban Heat Thresholds',
    agency: 'WHO Air Quality Guidelines',
    threshold: 'PM2.5 ≤ 25 µg/m³ · Heat ≤ 32 °C',
    whyItMatters:
      'Fine particulates penetrate deep into lung alveoli while stagnant urban heat multiplies cardiovascular risk for seniors and outdoor workers.',
  },
  {
    id: 'water',
    standardTitle: 'Municipal Pressure & Non-Revenue Water',
    agency: 'Public Water Utility Standard',
    threshold: '260–340 kPa · Loss ≤ 8%',
    whyItMatters:
      'Maintaining positive distribution pressure prevents groundwater backflow contamination into drinking pipes while curbing treated water waste.',
  },
  {
    id: 'ems',
    standardTitle: 'Golden-Hour EMS Dispatch & ER Offload',
    agency: 'Emergency Medical Benchmarks',
    threshold: 'Response ≤ 8.0 min · ER < 85%',
    whyItMatters:
      'Pre-staging ambulances and balancing hospital bed loads prevents ambulance ramping delays during sudden multi-casualty or weather emergencies.',
  },
  {
    id: 'cleangrid',
    standardTitle: 'Zero-Blackout Evening Clean Dispatch',
    agency: 'Community Microgrid Standard',
    threshold: '59.90–60.10 Hz · Reserve ≥ 12%',
    whyItMatters:
      'Coordinating battery storage and smart demand-response during sunset peak hours protects hospitals, elevators, and refrigerated medicine without fossil peakers.',
  },
];

export const CivicDispatchDesk: React.FC<CivicDispatchDeskProps> = ({
  reports,
  onAddReport,
  onCycleStatus,
  onDeleteReport,
  onOpenScenario,
  focusTrigger,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Dispatched' | 'Resolved'>('All');
  const [zone, setZone] = useState('');
  const [category, setCategory] = useState<CivicIssueCategory>('Air & Heat');
  const [severity, setSeverity] = useState<CivicSeverity>('Urgent');
  const [title, setTitle] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const zoneInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (focusTrigger > 0) {
      zoneInputRef.current?.focus();
    }
  }, [focusTrigger]);

  const filteredReports = useMemo(() => {
    if (statusFilter === 'All') return reports;
    return reports.filter((r) => r.status === statusFilter);
  }, [reports, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (zone.trim().length < 2 || title.trim().length < 4) {
      setErrorMsg('Enter both a neighborhood zone and a short description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/community-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: zone.trim(),
          category,
          severity,
          title: title.trim(),
          actionNote: actionNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not submit issue report.');
        return;
      }
      onAddReport(data.report as CommunityReport);
      setZone('');
      setTitle('');
      setActionNote('');
    } catch {
      setErrorMsg('Network error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Public Standards Reference */}
      <section
        id="standards"
        className="py-12 lg:py-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Public Health & Infrastructure Safety Benchmarks
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Evidence-based civic safety limits used to evaluate live interventions in the consoles
              above.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PUBLIC_STANDARDS.map((item) => {
              const scenario = SOCIETAL_SCENARIOS.find((s) => s.id === item.id);
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.agency}</span>
                      <span className="font-mono text-sky-700 dark:text-sky-400 font-medium">
                        {item.threshold}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                      {item.standardTitle}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.whyItMatters}
                    </p>
                  </div>

                  {scenario && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[70%]">
                        {scenario.governingModel}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenScenario(item.id);
                          document.getElementById('console')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Simulate Fix
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Civic Issue Reporting & Dispatch Board */}
      <section id="dispatch" className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Live Community Issue & Civic Dispatch Board
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Report real-time neighborhood hazards, coordinate municipal dispatch status, and
                track resolved public safety interventions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit">
              {(['All', 'Open', 'Dispatched', 'Resolved'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Submit Field Report Form */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
            >
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Submit Real-Time Field Report
              </h3>

              <div>
                <label
                  htmlFor="rep-zone"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Neighborhood / District
                </label>
                <input
                  ref={zoneInputRef}
                  id="rep-zone"
                  type="text"
                  placeholder="e.g. District 3 · Oak St Clinic"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rep-cat"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Sector
                  </label>
                  <select
                    id="rep-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CivicIssueCategory)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rep-sev"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Severity
                  </label>
                  <select
                    id="rep-sev"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as CivicSeverity)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="rep-title"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Observed Issue
                </label>
                <input
                  id="rep-title"
                  type="text"
                  placeholder="e.g. Flooded storm drain blocking school crosswalk"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label
                  htmlFor="rep-action"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Recommended Mitigation
                </label>
                <textarea
                  id="rep-action"
                  rows={2}
                  placeholder="Optional routing, valve, or shelter action..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {submitting ? 'Logging Report...' : 'Post to Dispatch Board'}
              </button>
            </form>

            {/* Dispatch Feed */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} shown
                </span>
                <span>Click status to advance Open → Dispatched → Resolved</span>
              </div>

              {filteredReports.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    No reports in this status filter
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Submit a neighborhood issue on the left or switch to All reports.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredReports.map((rep) => (
                    <li
                      key={rep.id}
                      className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {rep.zone}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{rep.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{rep.reportedAt}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              rep.severity === 'Critical'
                                ? 'text-rose-700 dark:text-rose-400'
                                : rep.severity === 'Urgent'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-sky-700 dark:text-sky-400'
                            }`}
                          >
                            {rep.severity === 'Critical' && (
                              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            {rep.severity === 'Urgent' && (
                              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            {rep.severity}
                          </span>
                        </div>

                        <h4 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                          {rep.title}
                        </h4>

                        {rep.actionNote && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {rep.actionNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onCycleStatus(rep.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                            rep.status === 'Resolved'
                              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                              : rep.status === 'Dispatched'
                              ? 'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {rep.status === 'Resolved' && (
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          {rep.status}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteReport(rep.id)}
                          aria-label={`Remove report ${rep.title}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
