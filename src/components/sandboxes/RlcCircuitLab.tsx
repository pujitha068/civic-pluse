import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, RotateCcw, Waves } from 'lucide-react';

type CircuitTopology = 'series' | 'parallel';

export const RlcCircuitLab: React.FC = () => {
  const [topology, setTopology] = useState<CircuitTopology>('series');
  const [resistanceOhm, setResistanceOhm] = useState<number>(25);
  const [inductanceMh, setInductanceMh] = useState<number>(100);
  const [capacitanceUf, setCapacitanceUf] = useState<number>(10);
  const [frequencyHz, setFrequencyHz] = useState<number>(160);
  const [voltageV, setVoltageV] = useState<number>(12);

  const handleReset = () => {
    setTopology('series');
    setResistanceOhm(25);
    setInductanceMh(100);
    setCapacitanceUf(10);
    setFrequencyHz(160);
    setVoltageV(12);
  };

  const analysis = useMemo(() => {
    const R = resistanceOhm;
    const L = inductanceMh * 1e-3;
    const C = capacitanceUf * 1e-6;
    const w = 2 * Math.PI * frequencyHz;

    const xl = w * L;
    const xc = 1 / (w * C);
    const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));

    let zMag = R;
    let phaseDeg = 0;
    let qFactor = 1;

    if (topology === 'series') {
      const reactNet = xl - xc;
      zMag = Math.sqrt(R * R + reactNet * reactNet);
      phaseDeg = (Math.atan2(reactNet, R) * 180) / Math.PI;
      qFactor = (1 / R) * Math.sqrt(L / C);
    } else {
      const bNet = w * C - 1 / (w * L);
      const yMag = Math.sqrt((1 / R) * (1 / R) + bNet * bNet);
      zMag = 1 / yMag;
      phaseDeg = (-Math.atan2(bNet, 1 / R) * 180) / Math.PI;
      qFactor = R * Math.sqrt(C / L);
    }

    const dampingRatio = 1 / (2 * qFactor);
    const currentA = voltageV / zMag;
    const bandwidthHz = f0 / qFactor;

    const regime: 'underdamped' | 'critical' | 'overdamped' =
      dampingRatio < 0.98 ? 'underdamped' : dampingRatio <= 1.02 ? 'critical' : 'overdamped';

    // Generate frequency response curve from 20 Hz to 500 Hz
    const fMin = 20;
    const fMax = 500;
    const sweepPoints: { f: number; currentMa: number }[] = [];
    let maxCurrentMa = 0;

    for (let i = 0; i <= 120; i++) {
      const f = fMin + (i / 120) * (fMax - fMin);
      const wi = 2 * Math.PI * f;
      const xli = wi * L;
      const xci = 1 / (wi * C);

      let zi = R;
      if (topology === 'series') {
        zi = Math.sqrt(R * R + (xli - xci) ** 2);
      } else {
        const bi = wi * C - 1 / (wi * L);
        zi = 1 / Math.sqrt((1 / R) ** 2 + bi * bi);
      }

      const currMa = (voltageV / zi) * 1000;
      if (currMa > maxCurrentMa) maxCurrentMa = currMa;
      sweepPoints.push({ f, currentMa: currMa });
    }

    return {
      xl,
      xc,
      f0,
      zMag,
      phaseDeg,
      qFactor,
      dampingRatio,
      currentA,
      bandwidthHz,
      regime,
      sweepPoints,
      maxCurrentMa,
      fMin,
      fMax,
    };
  }, [topology, resistanceOhm, inductanceMh, capacitanceUf, frequencyHz, voltageV]);

  // SVG frequency response plot geometry
  const plotLeft = 58;
  const plotRight = 640;
  const plotTop = 36;
  const plotBottom = 210;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const mapF = (f: number) =>
    plotLeft + ((f - analysis.fMin) / (analysis.fMax - analysis.fMin)) * plotW;
  const mapI = (ma: number) =>
    plotBottom - (analysis.maxCurrentMa > 0 ? (ma / (analysis.maxCurrentMa * 1.12)) * plotH : 0);

  const sweepPath = useMemo(() => {
    return analysis.sweepPoints
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${mapF(pt.f).toFixed(1)} ${mapI(pt.currentMa).toFixed(1)}`)
      .join(' ');
  }, [analysis]);

  const sweepAreaPath = `${sweepPath} L ${plotRight} ${plotBottom} L ${plotLeft} ${plotBottom} Z`;
  const activeFx = mapF(Math.min(analysis.fMax, Math.max(analysis.fMin, frequencyHz)));
  const activeIy = mapI(analysis.currentA * 1000);
  const f0InRange = analysis.f0 >= analysis.fMin && analysis.f0 <= analysis.fMax;
  const f0x = mapF(analysis.f0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive Canvas Stage */}
      <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              RLC Impedance & Resonance Frequency Sweep
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              X_L = {analysis.xl.toFixed(1)} Ω · X_C = {analysis.xc.toFixed(1)} Ω · Δf ={' '}
              {analysis.bandwidthHz.toFixed(1)} Hz
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setTopology('series')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                topology === 'series'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Series RLC
            </button>
            <button
              type="button"
              onClick={() => setTopology('parallel')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                topology === 'parallel'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Parallel RLC
            </button>
          </div>
        </div>

        {/* Circuit Diagram Strip */}
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
          <svg
            viewBox="0 0 680 124"
            className="w-full h-auto"
            role="img"
            aria-label={`${topology} RLC circuit schematic`}
          >
            {topology === 'series' ? (
              <g>
                {/* Loop wire */}
                <rect
                  x="70"
                  y="24"
                  width="540"
                  height="76"
                  rx="6"
                  fill="none"
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth="2"
                />
                {/* Source */}
                <circle
                  cx="70"
                  cy="62"
                  r="20"
                  className="fill-white dark:fill-slate-900 stroke-sky-600 dark:stroke-sky-400"
                  strokeWidth="2"
                />
                <text
                  x="70"
                  y="66"
                  textAnchor="middle"
                  className="fill-slate-900 dark:fill-slate-100 text-[11px] font-mono font-semibold"
                >
                  {voltageV}V
                </text>
                {/* Resistor */}
                <rect x="175" y="14" width="70" height="20" className="fill-white dark:fill-slate-900" />
                <polyline
                  points="175,24 185,15 197,33 209,15 221,33 233,15 245,24"
                  fill="none"
                  className="stroke-amber-600 dark:stroke-amber-400"
                  strokeWidth="2.2"
                />
                <text x="210" y="50" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-mono">
                  R = {resistanceOhm} Ω
                </text>
                {/* Inductor */}
                <rect x="330" y="12" width="84" height="22" className="fill-white dark:fill-slate-900" />
                <path
                  d="M 332 24 C 337 10, 349 10, 353 24 C 357 10, 369 10, 373 24 C 377 10, 389 10, 393 24 C 397 10, 409 10, 413 24"
                  fill="none"
                  className="stroke-sky-600 dark:stroke-sky-400"
                  strokeWidth="2.2"
                />
                <text x="372" y="50" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-mono">
                  L = {inductanceMh} mH
                </text>
                {/* Capacitor */}
                <rect x="498" y="12" width="24" height="24" className="fill-white dark:fill-slate-900" />
                <line x1="504" y1="12" x2="504" y2="36" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2.5" />
                <line x1="516" y1="12" x2="516" y2="36" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2.5" />
                <text x="510" y="50" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-mono">
                  C = {capacitanceUf} µF
                </text>
                {/* Current arrow */}
                <text x="340" y="92" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono">
                  Series Current |I| = {(analysis.currentA * 1000).toFixed(1)} mA @ {frequencyHz} Hz
                </text>
              </g>
            ) : (
              <g>
                {/* Parallel rails */}
                <line x1="80" y1="24" x2="580" y2="24" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                <line x1="80" y1="100" x2="580" y2="100" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                {/* Source branch */}
                <line x1="80" y1="24" x2="80" y2="100" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                <circle
                  cx="80"
                  cy="62"
                  r="18"
                  className="fill-white dark:fill-slate-900 stroke-sky-600 dark:stroke-sky-400"
                  strokeWidth="2"
                />
                <text x="80" y="66" textAnchor="middle" className="fill-slate-900 dark:fill-slate-100 text-[11px] font-mono font-semibold">
                  {voltageV}V
                </text>
                {/* R branch */}
                <line x1="240" y1="24" x2="240" y2="100" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                <rect x="230" y="42" width="20" height="40" className="fill-white dark:fill-slate-900" />
                <polyline
                  points="240,42 248,48 232,56 248,64 232,72 248,80 240,84"
                  fill="none"
                  className="stroke-amber-600 dark:stroke-amber-400"
                  strokeWidth="2.2"
                />
                <text x="262" y="66" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-mono">
                  {resistanceOhm} Ω
                </text>
                {/* L branch */}
                <line x1="400" y1="24" x2="400" y2="100" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                <rect x="390" y="40" width="20" height="44" className="fill-white dark:fill-slate-900" />
                <path
                  d="M 400 40 C 412 44, 412 52, 400 55 C 412 58, 412 66, 400 69 C 412 72, 412 80, 400 84"
                  fill="none"
                  className="stroke-sky-600 dark:stroke-sky-400"
                  strokeWidth="2.2"
                />
                <text x="418" y="66" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-mono">
                  {inductanceMh} mH
                </text>
                {/* C branch */}
                <line x1="540" y1="24" x2="540" y2="100" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" />
                <rect x="526" y="54" width="28" height="16" className="fill-white dark:fill-slate-900" />
                <line x1="528" y1="56" x2="552" y2="56" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2.5" />
                <line x1="528" y1="68" x2="552" y2="68" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2.5" />
                <text x="562" y="66" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-mono">
                  {capacitanceUf} µF
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Frequency Sweep Chart */}
        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox="0 0 680 250"
            className="w-full h-auto min-w-[540px]"
            role="img"
            aria-label="RLC current magnitude frequency response curve"
          >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((frac) => {
              const y = plotBottom - frac * plotH * 0.9;
              return (
                <line
                  key={frac}
                  x1={plotLeft}
                  y1={y}
                  x2={plotRight}
                  y2={y}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axes */}
            <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
            <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />

            {/* Resonant frequency reference line */}
            {f0InRange && (
              <g>
                <line
                  x1={f0x}
                  y1={plotTop}
                  x2={f0x}
                  y2={plotBottom}
                  className="stroke-emerald-600/60 dark:stroke-emerald-400/60"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={f0x}
                  y={plotTop - 10}
                  textAnchor="middle"
                  className="fill-emerald-700 dark:fill-emerald-400 text-[11px] font-mono font-semibold"
                >
                  f₀ = {analysis.f0.toFixed(1)} Hz
                </text>
              </g>
            )}

            {/* Area & Sweep curve */}
            <path d={sweepAreaPath} className="fill-sky-500/12 dark:fill-sky-400/12" />
            <path d={sweepPath} fill="none" className="stroke-sky-600 dark:stroke-sky-400" strokeWidth="2.5" />

            {/* Active operating frequency marker */}
            <line
              x1={activeFx}
              y1={plotTop}
              x2={activeFx}
              y2={plotBottom}
              className="stroke-slate-400 dark:stroke-slate-500"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <circle
              cx={activeFx}
              cy={activeIy}
              r="5.5"
              className="fill-sky-600 dark:fill-sky-400 stroke-white dark:stroke-slate-900"
              strokeWidth="2"
            />

            {/* Axis Labels */}
            <text x="16" y="128" transform="rotate(-90 16 128)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono">
              Source Current |I| [mA]
            </text>
            {[20, 100, 200, 300, 400, 500].map((tick) => (
              <text
                key={tick}
                x={mapF(tick)}
                y={plotBottom + 18}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
              >
                {tick} Hz
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Right Control & Concept Deck */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Circuit Response
            </span>
            {analysis.regime === 'underdamped' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
                <Waves className="w-4 h-4" aria-hidden="true" />
                Underdamped (ζ &lt; 1)
              </span>
            )}
            {analysis.regime === 'critical' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Critically Damped
              </span>
            )}
            {analysis.regime === 'overdamped' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Activity className="w-4 h-4" aria-hidden="true" />
                Overdamped (ζ &gt; 1)
              </span>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Resonant f₀</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {analysis.f0.toFixed(1)} <span className="text-xs font-normal">Hz</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Impedance |Z|</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {analysis.zMag.toFixed(1)} <span className="text-xs font-normal">Ω</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Phase Angle φ</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {analysis.phaseDeg >= 0 ? '+' : ''}
                {analysis.phaseDeg.toFixed(1)}°
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Quality Factor Q</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {analysis.qFactor.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Component Values
            </h4>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="rlc-freq" className="font-medium text-slate-700 dark:text-slate-300">
                Source Frequency f
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {frequencyHz} Hz
              </span>
            </div>
            <input
              id="rlc-freq"
              type="range"
              min={20}
              max={500}
              step={5}
              value={frequencyHz}
              onChange={(e) => setFrequencyHz(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="rlc-res" className="font-medium text-slate-700 dark:text-slate-300">
                Resistance R
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {resistanceOhm} Ω
              </span>
            </div>
            <input
              id="rlc-res"
              type="range"
              min={5}
              max={200}
              step={5}
              value={resistanceOhm}
              onChange={(e) => setResistanceOhm(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="rlc-ind" className="font-medium text-slate-700 dark:text-slate-300">
                Inductance L
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {inductanceMh} mH
              </span>
            </div>
            <input
              id="rlc-ind"
              type="range"
              min={10}
              max={300}
              step={5}
              value={inductanceMh}
              onChange={(e) => setInductanceMh(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="rlc-cap" className="font-medium text-slate-700 dark:text-slate-300">
                Capacitance C
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {capacitanceUf} µF
              </span>
            </div>
            <input
              id="rlc-cap"
              type="range"
              min={2}
              max={60}
              step={1}
              value={capacitanceUf}
              onChange={(e) => setCapacitanceUf(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="rlc-volt" className="font-medium text-slate-700 dark:text-slate-300">
                Source Amplitude V_s
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {voltageV} V
              </span>
            </div>
            <input
              id="rlc-volt"
              type="range"
              min={2}
              max={24}
              step={1}
              value={voltageV}
              onChange={(e) => setVoltageV(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
