'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react';
import {
  AirControls,
  CleanGridControls,
  CommunityReport,
  EmsControls,
  SOCIETAL_SCENARIOS,
  SocietalScenarioId,
  SocietalTelemetryFrame,
  SocietalVerificationResult,
  WaterControls,
} from '@/lib/realtimeModels';

interface RealtimeConsoleProps {
  activeScenario: SocietalScenarioId;
  onSelectScenario: (id: SocietalScenarioId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogVerifiedAction: (report: CommunityReport) => void;
}

const HISTORY_LEN = 80;

export const RealtimeConsole: React.FC<RealtimeConsoleProps> = ({
  activeScenario,
  onSelectScenario,
  isDark,
  onToggleTheme,
  onLogVerifiedAction,
}) => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [crisisActive, setCrisisActive] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<SocietalVerificationResult | null>(null);

  const [airCtrl, setAirCtrl] = useState<AirControls>({
    evTransitPct: 45,
    canopyAlbedoPct: 38,
    filtrationPct: 55,
  });

  const [waterCtrl, setWaterCtrl] = useState<WaterControls>({
    valveIsolationPct: 25,
    prvTargetKpa: 300,
    backupPumpLps: 45,
  });

  const [emsCtrl, setEmsCtrl] = useState<EmsControls>({
    stagedUnits: 10,
    diversionPct: 20,
    teleTriagePct: 18,
  });

  const [gridCtrl, setGridCtrl] = useState<CleanGridControls>({
    batteryDispatchMw: 55,
    demandResponsePct: 12,
    hydroReserveMw: 80,
  });

  const controlsRef = useRef({ airCtrl, waterCtrl, emsCtrl, gridCtrl, crisisActive });
  controlsRef.current = { airCtrl, waterCtrl, emsCtrl, gridCtrl, crisisActive };

  const physRef = useRef({
    t: 0,
    // Air & Heat
    pm25: 19.5,
    heatC: 29.8,
    // Water
    pressureKpa: 298,
    lossPct: 5.4,
    // EMS
    emsRespMin: 6.8,
    erOccPct: 76.0,
    // Clean Grid
    gridFreqHz: 60.0,
    reservePct: 16.5,
  });

  const [frames, setFrames] = useState<SocietalTelemetryFrame[]>(() =>
    Array.from({ length: HISTORY_LEN }, (_, i) => ({
      t: i * 0.12,
      primary: 19.5,
      secondary: 29.8,
      tertiary: 66,
      status: 'nominal',
      statusLabel: 'Safe',
    }))
  );

  const resetScenario = useCallback((scenario: SocietalScenarioId) => {
    setCrisisActive(false);
    setVerifyResult(null);
    setHoverIdx(null);

    if (scenario === 'air') {
      physRef.current = { ...physRef.current, t: 0, pm25: 19.5, heatC: 29.8 };
      setFrames(
        Array.from({ length: HISTORY_LEN }, (_, i) => ({
          t: i * 0.12,
          primary: 19.5,
          secondary: 29.8,
          tertiary: 66,
          status: 'nominal',
          statusLabel: 'Safe',
        }))
      );
    } else if (scenario === 'water') {
      physRef.current = { ...physRef.current, t: 0, pressureKpa: 298, lossPct: 5.4 };
      setFrames(
        Array.from({ length: HISTORY_LEN }, (_, i) => ({
          t: i * 0.12,
          primary: 298,
          secondary: 5.4,
          tertiary: 100,
          status: 'nominal',
          statusLabel: 'Nominal',
        }))
      );
    } else if (scenario === 'ems') {
      physRef.current = { ...physRef.current, t: 0, emsRespMin: 6.8, erOccPct: 76.0 };
      setFrames(
        Array.from({ length: HISTORY_LEN }, (_, i) => ({
          t: i * 0.12,
          primary: 6.8,
          secondary: 76.0,
          tertiary: 10.5,
          status: 'nominal',
          statusLabel: 'Nominal',
        }))
      );
    } else {
      physRef.current = { ...physRef.current, t: 0, gridFreqHz: 60.0, reservePct: 16.5 };
      setFrames(
        Array.from({ length: HISTORY_LEN }, (_, i) => ({
          t: i * 0.12,
          primary: 60.0,
          secondary: 16.5,
          tertiary: 0.0,
          status: 'nominal',
          statusLabel: 'Stable',
        }))
      );
    }
  }, []);

