import React, { useEffect, useMemo, useState } from 'react';
import { Compass, Pause, Play, RotateCcw, StepForward } from 'lucide-react';

interface EnvironmentPreset {
  id: string;
  label: string;
  gravity: number;
  airDensity: number;
}

const ENVIRONMENTS: EnvironmentPreset[] = [
  { id: 'earth', label: 'Earth Sea Level (ρ = 1.225 kg/m³)', gravity: 9.81, airDensity: 1.225 },
  { id: 'alpine', label: 'High Altitude 5 km (ρ = 0.736 kg/m³)', gravity: 9.81, airDensity: 0.736 },
  { id: 'mars', label: 'Mars Surface (g = 3.72 m/s²)', gravity: 3.72, airDensity: 0.02 },
];

interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const ProjectileDragLab: React.FC = () => {
  const [envId, setEnvId] = useState<string>('earth');
  const [velocity, setVelocity] = useState<number>(48);
  const [angleDeg, setAngleDeg] = useState<number>(45);
  const [dragCoeff, setDragCoeff] = useState<number>(0.47);
  const [massKg, setMassKg] = useState<number>(1.8);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simTime, setSimTime] = useState<number>(0);

  const env = useMemo(() => ENVIRONMENTS.find((e) => e.id === envId) ?? ENVIRONMENTS[0], [envId]);

  const simulation = useMemo(() => {
    const theta = (angleDeg * Math.PI) / 180;
    const vx0 = velocity * Math.cos(theta);
    const vy0 = velocity * Math.sin(theta);
    const g = env.gravity;
    const rho = env.airDensity;
    const area = 0.015; // m^2 cross section (~13.8 cm diameter sphere)
    const k = (0.5 * rho * dragCoeff * area) / massKg;

    const dt = 0.02;
    const dragPts: TrajectoryPoint[] = [{ t: 0, x: 0, y: 0, vx: vx0, vy: vy0 }];
    const vacPts: TrajectoryPoint[] = [{ t: 0, x: 0, y: 0, vx: vx0, vy: vy0 }];

    // Integrate quadratic air drag
    let x = 0;
    let y = 0;
    let vx = vx0;
    let vy = vy0;
    let t = 0;
    let maxDragY = 0;

    while (t < 35) {
      const speed = Math.hypot(vx, vy);
      const ax = -k * speed * vx;
      const ay = -g - k * speed * vy;

      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;
      t += dt;

      if (y > maxDragY) maxDragY = y;
      if (y <= 0 && t > dt) {
        // Linear interpolation to y = 0
        const prev = dragPts[dragPts.length - 1];
        const frac = prev.y / (prev.y - y);
        const landX = prev.x + frac * (x - prev.x);
        const landT = prev.t + frac * dt;
        dragPts.push({ t: landT, x: landX, y: 0, vx, vy });
        break;
      }
      dragPts.push({ t, x, y, vx, vy });
    }

    // Ideal vacuum analytic points
    const vacFlightT = (2 * vy0) / g;
    const vacRange = vx0 * vacFlightT;
    const vacMaxY = (vy0 * vy0) / (2 * g);
    const vacSteps = 80;
    for (let i = 1; i <= vacSteps; i++) {
      const ti = (i / vacSteps) * vacFlightT;
      vacPts.push({
        t: ti,
        x: vx0 * ti,
        y: Math.max(0, vy0 * ti - 0.5 * g * ti * ti),
        vx: vx0,
        vy: vy0 - g * ti,
      });
    }

    const dragEnd = dragPts[dragPts.length - 1];
    const dragRange = dragEnd.x;
    const dragFlightT = dragEnd.t;
    const impactSpeed = Math.hypot(dragEnd.vx, dragEnd.vy);
    const rangeLossPct = vacRange > 0 ? ((vacRange - dragRange) / vacRange) * 100 : 0;

    return {
      dragPts,
      vacPts,
      dragRange,
      vacRange,
      maxDragY,
      vacMaxY,
      dragFlightT,
      vacFlightT,
      impactSpeed,
      rangeLossPct,
    };
  }, [env, velocity, angleDeg, dragCoeff, massKg]);

  const maxTime = Math.max(simulation.dragFlightT, simulation.vacFlightT);

  useEffect(() => {
    setSimTime(simulation.dragFlightT);
    setIsPlaying(false);
  }, [envId, velocity, angleDeg, dragCoeff, massKg, simulation.dragFlightT]);

  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTs) / 1000;
      lastTs = now;
      setSimTime((prev) => {
        const next = prev + deltaSec;
        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, maxTime]);

  const handleReset = () => {
    setEnvId('earth');
    setVelocity(48);
    setAngleDeg(45);
    setDragCoeff(0.47);
    setMassKg(1.8);
  };

  // Find active sample at simTime
  const activeDragPt = useMemo(() => {
    const pts = simulation.dragPts;
    const found = pts.find((p) => p.t >= simTime);
    return found ?? pts[pts.length - 1];
  }, [simulation.dragPts, simTime]);

  const activeVacPt = useMemo(() => {
    const pts = simulation.vacPts;
    const found = pts.find((p) => p.t >= simTime);
    return found ?? pts[pts.length - 1];
  }, [simulation.vacPts, simTime]);

  // SVG viewport scaling
  const plotLeft = 56;
  const plotRight = 644;
  const plotTop = 28;
  const plotBottom = 286;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const maxXDomain = Math.max(10, simulation.vacRange * 1.08);
  const maxYDomain = Math.max(10, simulation.vacMaxY * 1.18);
  const mapX = (x: number) => plotLeft + (x / maxXDomain) * plotW;
  const mapY = (y: number) => plotBottom - (y / maxYDomain) * plotH;

  const vacPath = simulation.vacPts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`)
    .join(' ');
  const dragPath = simulation.dragPts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`)
    .join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Ballistic Trajectory: Vacuum Ideal vs. Quadratic Air Drag
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {env.label} · g = {env.gravity} m/s² · A = 0.015 m²
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (simTime >= maxTime - 0.05) setSimTime(0);
                setIsPlaying((p) => !p);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSimTime((t) => (t + 0.25 > maxTime ? 0 : t + 0.25));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <StepForward className="w-3.5 h-3.5" aria-hidden="true" />
              Step
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox="0 0 680 328"
            className="w-full h-auto min-w-[540px]"
            role="img"
            aria-label="Projectile trajectory comparison between vacuum and aerodynamic drag"
          >
            {[0.25, 0.5, 0.75, 1.0].map((frac) => {
              const y = plotBottom - frac * plotH;
              const val = (frac * maxYDomain).toFixed(0);
              return (
                <g key={frac}>
                  <line x1={plotLeft} y1={y} x2={plotRight} y2={y} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
                  <text x={plotLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                    {val}m
                  </text>
                </g>
              );
            })}

            <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
            <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />

            {/* Vacuum trajectory */}
            <path
              d={vacPath}
              fill="none"
              className="stroke-slate-400 dark:stroke-slate-600"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* Drag trajectory */}
            <path
              d={dragPath}
              fill="none"
              className="stroke-sky-600 dark:stroke-sky-400"
              strokeWidth="3"
            />

            {/* Vacuum active sphere */}
            <circle
              cx={mapX(activeVacPt.x)}
              cy={mapY(activeVacPt.y)}
              r="5"
              className="fill-slate-400 dark:fill-slate-500"
            />

            {/* Drag active sphere + velocity vector */}
            <g>
              <line
                x1={mapX(activeDragPt.x)}
                y1={mapY(activeDragPt.y)}
                x2={mapX(activeDragPt.x) + activeDragPt.vx * 0.75}
                y2={mapY(activeDragPt.y) - activeDragPt.vy * 0.75}
                className="stroke-amber-600 dark:stroke-amber-400"
                strokeWidth="2"
              />
              <circle
                cx={mapX(activeDragPt.x)}
                cy={mapY(activeDragPt.y)}
                r="6.5"
                className="fill-sky-600 dark:fill-sky-400 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
            </g>

            {/* Legend */}
            <g transform="translate(465, 36)">
              <line x1="0" y1="6" x2="22" y2="6" className="stroke-sky-600 dark:stroke-sky-400" strokeWidth="3" />
              <text x="28" y="10" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-medium">
                Quadratic Drag
              </text>
              <line x1="0" y1="24" x2="22" y2="24" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2" strokeDasharray="5 3" />
              <text x="28" y="28" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-medium">
                Vacuum Ideal
              </text>
            </g>

            {/* X-axis ticks */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
              const xVal = frac * maxXDomain;
              return (
                <text
                  key={frac}
                  x={mapX(xVal)}
                  y={plotBottom + 18}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
                >
                  {xVal.toFixed(0)} m
                </text>
              );
            })}
          </svg>
        </div>

        {/* Time scrubber */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <label htmlFor="proj-time" className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Flight Clock
          </label>
          <input
            id="proj-time"
            type="range"
            min={0}
            max={maxTime}
            step={0.02}
            value={simTime}
            onChange={(e) => {
              setIsPlaying(false);
              setSimTime(Number(e.target.value));
            }}
            className="w-full bench-slider"
          />
          <span className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
            t = {simTime.toFixed(2)} s
          </span>
        </div>
      </div>

      {/* Control & Telemetry Deck */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trajectory Readout
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
              <Compass className="w-4 h-4" aria-hidden="true" />
              -{simulation.rangeLossPct.toFixed(1)}% Drag Loss
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Drag Range</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {simulation.dragRange.toFixed(1)} <span className="text-xs font-normal">m</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Vacuum Range</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-500 dark:text-slate-400">
                {simulation.vacRange.toFixed(1)} <span className="text-xs font-normal">m</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Peak Altitude</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {simulation.maxDragY.toFixed(1)} <span className="text-xs font-normal">m</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Impact Speed</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {simulation.impactSpeed.toFixed(1)} <span className="text-xs font-normal">m/s</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Launch Conditions
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
            <label htmlFor="proj-env" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Atmospheric Environment
            </label>
            <select
              id="proj-env"
              value={envId}
              onChange={(e) => setEnvId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {ENVIRONMENTS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="proj-vel" className="font-medium text-slate-700 dark:text-slate-300">
                Launch Speed v₀
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {velocity} m/s
              </span>
            </div>
            <input
              id="proj-vel"
              type="range"
              min={15}
              max={90}
              step={1}
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="proj-ang" className="font-medium text-slate-700 dark:text-slate-300">
                Elevation Angle θ
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {angleDeg}°
              </span>
            </div>
            <input
              id="proj-ang"
              type="range"
              min={10}
              max={80}
              step={1}
              value={angleDeg}
              onChange={(e) => setAngleDeg(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="proj-cd" className="font-medium text-slate-700 dark:text-slate-300">
                Drag Coefficient C_d
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {dragCoeff.toFixed(2)}
              </span>
            </div>
            <input
              id="proj-cd"
              type="range"
              min={0.05}
              max={1.2}
              step={0.05}
              value={dragCoeff}
              onChange={(e) => setDragCoeff(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="proj-mass" className="font-medium text-slate-700 dark:text-slate-300">
                Projectile Mass m
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {massKg.toFixed(1)} kg
              </span>
            </div>
            <input
              id="proj-mass"
              type="range"
              min={0.5}
              max={8.0}
              step={0.1}
              value={massKg}
              onChange={(e) => setMassKg(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
