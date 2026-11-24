import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
import { ENGINEERING_MATERIALS } from '../../data/engineeringData';

type SupportType = 'cantilever' | 'simply-supported';

export const BeamDeflectionLab: React.FC = () => {
  const [supportType, setSupportType] = useState<SupportType>('cantilever');
  const [materialId, setMaterialId] = useState<string>('steel-a992');
  const [loadKN, setLoadKN] = useState<number>(18);
  const [beamLengthM, setBeamLengthM] = useState<number>(4.0);
  const [loadPosRatio, setLoadPosRatio] = useState<number>(0.75);
  const [inertiaE6mm4, setInertiaE6mm4] = useState<number>(28);

  const material = useMemo(
    () => ENGINEERING_MATERIALS.find((m) => m.id === materialId) ?? ENGINEERING_MATERIALS[0],
    [materialId]
  );

  const handleReset = () => {
    setSupportType('cantilever');
    setMaterialId('steel-a992');
    setLoadKN(18);
    setBeamLengthM(4.0);
    setLoadPosRatio(0.75);
    setInertiaE6mm4(28);
  };

  const simulation = useMemo(() => {
    const P = loadKN * 1000; // N
    const L = beamLengthM; // m
    const a = loadPosRatio * L; // m
    const b = L - a; // m
    const E = material.youngsModulusGPa * 1e9; // Pa
    const I = inertiaE6mm4 * 1e-6; // m^4
    const c = 0.1; // 100 mm standard half-depth for stress calculation

    const samples = 100;
    const points: { x: number; shearKN: number; momentKNm: number; deflectionMm: number }[] = [];

    let maxDeflectionMm = 0;
    let maxMomentAbsKNm = 0;
    let maxShearAbsKN = 0;

    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * L;
      let shearN = 0;
      let momentNm = 0;
      let deflectionM = 0;

      if (supportType === 'cantilever') {
        if (x <= a) {
          shearN = P;
          momentNm = -P * (a - x);
          deflectionM = (P * x * x * (3 * a - x)) / (6 * E * I);
        } else {
          shearN = 0;
          momentNm = 0;
          deflectionM = (P * a * a * (3 * x - a)) / (6 * E * I);
        }
      } else {
        const ra = (P * b) / L;
        const rb = (P * a) / L;
        if (x <= a) {
          shearN = ra;
          momentNm = ra * x;
          deflectionM = (P * b * x * (L * L - b * b - x * x)) / (6 * E * I * L);
        } else {
          shearN = -rb;
          momentNm = rb * (L - x);
          const xr = L - x;
          deflectionM = (P * a * xr * (L * L - a * a - xr * xr)) / (6 * E * I * L);
        }
      }

      const shearKN = shearN / 1000;
      const momentKNm = momentNm / 1000;
      const deflectionMm = deflectionM * 1000;

      if (Math.abs(deflectionMm) > maxDeflectionMm) maxDeflectionMm = Math.abs(deflectionMm);
      if (Math.abs(momentKNm) > maxMomentAbsKNm) maxMomentAbsKNm = Math.abs(momentKNm);
      if (Math.abs(shearKN) > maxShearAbsKN) maxShearAbsKN = Math.abs(shearKN);

      points.push({ x, shearKN, momentKNm, deflectionMm });
    }

    const maxStressMPa = ((maxMomentAbsKNm * 1000 * c) / I) / 1e6;
    const safetyFactor = maxStressMPa > 0 ? material.yieldStrengthMPa / maxStressMPa : 999;

    const status: 'nominal' | 'caution' | 'exceeded' =
      safetyFactor >= 2.0 ? 'nominal' : safetyFactor >= 1.0 ? 'caution' : 'exceeded';

    return {
      a,
      L,
      points,
      maxDeflectionMm,
      maxMomentAbsKNm,
      maxShearAbsKN,
      maxStressMPa,
      safetyFactor,
      status,
    };
  }, [supportType, material, loadKN, beamLengthM, loadPosRatio, inertiaE6mm4]);

  // SVG Coordinate helpers
  const svgW = 680;
  const xStart = 64;
  const xEnd = 636;
  const spanPx = xEnd - xStart;
  const mapX = (x: number) => xStart + (x / simulation.L) * spanPx;

  // Deflection curve scaling (clamp visual sag between 6px and 48px for clear visual feedback)
  const beamY = 74;
  const visualMaxSag = Math.min(48, Math.max(8, simulation.maxDeflectionMm * 1.4));
  const beamPath = useMemo(() => {
    const scale = simulation.maxDeflectionMm > 0 ? visualMaxSag / simulation.maxDeflectionMm : 0;
    return simulation.points
      .map((pt, idx) => {
        const px = mapX(pt.x).toFixed(1);
        const py = (beamY + pt.deflectionMm * scale).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');
  }, [simulation, visualMaxSag]);

  // Shear diagram path
  const shearZeroY = 205;
  const shearScale = simulation.maxShearAbsKN > 0 ? 36 / simulation.maxShearAbsKN : 0;
  const shearLinePath = useMemo(() => {
    return simulation.points
      .map((pt, idx) => {
        const px = mapX(pt.x).toFixed(1);
        const py = (shearZeroY - pt.shearKN * shearScale).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');
  }, [simulation, shearScale]);

  const shearAreaPath = `${shearLinePath} L ${xEnd} ${shearZeroY} L ${xStart} ${shearZeroY} Z`;

  // Moment diagram path
  const momentZeroY = 320;
  const momentScale = simulation.maxMomentAbsKNm > 0 ? 40 / simulation.maxMomentAbsKNm : 0;
  const momentLinePath = useMemo(() => {
    return simulation.points
      .map((pt, idx) => {
        const px = mapX(pt.x).toFixed(1);
        const py = (momentZeroY - pt.momentKNm * momentScale).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');
  }, [simulation, momentScale]);

  const momentAreaPath = `${momentLinePath} L ${xEnd} ${momentZeroY} L ${xStart} ${momentZeroY} Z`;

  const loadPx = mapX(simulation.a);
  const loadDeflectionAtA =
    simulation.points[Math.round(loadPosRatio * (simulation.points.length - 1))]?.deflectionMm ?? 0;
  const loadBeamY =
    beamY + (simulation.maxDeflectionMm > 0 ? (loadDeflectionAtA / simulation.maxDeflectionMm) * visualMaxSag : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Interactive Canvas Stage (65% -> 8 cols) */}
      <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Euler-Bernoulli Beam Deflection & Internal Diagrams
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {material.name} ({material.spec}) · E = {material.youngsModulusGPa} GPa · σ_y ={' '}
              {material.yieldStrengthMPa} MPa
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setSupportType('cantilever')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                supportType === 'cantilever'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cantilever
            </button>
            <button
              type="button"
              onClick={() => setSupportType('simply-supported')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                supportType === 'simply-supported'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Simply Supported
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} 388`}
            className="w-full h-auto min-w-[540px]"
            role="img"
            aria-label="Beam deflection curve, shear force diagram, and bending moment diagram"
          >
            {/* Subtle drafting grid */}
            <defs>
              <pattern id="beam-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  className="stroke-slate-100 dark:stroke-slate-800/70"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect x="0" y="0" width={svgW} height="388" rx="8" fill="url(#beam-grid)" />

            {/* Section labels */}
            <text x="16" y="34" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono">
              Deflection δ(x)
            </text>
            <text x="16" y="162" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono">
              Shear V(x) [kN]
            </text>
            <text x="16" y="276" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono">
              Moment M(x) [kN·m]
            </text>

            {/* Unloaded neutral beam reference line */}
            <line
              x1={xStart}
              y1={beamY}
              x2={xEnd}
              y2={beamY}
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />

            {/* Support symbols */}
            {supportType === 'cantilever' ? (
              <g>
                <rect
                  x={xStart - 12}
                  y={beamY - 26}
                  width="12"
                  height="52"
                  className="fill-slate-300 dark:fill-slate-700 stroke-slate-500 dark:stroke-slate-500"
                  strokeWidth="1.5"
                />
                <line x1={xStart - 12} y1={beamY - 20} x2={xStart - 2} y2={beamY - 12} className="stroke-slate-500" strokeWidth="1.2" />
                <line x1={xStart - 12} y1={beamY - 6} x2={xStart - 2} y2={beamY + 2} className="stroke-slate-500" strokeWidth="1.2" />
                <line x1={xStart - 12} y1={beamY + 8} x2={xStart - 2} y2={beamY + 16} className="stroke-slate-500" strokeWidth="1.2" />
              </g>
            ) : (
              <g>
                {/* Left pin support */}
                <polygon
                  points={`${xStart},${beamY + 2} ${xStart - 10},${beamY + 20} ${xStart + 10},${beamY + 20}`}
                  className="fill-slate-300 dark:fill-slate-700 stroke-slate-600 dark:stroke-slate-400"
                  strokeWidth="1.5"
                />
                {/* Right roller support */}
                <polygon
                  points={`${xEnd},${beamY + 2} ${xEnd - 10},${beamY + 17} ${xEnd + 10},${beamY + 17}`}
                  className="fill-slate-300 dark:fill-slate-700 stroke-slate-600 dark:stroke-slate-400"
                  strokeWidth="1.5"
                />
                <circle cx={xEnd - 5} cy={beamY + 21} r="3" className="fill-slate-500 dark:fill-slate-400" />
                <circle cx={xEnd + 5} cy={beamY + 21} r="3" className="fill-slate-500 dark:fill-slate-400" />
              </g>
            )}

            {/* Deflected beam curve */}
            <path
              d={beamPath}
              fill="none"
              className="stroke-sky-600 dark:stroke-sky-400"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Point Load Vector */}
            <g>
              <line
                x1={loadPx}
                y1={loadBeamY - 46}
                x2={loadPx}
                y2={loadBeamY - 6}
                className="stroke-rose-600 dark:stroke-rose-400"
                strokeWidth="2.5"
              />
              <polygon
                points={`${loadPx},${loadBeamY - 2} ${loadPx - 6},${loadBeamY - 12} ${loadPx + 6},${loadBeamY - 12}`}
                className="fill-rose-600 dark:fill-rose-400"
              />
              <text
                x={loadPx}
                y={loadBeamY - 52}
                textAnchor="middle"
                className="fill-rose-700 dark:fill-rose-300 text-[12px] font-mono font-semibold"
              >
                P = {loadKN} kN @ {simulation.a.toFixed(2)} m
              </text>
            </g>

            {/* Shear Zero Axis & Diagram */}
            <line
              x1={xStart}
              y1={shearZeroY}
              x2={xEnd}
              y2={shearZeroY}
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1"
            />
            <path d={shearAreaPath} className="fill-sky-500/15 dark:fill-sky-400/15" />
            <path
              d={shearLinePath}
              fill="none"
              className="stroke-sky-600 dark:stroke-sky-400"
              strokeWidth="2"
            />

            {/* Moment Zero Axis & Diagram */}
            <line
              x1={xStart}
              y1={momentZeroY}
              x2={xEnd}
              y2={momentZeroY}
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1"
            />
            <path d={momentAreaPath} className="fill-amber-500/15 dark:fill-amber-400/15" />
            <path
              d={momentLinePath}
              fill="none"
              className="stroke-amber-600 dark:stroke-amber-400"
              strokeWidth="2"
            />

            {/* Vertical load position reference line */}
            <line
              x1={loadPx}
              y1={beamY + 6}
              x2={loadPx}
              y2={365}
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Span ruler */}
            <line
              x1={xStart}
              y1={370}
              x2={xEnd}
              y2={370}
              className="stroke-slate-400 dark:stroke-slate-600"
              strokeWidth="1"
            />
            <text
              x={(xStart + xEnd) / 2}
              y={383}
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
            >
              Span L = {beamLengthM.toFixed(1)} m (c = 100 mm)
            </text>
          </svg>
        </div>
      </div>

      {/* Right Control & Concept Deck (35% -> 4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Live Readout Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Structural State
            </span>
            {simulation.status === 'nominal' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Nominal (SF ≥ 2.0)
              </span>
            )}
            {simulation.status === 'caution' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Yield Caution
              </span>
            )}
            {simulation.status === 'exceeded' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                Exceeds Yield
              </span>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Max Deflection</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {simulation.maxDeflectionMm.toFixed(2)} <span className="text-xs font-normal">mm</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Peak Moment</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {simulation.maxMomentAbsKNm.toFixed(1)} <span className="text-xs font-normal">kN·m</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Bending Stress</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {simulation.maxStressMPa.toFixed(1)} <span className="text-xs font-normal">MPa</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Safety Factor</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {simulation.safetyFactor > 99 ? '99+' : simulation.safetyFactor.toFixed(2)}×
              </dd>
            </div>
          </dl>
        </div>

        {/* Parameter Controls */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Parameters & Material
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
            <label
              htmlFor="beam-material"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Beam Material
            </label>
            <select
              id="beam-material"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {ENGINEERING_MATERIALS.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} ({mat.youngsModulusGPa} GPa)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="beam-load" className="font-medium text-slate-700 dark:text-slate-300">
                Point Load P
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {loadKN} kN
              </span>
            </div>
            <input
              id="beam-load"
              type="range"
              min={2}
              max={60}
              step={1}
              value={loadKN}
              onChange={(e) => setLoadKN(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="beam-pos" className="font-medium text-slate-700 dark:text-slate-300">
                Load Position (a / L)
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {Math.round(loadPosRatio * 100)}% ({simulation.a.toFixed(2)} m)
              </span>
            </div>
            <input
              id="beam-pos"
              type="range"
              min={0.15}
              max={1.0}
              step={0.05}
              value={loadPosRatio}
              onChange={(e) => setLoadPosRatio(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="beam-span" className="font-medium text-slate-700 dark:text-slate-300">
                Span Length L
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {beamLengthM.toFixed(1)} m
              </span>
            </div>
            <input
              id="beam-span"
              type="range"
              min={1.5}
              max={8.0}
              step={0.5}
              value={beamLengthM}
              onChange={(e) => setBeamLengthM(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="beam-inertia" className="font-medium text-slate-700 dark:text-slate-300">
                Moment of Inertia I
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {inertiaE6mm4} × 10⁶ mm⁴
              </span>
            </div>
            <input
              id="beam-inertia"
              type="range"
              min={8}
              max={90}
              step={2}
              value={inertiaE6mm4}
              onChange={(e) => setInertiaE6mm4(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <p className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Deflection scales with <span className="font-mono">L³ / (E·I)</span>. Doubling span
            length increases tip deflection 8× under the same load.
          </p>
        </div>
      </div>
    </div>
  );
};
