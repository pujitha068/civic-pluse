import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { FormulaDiscipline, StudyLogItem } from '../data/engineeringData';

interface StudyLogSectionProps {
  focusTrigger: number;
  items: StudyLogItem[];
  onAddItem: (item: Omit<StudyLogItem, 'id' | 'completed'>) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

const DISCIPLINES: FormulaDiscipline[] = [
  'Statics & Solids',
  'Circuits & Signals',
  'Fluids & Thermo',
  'Dynamics & Control',
];

export const StudyLogSection: React.FC<StudyLogSectionProps> = ({
  focusTrigger,
  items,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [course, setCourse] = useState('');
  const [title, setTitle] = useState('');
  const [discipline, setDiscipline] = useState<FormulaDiscipline>('Statics & Solids');
  const [dueDate, setDueDate] = useState('2026-12-02');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const courseInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusTrigger > 0) {
      courseInputRef.current?.focus();
    }
  }, [focusTrigger]);

  const filteredItems = useMemo(() => {
    if (filter === 'active') return items.filter((i) => !i.completed);
    if (filter === 'completed') return items.filter((i) => i.completed);
    return items;
  }, [items, filter]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCourse = course.trim();
    const cleanTitle = title.trim();

    if (!cleanCourse || !cleanTitle) {
      setFormError('Enter both a course code and lab or problem set title.');
      return;
    }

    onAddItem({
      course: cleanCourse,
      title: cleanTitle,
      discipline,
      dueDate: dueDate || '2026-12-05',
      notes: notes.trim(),
    });

    setCourse('');
    setTitle('');
    setNotes('');
    setFormError('');
  };

  const activeCount = items.filter((i) => !i.completed).length;

  return (
    <section id="study-log" className="py-12 lg:py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Lab & Problem Set Study Log
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Track lab checkoffs, saved design audits, and homework deadlines locally in your
              browser.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {(['all', 'active', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab
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
          {/* Quick-Add Lab Note Form */}
          <form
            onSubmit={handleAddItem}
            className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-5 space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Add Lab or Problem Set
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="log-course"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Course
                </label>
                <input
                  ref={courseInputRef}
                  id="log-course"
                  type="text"
                  placeholder="e.g. ME 330"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label
                  htmlFor="log-due"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Due Date
                </label>
                <input
                  id="log-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="log-title"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Assignment Title
              </label>
              <input
                id="log-title"
                type="text"
                placeholder="e.g. Pipe Flow Venturi Calibration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label
                htmlFor="log-discipline"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Discipline
              </label>
              <select
                id="log-discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as FormulaDiscipline)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="log-notes"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Lab Notes / Target Values
              </label>
              <textarea
                id="log-notes"
                rows={3}
                placeholder="Key parameters, boundary conditions, or equipment notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-none"
              />
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{formError}</p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Save to Study Log
            </button>
          </form>

          {/* Study Log List */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {activeCount} active {activeCount === 1 ? 'task' : 'tasks'} · {items.length} total
              </span>
              <span>Saved automatically in browser storage</span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  No items in this view
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add a lab report or problem set using the form on the left.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <li
                    key={item.id}
                    className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleItem(item.id)}
                        aria-label={
                          item.completed ? `Mark ${item.title} active` : `Mark ${item.title} complete`
                        }
                        className="mt-0.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors shrink-0 cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {item.course}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.discipline}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">Due {item.dueDate}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              item.completed
                                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                                : 'text-amber-700 dark:text-amber-400 font-medium'
                            }
                          >
                            {item.completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>

                        <h4
                          className={`mt-1 font-display text-base font-semibold ${
                            item.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {item.title}
                        </h4>

                        {item.notes && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