  useEffect(() => {
    resetScenario(activeScenario);
  }, [activeScenario, resetScenario]);

  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const dt = 0.12;
      const p = physRef.current;
      const c = controlsRef.current;
      p.t += dt;

      let frame: SocietalTelemetryFrame;

      if (activeScenario === 'air') {
        const trafficEmission = (c.crisisActive ? 46 : 20) * (1 - (c.airCtrl.evTransitPct / 100) * 0.78);
        const industrialEmission = (c.crisisActive ? 22 : 11) * (1 - (c.airCtrl.filtrationPct / 100) * 0.8);
        const dispersion = c.crisisActive ? 0.42 : 0.72;
        const targetPm25 = Math.max(6, (trafficEmission + industrialEmission) / dispersion);
        p.pm25 += (targetPm25 - p.pm25) * 0.18 + Math.sin(p.t * 2.1) * 0.18;

        const baseAmbientC = c.crisisActive ? 36.8 : 32.0;
        const canopyCooling = (c.airCtrl.canopyAlbedoPct / 100) * 6.4;
        const targetHeatC = baseAmbientC - canopyCooling + Math.sin(p.t * 1.4) * 0.05;
        p.heatC += (targetHeatC - p.heatC) * 0.2;

        const aqi = Math.min(300, Math.round(p.pm25 * 2.9));
        const status: SocietalTelemetryFrame['status'] =
          p.pm25 > 38 || p.heatC > 35
            ? 'critical'
            : p.pm25 > 25 || p.heatC > 32
            ? 'warning'
            : 'nominal';

        frame = {
          t: p.t,
          primary: p.pm25,
          secondary: p.heatC,
          tertiary: aqi,
          status,
          statusLabel:
            status === 'nominal' ? 'Safe' : status === 'warning' ? 'Elevated' : 'Hazardous',
        };
      } else if (activeScenario === 'water') {
        const leakOpenFrac = c.crisisActive ? 1 - c.waterCtrl.valveIsolationPct / 100 : 0.08;
        const leakFlowLps = Math.max(2, leakOpenFrac * 115);
        const totalSupplyLps = 180 + c.waterCtrl.backupPumpLps;
        const targetLossPct = Math.min(52, (leakFlowLps / Math.max(60, totalSupplyLps)) * 100);
        p.lossPct += (targetLossPct - p.lossPct) * 0.22;

        const pressureDrop = leakOpenFrac * 128 - c.waterCtrl.backupPumpLps * 0.55;
        const targetKpa = Math.max(110, Math.min(410, c.waterCtrl.prvTargetKpa - Math.max(0, pressureDrop)));
        p.pressureKpa += (targetKpa - p.pressureKpa) * 0.25 + Math.sin(p.t * 2.6) * 0.8;

        const clinicCoverage = Math.min(100, Math.max(45, (p.pressureKpa / 260) * 100));
        const status: SocietalTelemetryFrame['status'] =
          p.pressureKpa < 210 || p.lossPct > 18
            ? 'critical'
            : p.pressureKpa < 260 || p.pressureKpa > 340 || p.lossPct > 8
            ? 'warning'
            : 'nominal';

        frame = {
          t: p.t,
          primary: p.pressureKpa,
          secondary: p.lossPct,
          tertiary: clinicCoverage,
          status,
          statusLabel:
            status === 'nominal' ? 'Nominal' : status === 'warning' ? 'Low Margin' : 'Main Drop',
        };
      } else if (activeScenario === 'ems') {
        const incomingDemand = c.crisisActive ? 112 : 68;
        const divertedLoad = incomingDemand * (c.emsCtrl.diversionPct / 100) * 0.55;
        const teleFiltered = incomingDemand * (c.emsCtrl.teleTriagePct / 100) * 0.65;
        const effectiveErLoad = Math.max(42, Math.min(108, 48 + (incomingDemand - divertedLoad - teleFiltered) * 0.55));
        p.erOccPct += (effectiveErLoad - p.erOccPct) * 0.2;

        const offloadWait = Math.max(5, (p.erOccPct - 62) * 0.65);
        const travelMin = 3.2 + (c.crisisActive ? 2.4 : 0.8) + 28 / c.emsCtrl.stagedUnits;
        const targetResp = travelMin + Math.max(0, offloadWait - 11) * 0.28;
        p.emsRespMin += (targetResp - p.emsRespMin) * 0.25 + Math.sin(p.t * 1.9) * 0.05;

        const status: SocietalTelemetryFrame['status'] =
          p.emsRespMin > 10.5 || p.erOccPct > 92
            ? 'critical'
            : p.emsRespMin > 8.0 || p.erOccPct >= 85
            ? 'warning'
            : 'nominal';

        frame = {
          t: p.t,
          primary: p.emsRespMin,
          secondary: p.erOccPct,
          tertiary: offloadWait,
          status,
          statusLabel:
            status === 'nominal' ? 'Nominal' : status === 'warning' ? 'Delayed' : 'Overloaded',
        };
      } else {
        const eveningDemandMw = (c.crisisActive ? 360 : 255) * (1 - c.gridCtrl.demandResponsePct / 100);
        const solarMw = c.crisisActive ? 42 : 115;
        const totalCleanGenMw = solarMw + c.gridCtrl.batteryDispatchMw + c.gridCtrl.hydroReserveMw;

        const imbalanceMw = totalCleanGenMw - eveningDemandMw;
        const dfdt = (imbalanceMw / 320 - 0.8 * (p.gridFreqHz - 60.0)) / 1.8;
        p.gridFreqHz = Math.max(58.8, Math.min(60.8, p.gridFreqHz + dfdt * dt + Math.sin(p.t * 3.1) * 0.004));

        const targetReservePct = Math.max(0, ((totalCleanGenMw - eveningDemandMw * 0.88) / Math.max(100, eveningDemandMw)) * 100);
        p.reservePct += (targetReservePct - p.reservePct) * 0.24;

        const blackoutRisk =
          p.gridFreqHz < 59.5 || p.reservePct < 4
            ? Math.min(95, (59.9 - p.gridFreqHz) * 140 + Math.max(0, 8 - p.reservePct) * 6)
            : p.gridFreqHz < 59.9 || p.reservePct < 12
            ? 8.5
            : 0;

        const status: SocietalTelemetryFrame['status'] =
          p.gridFreqHz < 59.65 || blackoutRisk > 25
            ? 'critical'
            : p.gridFreqHz < 59.9 || p.gridFreqHz > 60.1 || p.reservePct < 12
            ? 'warning'
            : 'nominal';

        frame = {
          t: p.t,
          primary: p.gridFreqHz,
          secondary: p.reservePct,
          tertiary: Math.max(0, blackoutRisk),
          status,
          statusLabel:
            status === 'nominal' ? 'Stable' : status === 'warning' ? 'Tight Reserve' : 'Outage Risk',
        };
      }

