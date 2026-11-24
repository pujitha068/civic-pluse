import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowUpRight, Check, Copy, Layers, Search } from 'lucide-react';
import {
  ENGINEERING_FORMULAS,
  ENGINEERING_MATERIALS,
  FormulaDiscipline,
  SandboxId,
  UNIT_CATEGORIES,
} from '../data/engineeringData';

interface FormulaAndConverterDeskProps {
  onOpenSandbox: (id: SandboxId) => void;
}

const DISCIPLINES: ('All' | FormulaDiscipline)[] = [
  'All',
  'Statics & Solids',
  'Circuits & Signals',
  'Fluids & Thermo',
  'Dynamics & Control',
];

function formatPrecision(num: number): string {
  if (!Number.isFinite(num)) return '—';
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e6 || abs < 1e-3) {
    return num.toExponential(4);
  }
  return Number(num.toPrecision(6)).toString();
}

export const FormulaAndConverterDesk: React.FC<FormulaAndConverterDeskProps> = ({
  onOpenSandbox,
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<'All' | FormulaDiscipline>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [materialsImgFailed, setMaterialsImgFailed] = useState<boolean>(false);

  // Unit Converter state
  const [categoryId, setCategoryId] = useState<string>('stress');
  const [fromUnitId, setFromUnitId] = useState<string>('mpa');
  const [toUnitId, setToUnitId] = useState<string>('psi');
  const [inputValue, setInputValue] = useState<string>('250');

  const activeCategory = useMemo(
    () => UNIT_CATEGORIES.find((c) => c.id === categoryId) ?? UNIT_CATEGORIES[0],
    [categoryId]
  );

  const fromUnit = useMemo(
    () => activeCategory.units.find((u) => u.id === fromUnitId) ?? activeCategory.units[0],
    [activeCategory, fromUnitId]
  );

  const toUnit = useMemo(
    () => activeCategory.units.find((u) => u.id === toUnitId) ?? activeCategory.units[1] ?? activeCategory.units[0],
    [activeCategory, toUnitId]
  );

  const handleCategoryChange = (nextCatId: string) => {
    setCategoryId(nextCatId);
    const cat = UNIT_CATEGORIES.find((c) => c.id === nextCatId);
    if (cat && cat.units.length >= 2) {
      setFromUnitId(cat.units[0].id);
      setToUnitId(cat.units[1].id);
    }
  };

  const handleSwapUnits = () => {
    setFromUnitId(toUnit.id);
    setToUnitId(fromUnit.id);
  };

  const numericInput = Number(inputValue);
  const isValidInput = inputValue.trim() !== '' && Number.isFinite(numericInput);
  const baseValue = isValidInput ? fromUnit.toBase(numericInput) : NaN;
  const convertedValue = isValidInput ? toUnit.fromBase(baseValue) : NaN;

  const filteredFormulas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ENGINEERING_FORMULAS.filter((f) => {
      const matchesDiscipline = selectedDiscipline === 'All' || f.discipline === selectedDiscipline;
      const matchesSearch =
        q === '' ||
        f.title.toLowerCase().includes(q) ||
        f.courseTag.toLowerCase().includes(q) ||
        f.expression.toLowerCase().includes(q) ||
        f.variables.toLowerCase().includes(q);
      return matchesDiscipline && matchesSearch;
    });
  }, [selectedDiscipline, searchQuery]);

  const handleCopyFormula = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard fallback not critical
    }
  };

  return (
    <>
      {/* Formula Reference & Materials Section */}
      <section id="formulas" className="py-12 lg:py-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Core Engineering Formula Compendium
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Verified equations organized by undergraduate core coursework, complete with SI unit
                keys and direct links to matching interactive labs.
              </p>
            </div>

            <div className="relative w-full lg:w-72">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulas or courses..."
                aria-label="Search engineering formulas"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          {/* Discipline Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-8">
            {DISCIPLINES.map((disc) => (
              <button
                key={disc}
                type="button"
                onClick={() => setSelectedDiscipline(disc)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedDiscipline === disc
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>

          {filteredFormulas.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                No matching formulas found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try clearing your search filter or switching disciplines.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFormulas.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="truncate">{item.courseTag}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyFormula(item.id, item.expression)}
                        aria-label={`Copy ${item.title} formula`}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>

                    <div className="mt-3 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm font-medium text-sky-700 dark:text-sky-300 overflow-x-auto whitespace-nowrap">
                      {item.expression}
                    </div>

                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.variables}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.context}
                    </p>
                  </div>

                  {item.relatedSandbox && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenSandbox(item.relatedSandbox!);
                          document.getElementById('sandboxes')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Test in Interactive Lab
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Structural Materials & Hardware Visual Reference */}
          <div className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 flex">
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                {!materialsImgFailed ? (
                  <img
                    src="/src/assets/images/materials_cross_section_1795494790925.jpg"
                    alt="Technical reference illustration showing structural steel I-beam, planetary gear, and PCB trace cross-sections"
                    referrerPolicy="no-referrer"
                    onError={() => setMaterialsImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center p-6 text-center">
                    <Layers className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-2" aria-hidden="true" />
                    <p className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Structural & Mechanical Reference
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Standard Engineering Material Constants
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Reference mechanical properties used across Mechanics of Materials problem sets and
                  the Structural Beam Lab above.
                </p>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Material</th>
                      <th className="py-3 px-4 text-right">Modulus E</th>
                      <th className="py-3 px-4 text-right">Yield σ_y</th>
                      <th className="py-3 px-4 text-right">Density ρ</th>
                      <th className="py-3 px-4 text-right">Poisson ν</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {ENGINEERING_MATERIALS.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{mat.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{mat.spec}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                          {mat.youngsModulusGPa} GPa
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                          {mat.yieldStrengthMPa} MPa
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                          {mat.densityKgM3} kg/m³
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                          {mat.poissonsRatio.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precision SI / Imperial Unit Converter */}
      <section id="converter" className="py-12 lg:py-16 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Engineering Unit Converter
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Instant SI-to-Imperial conversions with scientific notation support and a full
              unit-equivalence table.
            </p>
          </div>

          {/* Category segmented tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit mb-6">
            {UNIT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryId === cat.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Converter Input Panel */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div>
                <label
                  htmlFor="conv-value"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Input Magnitude
                </label>
                <input
                  id="conv-value"
                  type="number"
                  step="any"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 font-mono text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-end">
                <div>
                  <label
                    htmlFor="conv-from"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    From Unit
                  </label>
                  <select
                    id="conv-from"
                    value={fromUnit.id}
                    onChange={(e) => setFromUnitId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {activeCategory.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSwapUnits}
                  aria-label="Swap source and target units"
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer justify-self-center"
                >
                  <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <div>
                  <label
                    htmlFor="conv-to"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    To Unit
                  </label>
                  <select
                    id="conv-to"
                    value={toUnit.id}
                    onChange={(e) => setToUnitId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {activeCategory.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Converted Result</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-sky-700 dark:text-sky-400">
                  {formatPrecision(convertedValue)} {toUnit.symbol}
                </p>
              </div>
            </div>

            {/* Equivalent Values Matrix */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  All {activeCategory.name} Equivalents
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {isValidInput ? `${inputValue} ${fromUnit.symbol}` : 'Enter a number'}
                </span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeCategory.units.map((u) => {
                  const val = isValidInput ? u.fromBase(baseValue) : NaN;
                  const isTarget = u.id === toUnit.id;
                  return (
                    <div
                      key={u.id}
                      className={`px-5 py-3 flex items-center justify-between gap-4 text-sm ${
                        isTarget ? 'bg-sky-50/60 dark:bg-sky-950/30' : ''
                      }`}
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {u.label}{' '}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          ({u.symbol})
                        </span>
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatPrecision(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
