import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';

interface PlantPreset {
  id: string;
  name: string;
  mass: number;
  damping: number;
  stiffness: number;
  description: string;
}

const PLANTS: PlantPreset[] = [
  {
    id: 'mass-spring',
    name: 'Mass-Spring-Damper',
    mass: 1.0,
    damping: 1.4,
    stiffness: 2.0,
    description: 'Mechanical position actuator (m = 1.0 kg, b = 1.4 N·s/m, k = 2.0 N/m)',
  },
  {
    id: 'dc-motor',
    name: 'DC Servo Inertial Load',
    mass: 0.6,
    damping: 2.2,
    stiffness: 0.4,
    description: 'Light rotor inertia with viscous bearing drag',
  },
  {
    id: 'thermal',
    name: 'Thermal Process Chamber',
    mass: 2.4,
    damping: 3.0,
    stiffness: 1.0,
    description: 'High thermal capacitance requiring integral gain to eliminate offset',
  },
];

export const PidControlLab: React.FC = () => {
  const [plantId, setPlantId] = useState<string>('mass-spring');
  const [kp, setKp] = useState<number>(12.0);
  const [ki, setKi] = useState<number>(6.0);
  const [kd, setKd] = useState<number>(3.5);
  const [setpoint, setSetpoint] = useState<number>(1.0);

  const plant = useMemo(() => PLANTS.find((p) => p.id === plantId) ?? PLANTS[0], [plantId]);

  const handleReset = () => {
    setPlantId('mass-spring');
    setKp(12.0);
    setKi(6.0);
    setKd(3.5);
    setSetpoint(1.0);
  };

  const sim = useMemo(() => {
    const dt = 0.01;
    const totalT = 8.0;
    const steps = Math.round(totalT / dt);

    let y = 0;
    let dy = 0;
    let integral = 0;
    let prevError = setpoint;

    const trace: { t: number; y: number }[] = [{ t: 0, y: 0 }];
    let peakY = 0;
    let t10: number | null = null;
    let t90: number | null = null;

    for (let i = 1; i <= steps; i++) {
      const t = i * dt;
      const error = setpoint - y;
      integral = Math.max(-50, Math.min(50, integral + error * dt));
      const derivative = (error - prevError) / dt;
      prevError = error;

      const u = kp * error + ki * integral + kd * derivative;
      // Plant ODE: m*y'' + b*y' + k*y = u
      const ddy = (u - plant.damping * dy - plant.stiffness * y) / plant.mass;
      dy += ddy * dt;
      y += dy * dt;

      // Guard against runaway numerical overflow for unstable gains
      const clampedY = Math.max(-2.5 * setpoint, Math.min(3.5 * setpoint, y));
      if (clampedY > peakY) peakY = clampedY;
      if (t10 === null && clampedY >= 0.1 * setpoint) t10 = t;
      if (t90 === null && clampedY >= 0.9 * setpoint) t90 = t;

      if (i % 2 === 0) {
        trace.push({ t, y: clampedY });
      }
    }

    // Calculate settling time within +/- 2% of setpoint
    const tol = 0.02 * setpoint;
    let settlingTime: number | null = null;
    for (let idx = trace.length - 1; idx >= 0; idx--) {
      if (Math.abs(trace[idx].y - setpoint) > tol) {
        settlingTime = idx < trace.length - 1 ? trace[idx + 1].t : null;
        break;
      }
    }
    if (settlingTime === null && Math.abs(trace[trace.length - 1].y - setpoint) <= tol) {
      settlingTime = trace[0].t;
    }

    const finalY = trace[trace.length - 1].y;
    const steadyStateErrorPct = setpoint > 0 ? (Math.abs(setpoint - finalY) / setpoint) * 100 : 0;
    const overshootPct = setpoint > 0 ? Math.max(0, ((peakY - setpoint) / setpoint) * 100) : 0;
    const riseTime = t10 !== null && t90 !== null ? t90 - t10 : null;

    const tail = trace.slice(-25);
    const tailSwing = Math.max(...tail.map((p) => p.y)) - Math.min(...tail.map((p) => p.y));
    const stability: 'settled' | 'oscillatory' | 'unstable' =
      tailSwing > 0.25 * setpoint || peakY >= 2.8 * setpoint
        ? 'unstable'
        : overshootPct > 15 || settlingTime === null
        ? 'oscillatory'
        : 'settled';

    return {
      trace,
      overshootPct,
      riseTime,
      settlingTime,
      steadyStateErrorPct,
      stability,
      totalT,
    };
  }, [plant, kp, ki, kd, setpoint]);

  const plotLeft = 56;
  const plotRight = 644;
  const plotTop = 30;
  const plotBottom = 236;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const yMax = Math.max(setpoint * 1.6, ...sim.trace.map((p) => p.y), 1.4);
  const yMin = Math.min(0, ...sim.trace.map((p) => p.y));
  const ySpan = yMax - yMin || 1;

  const mapT = (t: number) => plotLeft + (t / sim.totalT) * plotW;
  const mapY = (val: number) => plotBottom - ((val - yMin) / ySpan) * plotH;

  const responsePath = sim.trace
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${mapT(pt.t).toFixed(1)} ${mapY(pt.y).toFixed(1)}`)
    .join(' ');

  const spY = mapY(setpoint);
  const bandTop = mapY(setpoint * 1.02);
  const bandBottom = mapY(setpoint * 0.98);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Closed-Loop PID Step Response Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {plant.description}
            </p>
          </div>
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
            Setpoint r(t) = {setpoint.toFixed(1)}
          </span>
        </div>

        {/* Closed-loop block diagram */}
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-4 py-3 overflow-x-auto">
          <svg viewBox="0 0 680 78" className="w-full h-auto min-w-[520px]" role="img" aria-label="PID feedback loop block diagram">
            <line x1="20" y1="30" x2="108" y2="30" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.8" />
            <text x="20" y="22" className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono">r(t)</text>

            <circle cx="122" cy="30" r="14" className="fill-white dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.8" />
            <text x="122" y="34" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[12px] font-mono">Σ</text>

            <line x1="136" y1="30" x2="210" y2="30" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.8" />
            <text x="172" y="22" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">e(t)</text>

            <rect x="210" y="12" width="150" height="36" rx="6" className="fill-white dark:fill-slate-900 stroke-sky-600 dark:stroke-sky-400" strokeWidth="1.8" />
            <text x="285" y="34" textAnchor="middle" className="fill-slate-900 dark:fill-slate-100 text-[11px] font-mono font-semibold">
              PID ({kp.toFixed(0)}, {ki.toFixed(0)}, {kd.toFixed(1)})
            </text>

            <line x1="360" y1="30" x2="420" y2="30" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.8" />
            <text x="390" y="22" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">u(t)</text>

            <rect x="420" y="12" width="145" height="36" rx="6" className="fill-white dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.8" />
            <text x="492" y="34" textAnchor="middle" className="fill-slate-900 dark:fill-slate-100 text-[11px] font-mono">
              Plant G(s)
            </text>

            <line x1="565" y1="30" x2="656" y2="30" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.8" />
            <text x="642" y="22" textAnchor="end" className="fill-slate-700 dark:fill-slate-200 text-[11px] font-mono">y(t)</text>

            {/* Feedback path */}
            <polyline
              points="605,30 605,66 122,66 122,44"
              fill="none"
              className="stroke-slate-400 dark:stroke-slate-600"
              strokeWidth="1.6"
            />
            <text x="134" y="60" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">− feedback</text>
          </svg>
        </div>

        {/* Step Response Plot */}
        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox="0 0 680 272"
            className="w-full h-auto min-w-[540px]"
            role="img"
            aria-label="PID closed loop step response graph"
          >
            {/* +/- 2% settling band */}
            <rect
              x={plotLeft}
              y={bandTop}
              width={plotW}
              height={Math.max(2, bandBottom - bandTop)}
              className="fill-emerald-500/12 dark:fill-emerald-400/12"
            />

            {/* Target setpoint line */}
            <line
              x1={plotLeft}
              y1={spY}
              x2={plotRight}
              y2={spY}
              className="stroke-emerald-600 dark:stroke-emerald-400"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text
              x={plotRight - 4}
              y={spY - 6}
              textAnchor="end"
              className="fill-emerald-700 dark:fill-emerald-400 text-[11px] font-mono"
            >
              Setpoint ({setpoint.toFixed(1)}) ±2% band
            </text>

            {/* Axes */}
            <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
            <line x1={plotLeft} y1={mapY(0)} x2={plotRight} y2={mapY(0)} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1" />

            {/* Output response curve */}
            <path
              d={responsePath}
              fill="none"
              className="stroke-sky-600 dark:stroke-sky-400"
              strokeWidth="2.8"
            />

            {/* Time ticks */}
            {[0, 2, 4, 6, 8].map((sec) => (
              <text
                key={sec}
                x={mapT(sec)}
                y={plotBottom + 18}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
              >
                {sec}s
              </text>
            ))}

            <text x="16" y="136" transform="rotate(-90 16 136)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono">
              Output y(t)
            </text>
          </svg>
        </div>
      </div>

      {/* Right Deck */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Step Metrics
            </span>
            {sim.stability === 'settled' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Settled
              </span>
            )}
            {sim.stability === 'oscillatory' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Underdamped Ringing
              </span>
            )}
            {sim.stability === 'unstable' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                Unstable
              </span>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Overshoot</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {sim.overshootPct.toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Rise Time</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {sim.riseTime !== null ? `${sim.riseTime.toFixed(2)} s` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Settling (±2%)</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {sim.settlingTime !== null ? `${sim.settlingTime.toFixed(2)} s` : '> 8.0 s'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Steady Error</dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                {sim.steadyStateErrorPct.toFixed(2)}%
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Controller Gains
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
            <label htmlFor="pid-plant" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Plant Model
            </label>
            <select
              id="pid-plant"
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {PLANTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="pid-kp" className="font-medium text-slate-700 dark:text-slate-300">
                Proportional Gain K_p
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {kp.toFixed(1)}
              </span>
            </div>
            <input
              id="pid-kp"
              type="range"
              min={0}
              max={40}
              step={0.5}
              value={kp}
              onChange={(e) => setKp(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="pid-ki" className="font-medium text-slate-700 dark:text-slate-300">
                Integral Gain K_i
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {ki.toFixed(1)}
              </span>
            </div>
            <input
              id="pid-ki"
              type="range"
              min={0}
              max={25}
              step={0.5}
              value={ki}
              onChange={(e) => setKi(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="pid-kd" className="font-medium text-slate-700 dark:text-slate-300">
                Derivative Gain K_d
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {kd.toFixed(1)}
              </span>
            </div>
            <input
              id="pid-kd"
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={kd}
              onChange={(e) => setKd(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label htmlFor="pid-sp" className="font-medium text-slate-700 dark:text-slate-300">
                Target Setpoint
              </label>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                {setpoint.toFixed(1)}
              </span>
            </div>
            <input
              id="pid-sp"
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={setpoint}
              onChange={(e) => setSetpoint(Number(e.target.value))}
              className="w-full bench-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