      setFrames((prev) => [...prev.slice(-(HISTORY_LEN - 1)), frame]);
    }, 120);

    return () => clearInterval(timer);
  }, [isStreaming, activeScenario]);

  const scenarioSpec = useMemo(
    () => SOCIETAL_SCENARIOS.find((s) => s.id === activeScenario) ?? SOCIETAL_SCENARIOS[0],
    [activeScenario]
  );

  const latest = frames[frames.length - 1];
  const inspected = hoverIdx !== null && frames[hoverIdx] ? frames[hoverIdx] : latest;

  const chartBounds = useMemo(() => {
    if (activeScenario === 'air') {
      return { min: 5, max: 85, safeMin: 5, safeMax: 25, unit: 'µg/m³', label: 'Neighborhood PM2.5' };
    }
    if (activeScenario === 'water') {
      return { min: 140, max: 390, safeMin: 260, safeMax: 340, unit: 'kPa', label: 'Distribution Pressure' };
    }
    if (activeScenario === 'ems') {
      return { min: 3, max: 16, safeMin: 3, safeMax: 8, unit: 'min', label: 'Avg EMS Response' };
    }
    return { min: 59.1, max: 60.5, safeMin: 59.9, safeMax: 60.1, unit: 'Hz', label: 'Clean Grid Frequency' };
  }, [activeScenario]);

  const plotLeft = 54;
  const plotRight = 648;
  const plotTop = 24;
  const plotBottom = 228;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const mapX = (idx: number) => plotLeft + (idx / (HISTORY_LEN - 1)) * plotW;
  const mapY = (val: number) => {
    const clamped = Math.max(chartBounds.min, Math.min(chartBounds.max, val));
    return plotBottom - ((clamped - chartBounds.min) / (chartBounds.max - chartBounds.min)) * plotH;
  };

  const primaryPath = frames
    .map((f, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(idx).toFixed(1)} ${mapY(f.primary).toFixed(1)}`)
    .join(' ');

  const safeTopY = mapY(chartBounds.safeMax);
  const safeBottomY = mapY(chartBounds.safeMin);

  const handleVerifyServer = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: activeScenario,
          primary: latest.primary,
          secondary: latest.secondary,
          tertiary: latest.tertiary,
          crisisActive,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as SocietalVerificationResult;
        setVerifyResult(data);
        if (data.passed) {
          const categoryMap: Record<SocietalScenarioId, CommunityReport['category']> = {
            air: 'Air & Heat',
            water: 'Water & Sanitation',
            ems: 'Emergency & Safety',
            cleangrid: 'Power & Outage',
          };
          onLogVerifiedAction({
            id: `rep-${Date.now()}`,
            zone: `${scenarioSpec.sector} Sector`,
            category: categoryMap[activeScenario],
            severity: crisisActive ? 'Urgent' : 'Advisory',
            title: data.headline,
            actionNote: data.checks.map((ck) => `${ck.label}: ${ck.actual}`).join(' · '),
            status: 'Resolved',
            reportedAt: data.timestamp.slice(0, 5),
          });
        }
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section id="console" className="py-12 lg:py-16 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Real-Time Civic Infrastructure Consoles
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Trigger live public emergencies, tune clean-tech and civic dispatch interventions in
              real time, and verify safety compliance against public benchmarks.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
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

        {/* Scenario Selector */}
        <div
          role="tablist"
          aria-label="Real-time societal consoles"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl mb-6"
        >
          {SOCIETAL_SCENARIOS.map((s) => {
            const active = s.id === activeScenario;
            return (
              <button
                key={s.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onSelectScenario(s.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s.indexLabel}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 cols: Live Telemetry Waveform & Metrics */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {scenarioSpec.authorityRef} · Elapsed {latest.t.toFixed(1)} s
                </p>
                <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {scenarioSpec.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCrisisActive((c) => !c)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    crisisActive
                      ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                  {crisisActive ? 'Clear Active Crisis' : scenarioSpec.crisisLabel}
                </button>

                <button
                  type="button"
                  onClick={() => setIsStreaming((s) => !s)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isStreaming ? (
                    <>
                      <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      Pause Stream
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      Resume Stream
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {scenarioSpec.brief}
            </p>

            {/* Real-Time Oscilloscope Waveform */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-3 overflow-x-auto">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 px-2 pb-2">
                <span>
                  {chartBounds.label}:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {inspected.primary.toFixed(activeScenario === 'cleangrid' ? 2 : 1)}{' '}
                    {chartBounds.unit}
                  </strong>
                </span>
                <span>Public Safety Target: {scenarioSpec.targetSummary}</span>
              </div>

              <svg
                viewBox="0 0 680 256"
                className="w-full h-auto min-w-[520px] cursor-crosshair"
                role="img"
                aria-label={`${scenarioSpec.title} live telemetry graph`}
                onMouseLeave={() => setHoverIdx(null)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = ((e.clientX - rect.left) / rect.width) * 680;
                  const ratio = Math.max(0, Math.min(1, (relX - plotLeft) / plotW));
                  setHoverIdx(Math.round(ratio * (HISTORY_LEN - 1)));
                }}
              >
                <rect
                  x={plotLeft}
                  y={safeTopY}
                  width={plotW}
                  height={Math.max(4, safeBottomY - safeTopY)}
                  className="fill-emerald-500/12 dark:fill-emerald-400/12"
                />

                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = plotBottom - frac * plotH;
                  const val = chartBounds.min + frac * (chartBounds.max - chartBounds.min);
                  return (
                    <g key={frac}>
                      <line
                        x1={plotLeft}
                        y1={y}
                        x2={plotRight}
                        y2={y}
                        className="stroke-slate-200/80 dark:stroke-slate-800"
                        strokeWidth="1"
                      />
                      <text
                        x={plotLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                      >
                        {val.toFixed(activeScenario === 'cleangrid' ? 1 : 0)}
                      </text>
                    </g>
                  );
                })}

                <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />

                <path
                  d={primaryPath}
                  fill="none"
                  className={
                    latest.status === 'nominal'
                      ? 'stroke-sky-600 dark:stroke-sky-400'
                      : latest.status === 'warning'
                      ? 'stroke-amber-600 dark:stroke-amber-400'
                      : 'stroke-rose-600 dark:stroke-rose-400'
                  }
                  strokeWidth="2.6"
                />

                {hoverIdx !== null && frames[hoverIdx] && (
                  <g>
                    <line
                      x1={mapX(hoverIdx)}
                      y1={plotTop}
                      x2={mapX(hoverIdx)}
                      y2={plotBottom}
                      className="stroke-slate-400 dark:stroke-slate-500"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={mapX(hoverIdx)}
                      cy={mapY(frames[hoverIdx].primary)}
                      r="5"
                      className="fill-sky-600 dark:fill-sky-400 stroke-white dark:stroke-slate-900"
                      strokeWidth="2"
                    />
                  </g>
                )}

                <text x={plotRight} y={plotBottom + 18} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                  Live ({latest.t.toFixed(1)}s)
                </text>
                <text x={plotLeft} y={plotBottom + 18} textAnchor="start" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                  −9.6s Rolling Window
                </text>
              </svg>
            </div>

            {/* 3-Column Tabular Telemetry Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <MetricBlock
                label={
                  activeScenario === 'air'
                    ? 'PM2.5 Particulate'
                    : activeScenario === 'water'
                    ? 'Tap Pressure'
                    : activeScenario === 'ems'
                    ? 'Avg EMS Response'
                    : 'Grid Frequency'
                }
                value={latest.primary.toFixed(activeScenario === 'cleangrid' ? 2 : 1)}
                unit={
                  activeScenario === 'air'
                    ? 'µg/m³'
                    : activeScenario === 'water'
                    ? 'kPa'
                    : activeScenario === 'ems'
                    ? 'min'
                    : 'Hz'
                }
                status={latest.status}
                statusText={latest.statusLabel}
              />

              <MetricBlock
                label={
                  activeScenario === 'air'
                    ? 'Urban Heat Index'
                    : activeScenario === 'water'
                    ? 'Water Leak Loss'
                    : activeScenario === 'ems'
                    ? 'Central ER Load'
                    : 'Spinning Clean Reserve'
                }
                value={latest.secondary.toFixed(1)}
                unit={
                  activeScenario === 'air'
                    ? '°C'
                    : '%'
                }
              />

              <MetricBlock
                label={
                  activeScenario === 'air'
                    ? 'Air Quality Index'
                    : activeScenario === 'water'
                    ? 'Clinic Supply Coverage'
                    : activeScenario === 'ems'
                    ? 'Offload Wait Time'
                    : 'Blackout Risk'
                }
                value={latest.tertiary.toFixed(activeScenario === 'air' || activeScenario === 'water' ? 0 : 1)}
                unit={
                  activeScenario === 'air'
                    ? 'AQI'
                    : activeScenario === 'ems'
                    ? 'min'
                    : '%'
                }
              />
            </div>

            {/* Next.js Server Audit Result */}
            {verifyResult && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {verifyResult.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    )}
                    <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {verifyResult.headline}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    Verified · {verifyResult.timestamp}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {verifyResult.checks.map((ck) => (
                    <div
                      key={ck.label}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">{ck.label}</span>
                        <span
                          className={
                            ck.ok
                              ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                              : 'font-semibold text-rose-700 dark:text-rose-400'
                          }
                        >
                          {ck.ok ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {ck.actual}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        Target: {ck.target}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 4 cols: Public Intervention Controls */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Civic Intervention Controls
              </h4>
              <button
                type="button"
                onClick={() => resetScenario(activeScenario)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            {activeScenario === 'air' && (
              <>
                <ControlSlider
                  id="air-ev"
                  label="Electric Transit & Bus Shift"
                  valueLabel={`${airCtrl.evTransitPct}%`}
                  min={10}
                  max={95}
                  step={5}
                  value={airCtrl.evTransitPct}
                  onChange={(v) => setAirCtrl((s) => ({ ...s, evTransitPct: v }))}
                />
                <ControlSlider
                  id="air-canopy"
                  label="Cool Roof & Tree Canopy"
                  valueLabel={`${airCtrl.canopyAlbedoPct}%`}
                  min={15}
                  max={85}
                  step={5}
                  value={airCtrl.canopyAlbedoPct}
                  onChange={(v) => setAirCtrl((s) => ({ ...s, canopyAlbedoPct: v }))}
                />
                <ControlSlider
                  id="air-filt"
                  label="Industrial Scrubber Mandate"
                  valueLabel={`${airCtrl.filtrationPct}%`}
                  min={20}
                  max={95}
                  step={5}
                  value={airCtrl.filtrationPct}
                  onChange={(v) => setAirCtrl((s) => ({ ...s, filtrationPct: v }))}
                />
              </>
            )}

            {activeScenario === 'water' && (
              <>
                <ControlSlider
                  id="wat-valve"
                  label="Broken Main Valve Isolation"
                  valueLabel={`${waterCtrl.valveIsolationPct}%`}
                  min={0}
                  max={100}
                  step={5}
                  value={waterCtrl.valveIsolationPct}
                  onChange={(v) => setWaterCtrl((s) => ({ ...s, valveIsolationPct: v }))}
                />
                <ControlSlider
                  id="wat-prv"
                  label="Smart PRV Target Pressure"
                  valueLabel={`${waterCtrl.prvTargetKpa} kPa`}
                  min={220}
                  max={380}
                  step={10}
                  value={waterCtrl.prvTargetKpa}
                  onChange={(v) => setWaterCtrl((s) => ({ ...s, prvTargetKpa: v }))}
                />
                <ControlSlider
                  id="wat-pump"
                  label="Backup Clean Pump Boost"
                  valueLabel={`${waterCtrl.backupPumpLps} L/s`}
                  min={0}
                  max={140}
                  step={5}
                  value={waterCtrl.backupPumpLps}
                  onChange={(v) => setWaterCtrl((s) => ({ ...s, backupPumpLps: v }))}
                />
              </>
            )}

            {activeScenario === 'ems' && (
              <>
                <ControlSlider
                  id="ems-units"
                  label="Forward Staged Ambulances"
                  valueLabel={`${emsCtrl.stagedUnits} units`}
                  min={4}
                  max={20}
                  step={1}
                  value={emsCtrl.stagedUnits}
                  onChange={(v) => setEmsCtrl((s) => ({ ...s, stagedUnits: v }))}
                />
                <ControlSlider
                  id="ems-div"
                  label="Regional ER Diversion Share"
                  valueLabel={`${emsCtrl.diversionPct}%`}
                  min={0}
                  max={60}
                  step={5}
                  value={emsCtrl.diversionPct}
                  onChange={(v) => setEmsCtrl((s) => ({ ...s, diversionPct: v }))}
                />
                <ControlSlider
                  id="ems-tele"
                  label="Tele-Triage Fast-Track"
                  valueLabel={`${emsCtrl.teleTriagePct}%`}
                  min={5}
                  max={45}
                  step={5}
                  value={emsCtrl.teleTriagePct}
                  onChange={(v) => setEmsCtrl((s) => ({ ...s, teleTriagePct: v }))}
                />
              </>
            )}

            {activeScenario === 'cleangrid' && (
              <>
                <ControlSlider
                  id="cg-batt"
                  label="Community Battery Dispatch"
                  valueLabel={`${gridCtrl.batteryDispatchMw} MW`}
                  min={0}
                  max={180}
                  step={10}
                  value={gridCtrl.batteryDispatchMw}
                  onChange={(v) => setGridCtrl((s) => ({ ...s, batteryDispatchMw: v }))}
                />
                <ControlSlider
                  id="cg-dr"
                  label="Smart Thermostat Demand-Response"
                  valueLabel={`${gridCtrl.demandResponsePct}%`}
                  min={0}
                  max={35}
                  step={1}
                  value={gridCtrl.demandResponsePct}
                  onChange={(v) => setGridCtrl((s) => ({ ...s, demandResponsePct: v }))}
                />
                <ControlSlider
                  id="cg-hydro"
                  label="Clean Hydro Reserve Dispatch"
                  valueLabel={`${gridCtrl.hydroReserveMw} MW`}
                  min={20}
                  max={160}
                  step={10}
                  value={gridCtrl.hydroReserveMw}
                  onChange={(v) => setGridCtrl((s) => ({ ...s, hydroReserveMw: v }))}
                />
              </>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  System Balance Model
                </p>
                <p className="mt-1 font-mono text-xs text-sky-700 dark:text-sky-300 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                  {scenarioSpec.governingModel}
                </p>
              </div>

              <button
                type="button"
                disabled={verifying}
                onClick={handleVerifyServer}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                {verifying ? 'Verifying Public Safety...' : 'Verify Public Safety Compliance'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface MetricBlockProps {
  label: string;
  value: string;
  unit: string;
  status?: SocietalTelemetryFrame['status'];
  statusText?: string;
}

const MetricBlock: React.FC<MetricBlockProps> = ({ label, value, unit, status, statusText }) => (
  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {status && statusText && (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            status === 'nominal'
              ? 'text-emerald-700 dark:text-emerald-400'
              : status === 'warning'
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {status === 'nominal' && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
          {status === 'warning' && <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />}
          {status === 'critical' && <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />}
          {statusText}
        </span>
      )}
    </div>
    <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100">
      {value}
      <span className="text-xs font-normal uppercase text-slate-500 dark:text-slate-400 ml-1.5">
        {unit}
      </span>
    </p>
  </div>
);

interface ControlSliderProps {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}

const ControlSlider: React.FC<ControlSliderProps> = ({
  id,
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5">
      <label htmlFor={id} className="font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{valueLabel}</span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bench-slider"
    />
  </div>
);
