import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  BookmarkPlus,
  Building2,
  Check,
  CheckCircle2,
  Droplets,
  Flame,
  RotateCcw,
  ShieldAlert,
  Sun,
} from 'lucide-react';
import { FormulaDiscipline, StudyLogItem } from '../data/engineeringData';

type ProblemId = 'solar' | 'pump' | 'ev' | 'thermal' | 'bridge';

interface RealLifeProblemsSectionProps {
  onSaveToStudyLog: (item: Omit<StudyLogItem, 'id' | 'completed'>) => void;
}

const PROBLEM_TABS: {
  id: ProblemId;
  label: string;
  domain: string;
  discipline: FormulaDiscipline;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'solar',
    label: '01. Solar & Battery Sizing',
    domain: 'Power & Energy',
    discipline: 'Circuits & Signals',
    icon: Sun,
  },
  {
    id: 'pump',
    label: '02. Building Booster Pump',
    domain: 'Fluid Mechanics',
    discipline: 'Fluids & Thermo',
    icon: Droplets,
  },
  {
    id: 'ev',
    label: '03. EV Mountain Commute',
    domain: 'Vehicle Dynamics',
    discipline: 'Dynamics & Control',
    icon: BatteryCharging,
  },
  {
    id: 'thermal',
    label: '04. Lab Cooling Load',
    domain: 'Heat Transfer',
    discipline: 'Fluids & Thermo',
    icon: Flame,
  },
  {
    id: 'bridge',
    label: '05. Footbridge Code Audit',
    domain: 'Structural Design',
    discipline: 'Statics & Solids',
    icon: Building2,
  },
];

export const RealLifeProblemsSection: React.FC<RealLifeProblemsSectionProps> = ({
  onSaveToStudyLog,
}) => {
  const [activeProblem, setActiveProblem] = useState<ProblemId>('solar');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // 1. Solar & Battery Sizing state
  const [dailyLoadKwh, setDailyLoadKwh] = useState<number>(5.2);
  const [peakSunHours, setPeakSunHours] = useState<number>(4.5);
  const [solarWatts, setSolarWatts] = useState<number>(1800);
  const [batteryKwh, setBatteryKwh] = useState<number>(10.0);
  const [autonomyTargetDays, setAutonomyTargetDays] = useState<number>(1.5);

  // 2. Booster Pump state
  const [pipeDiameterMm, setPipeDiameterMm] = useState<number>(32);
  const [pipeLengthM, setPipeLengthM] = useState<number>(42);
  const [flowLpm, setFlowLpm] = useState<number>(45);
  const [pumpHeadM, setPumpHeadM] = useState<number>(42);
  const [pipeMaterial, setPipeMaterial] = useState<'pvc' | 'copper'>('pvc');

  // 3. EV Commute state
  const [evSpeedKmh, setEvSpeedKmh] = useState<number>(95);
  const [evPayloadKg, setEvPayloadKg] = useState<number>(180);
  const [evHeadwindKmh, setEvHeadwindKmh] = useState<number>(15);
  const [evRegenPct, setEvRegenPct] = useState<number>(65);

  // 4. Thermal Cooling Load state
  const [equipHeatW, setEquipHeatW] = useState<number>(1100);
  const [outdoorTempC, setOutdoorTempC] = useState<number>(34);
  const [wallRValue, setWallRValue] = useState<number>(2.4);
  const [acCapacityKw, setAcCapacityKw] = useState<number>(2.2);

  // 5. Footbridge Code Audit state
  const [bridgeMaterial, setBridgeMaterial] = useState<'steel' | 'timber' | 'aluminum'>('steel');
  const [girderCount, setGirderCount] = useState<number>(3);
  const [girderInertiaE6, setGirderInertiaE6] = useState<number>(48);
  const [crowdLoadKn, setCrowdLoadKn] = useState<number>(24);

  const handleResetActive = () => {
    if (activeProblem === 'solar') {
      setDailyLoadKwh(5.2);
      setPeakSunHours(4.5);
      setSolarWatts(1800);
      setBatteryKwh(10.0);
      setAutonomyTargetDays(1.5);
    } else if (activeProblem === 'pump') {
      setPipeDiameterMm(32);
      setPipeLengthM(42);
      setFlowLpm(45);
      setPumpHeadM(42);
      setPipeMaterial('pvc');
    } else if (activeProblem === 'ev') {
      setEvSpeedKmh(95);
      setEvPayloadKg(180);
      setEvHeadwindKmh(15);
      setEvRegenPct(65);
    } else if (activeProblem === 'thermal') {
      setEquipHeatW(1100);
      setOutdoorTempC(34);
      setWallRValue(2.4);
      setAcCapacityKw(2.2);
    } else {
      setBridgeMaterial('steel');
      setGirderCount(3);
      setGirderInertiaE6(48);
      setCrowdLoadKn(24);
    }
  };

  // --- PROBLEM 1: SOLAR & BATTERY ---
  const solarModel = useMemo(() => {
    const systemDerate = 0.82;
    const dod = 0.8; // LiFePO4 usable depth of discharge
    const budgetCap = 6500;

    const dailyHarvestKwh = (solarWatts / 1000) * peakSunHours * systemDerate;
    const usableBatteryKwh = batteryKwh * dod;
    const autonomyDays = dailyLoadKwh > 0 ? usableBatteryKwh / dailyLoadKwh : 0;
    const netDailyBalance = dailyHarvestKwh - dailyLoadKwh;

    // Hardware cost estimate ($1.15/W PV + $380/kWh LiFePO4 + $750 inverter/BOS)
    const totalCost = Math.round(solarWatts * 1.15 + batteryKwh * 380 + 750);

    // Simulate 7-day sequence including a 2-day storm (25% solar yield on days 3 & 4)
    const weatherFactors = [1.0, 0.95, 0.25, 0.25, 0.85, 1.0, 1.0];
    let socKwh = usableBatteryKwh;
    const socTrace: { day: number; socPct: number }[] = [{ day: 0, socPct: 100 }];

    for (let d = 0; d < weatherFactors.length; d++) {
      const gen = dailyHarvestKwh * weatherFactors[d];
      socKwh = Math.max(0, Math.min(usableBatteryKwh, socKwh + gen - dailyLoadKwh));
      socTrace.push({
        day: d + 1,
        socPct: usableBatteryKwh > 0 ? (socKwh / usableBatteryKwh) * 100 : 0,
      });
    }

    const minSocPct = Math.min(...socTrace.map((p) => p.socPct));
    const meetsAutonomy = autonomyDays >= autonomyTargetDays && netDailyBalance >= 0 && minSocPct > 5;
    const withinBudget = totalCost <= budgetCap;

    const verdict: 'pass' | 'warn' | 'fail' =
      meetsAutonomy && withinBudget ? 'pass' : meetsAutonomy || withinBudget ? 'warn' : 'fail';

    const verdictText =
      verdict === 'pass'
        ? 'Meets Autonomy & Budget'
        : !withinBudget
        ? 'Exceeds $6,500 Club Budget'
        : netDailyBalance < 0
        ? 'Daily Solar Deficit'
        : 'Insufficient Backup Autonomy';

    return {
      dailyHarvestKwh,
      usableBatteryKwh,
      autonomyDays,
      netDailyBalance,
      totalCost,
      budgetCap,
      socTrace,
      minSocPct,
      verdict,
      verdictText,
    };
  }, [dailyLoadKwh, peakSunHours, solarWatts, batteryKwh, autonomyTargetDays]);

  // --- PROBLEM 2: BOOSTER PUMP ---
  const pumpModel = useMemo(() => {
    const elevationM = 18; // 6th floor height
    const rho = 998; // kg/m3
    const g = 9.81;
    const mu = 0.001; // Pa*s
    const dM = pipeDiameterMm / 1000;
    const area = (Math.PI * dM * dM) / 4;
    const qM3s = flowLpm / 60000;
    const velocity = qM3s / area;

    const roughness = pipeMaterial === 'pvc' ? 1.5e-6 : 1.5e-6;
    const reynolds = (rho * velocity * dM) / mu;

    // Swamee-Jain friction factor
    let frictionFactor = 0.025;
    if (reynolds < 2300 && reynolds > 0) {
      frictionFactor = 64 / reynolds;
    } else if (reynolds >= 2300) {
      const term = roughness / (3.7 * dM) + 5.74 / Math.pow(reynolds, 0.9);
      frictionFactor = 0.25 / Math.pow(Math.log10(term), 2);
    }

    // Add 15% minor losses (elbows/valves)
    const headLossM = frictionFactor * (pipeLengthM / dM) * ((velocity * velocity) / (2 * g)) * 1.15;
    const deliveredHeadM = pumpHeadM - elevationM - headLossM;
    const deliveredKpa = (rho * g * deliveredHeadM) / 1000;
    const shaftPowerW = (rho * g * qM3s * pumpHeadM) / 0.68; // 68% pump eff

    const pressureOk = deliveredKpa >= 200;
    const velocityOk = velocity <= 2.4;

    const verdict: 'pass' | 'warn' | 'fail' =
      pressureOk && velocityOk ? 'pass' : pressureOk || velocityOk ? 'warn' : 'fail';

    const verdictText =
      verdict === 'pass'
        ? 'Meets 200 kPa & Velocity Limit'
        : !velocityOk
        ? 'Velocity > 2.4 m/s (Hammer Risk)'
        : 'Insufficient 6th-Floor Pressure';

    return {
      velocity,
      reynolds,
      headLossM,
      deliveredKpa,
      shaftPowerW,
      elevationM,
      verdict,
      verdictText,
    };
  }, [pipeDiameterMm, pipeLengthM, flowLpm, pumpHeadM, pipeMaterial]);

  // --- PROBLEM 3: EV COMMUTE ---
  const evModel = useMemo(() => {
    const packCapacityKwh = 62;
    const distanceKm = 85;
    const climbM = 1100;
    const baseMassKg = 1850;
    const totalMass = baseMassKg + evPayloadKg;
    const crr = 0.011;
    const cdA = 0.62; // m^2
    const rho = 1.18;
    const g = 9.81;
    const driveEff = 0.89;

    const vMs = evSpeedKmh / 3.6;
    const vAirMs = (evSpeedKmh + evHeadwindKmh) / 3.6;
    const distM = distanceKm * 1000;

    // Outbound (uphill + headwind)
    const rollingJ = crr * totalMass * g * distM;
    const aeroOutJ = 0.5 * rho * cdA * vAirMs * vAirMs * distM;
    const climbJ = totalMass * g * climbM;
    const outboundKwh = (rollingJ + aeroOutJ + climbJ) / (3.6e6 * driveEff);

    // Return (downhill + tailwind)
    const vAirReturnMs = Math.max(0, (evSpeedKmh - evHeadwindKmh) / 3.6);
    const aeroRetJ = 0.5 * rho * cdA * vAirReturnMs * vAirReturnMs * distM;
    const regenRecoveredJ = climbJ * (evRegenPct / 100);
    const returnNetJ = (rollingJ + aeroRetJ) / driveEff - regenRecoveredJ;
    const returnKwh = Math.max(0.5, returnNetJ / 3.6e6);

    const totalTripKwh = outboundKwh + returnKwh;
    const remainingKwh = packCapacityKwh - totalTripKwh;
    const remainingSocPct = (remainingKwh / packCapacityKwh) * 100;
    const avgWhPerKm = (totalTripKwh * 1000) / (distanceKm * 2);

    const verdict: 'pass' | 'warn' | 'fail' =
      remainingSocPct >= 20 ? 'pass' : remainingSocPct >= 5 ? 'warn' : 'fail';

    const verdictText =
      verdict === 'pass'
        ? 'Safe Round-Trip Reserve (≥ 20%)'
        : verdict === 'warn'
        ? 'Low Arrival Margin (< 20%)'
        : 'Battery Depleted Before Return';

    return {
      outboundKwh,
      returnKwh,
      totalTripKwh,
      remainingKwh,
      remainingSocPct,
      avgWhPerKm,
      packCapacityKwh,
      verdict,
      verdictText,
    };
  }, [evSpeedKmh, evPayloadKg, evHeadwindKmh, evRegenPct]);

  // --- PROBLEM 4: THERMAL COOLING ---
  const thermalModel = useMemo(() => {
    const envelopeAreaM2 = 18;
    const targetTempC = 25;
    const ua = envelopeAreaM2 / wallRValue; // W/K

    // Steady-state balance: Q_equip + UA * (T_out - T_in) = Q_ac
    const acWatts = acCapacityKw * 1000;
    const equilibriumTempC = outdoorTempC + (equipHeatW - acWatts) / ua;
    const heatGainAtTargetW = equipHeatW + ua * Math.max(0, outdoorTempC - targetTempC);
    const requiredKw = heatGainAtTargetW / 1000;
    const requiredBtuH = requiredKw * 3412.14;

    // 6-hour transient curve starting from 24 C
    const thermalCapJperK = 145000; // air + furniture + hardware mass
    const trace: { hr: number; tempC: number }[] = [];
    let tC = 24.0;
    const dtSec = 300; // 5-min step
    for (let step = 0; step <= 72; step++) {
      if (step % 6 === 0) {
        trace.push({ hr: (step * dtSec) / 3600, tempC: tC });
      }
      const qNet = equipHeatW + ua * (outdoorTempC - tC) - acWatts;
      tC += (qNet * dtSec) / thermalCapJperK;
    }

    const verdict: 'pass' | 'warn' | 'fail' =
      equilibriumTempC <= 25.0 ? 'pass' : equilibriumTempC <= 28.0 ? 'warn' : 'fail';

    const verdictText =
      verdict === 'pass'
        ? 'Maintains ≤ 25 °C Target'
        : verdict === 'warn'
        ? 'Thermal Drift (25–28 °C)'
        : 'Overheating Risk (> 28 °C)';

    return {
      equilibriumTempC,
      requiredKw,
      requiredBtuH,
      heatGainAtTargetW,
      trace,
      verdict,
      verdictText,
    };
  }, [equipHeatW, outdoorTempC, wallRValue, acCapacityKw]);

  // --- PROBLEM 5: FOOTBRIDGE AUDIT ---
  const bridgeModel = useMemo(() => {
    const spanM = 10.0;
    const cM = 0.14; // 140 mm extreme fiber distance
    const mats = {
      steel: { name: 'ASTM A992 Steel', eGpa: 200, yieldMpa: 345 },
      aluminum: { name: '6061-T6 Aluminum', eGpa: 68.9, yieldMpa: 276 },
      timber: { name: 'Glulam Timber', eGpa: 12.4, yieldMpa: 38 },
    };
    const mat = mats[bridgeMaterial];
    const perGirderLoadN = (crowdLoadKn * 1000) / girderCount;
    const E = mat.eGpa * 1e9;
    const I = girderInertiaE6 * 1e-6;

    // Simply supported midspan point load: delta = P*L^3 / (48*E*I)
    const deflectionMm = ((perGirderLoadN * Math.pow(spanM, 3)) / (48 * E * I)) * 1000;
    const deflectionLimitMm = (spanM * 1000) / 360; // L/360 = 27.78 mm
    const deflectionRatio = deflectionMm > 0 ? (spanM * 1000) / deflectionMm : 9999;

    const maxMomentNm = (perGirderLoadN * spanM) / 4;
    const bendingStressMpa = ((maxMomentNm * cM) / I) / 1e6;
    const safetyFactor = bendingStressMpa > 0 ? mat.yieldMpa / bendingStressMpa : 999;

    const deflOk = deflectionMm <= deflectionLimitMm;
    const sfOk = safetyFactor >= 2.5;

    const verdict: 'pass' | 'warn' | 'fail' =
      deflOk && sfOk ? 'pass' : deflOk || sfOk ? 'warn' : 'fail';

    const verdictText =
      verdict === 'pass'
        ? 'Code Compliant (L/360 & SF ≥ 2.5)'
        : !sfOk
        ? 'Safety Factor Below 2.5'
        : 'Deflection Exceeds L/360';

    return {
      mat,
      spanM,
      deflectionMm,
      deflectionLimitMm,
      deflectionRatio,
      bendingStressMpa,
      safetyFactor,
      verdict,
      verdictText,
    };
  }, [bridgeMaterial, girderCount, girderInertiaE6, crowdLoadKn]);

  const activeMeta = PROBLEM_TABS.find((t) => t.id === activeProblem) ?? PROBLEM_TABS[0];

  const activeVerdict: 'pass' | 'warn' | 'fail' =
    activeProblem === 'solar'
      ? solarModel.verdict
      : activeProblem === 'pump'
      ? pumpModel.verdict
      : activeProblem === 'ev'
      ? evModel.verdict
      : activeProblem === 'thermal'
      ? thermalModel.verdict
      : bridgeModel.verdict;

  const activeVerdictText =
    activeProblem === 'solar'
      ? solarModel.verdictText
      : activeProblem === 'pump'
      ? pumpModel.verdictText
      : activeProblem === 'ev'
      ? evModel.verdictText
      : activeProblem === 'thermal'
      ? thermalModel.verdictText
      : bridgeModel.verdictText;

  const handleSaveCurrentCase = () => {
    const summaryMap: Record<ProblemId, { course: string; title: string; notes: string }> = {
      solar: {
        course: 'EE 240',
        title: 'Workshop Solar & Battery Sizing Design',
        notes: `${solarWatts}W PV + ${batteryKwh.toFixed(1)} kWh LiFePO4 (${solarModel.autonomyDays.toFixed(1)} days autonomy, $${solarModel.totalCost}) — ${solarModel.verdictText}.`,
      },
      pump: {
        course: 'CE 330',
        title: '6th-Floor Booster Pump & Pipe Audit',
        notes: `${pipeDiameterMm}mm ${pipeMaterial.toUpperCase()} pipe, ${pumpHeadM}m pump head -> ${pumpModel.deliveredKpa.toFixed(0)} kPa @ ${pumpModel.velocity.toFixed(2)} m/s — ${pumpModel.verdictText}.`,
      },
      ev: {
        course: 'ME 310',
        title: 'EV Mountain Commute Energy Budget',
        notes: `Cruise ${evSpeedKmh} km/h, ${evRegenPct}% regen -> ${evModel.totalTripKwh.toFixed(1)} kWh trip, ${evModel.remainingSocPct.toFixed(0)}% arrival SoC.`,
      },
      thermal: {
        course: 'ME 240',
        title: 'Lab Studio Thermal Cooling Load',
        notes: `${equipHeatW}W heat load at ${outdoorTempC}°C ambient, ${acCapacityKw.toFixed(1)} kW AC -> Eq. temp ${thermalModel.equilibriumTempC.toFixed(1)}°C.`,
      },
      bridge: {
        course: 'CE 301',
        title: '10m Footbridge Code Compliance Check',
        notes: `${girderCount}x ${bridgeModel.mat.name} girders (I=${girderInertiaE6}×10⁶ mm⁴) -> δ=${bridgeModel.deflectionMm.toFixed(1)} mm, SF=${bridgeModel.safetyFactor.toFixed(2)}×.`,
      },
    };

    const payload = summaryMap[activeProblem];
    onSaveToStudyLog({
      course: payload.course,
      title: payload.title,
      discipline: activeMeta.discipline,
      dueDate: '2026-12-04',
      notes: payload.notes,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <section
      id="real-life"
      className="py-12 lg:py-16 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Real-Life Engineering Problem Solver
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Apply first-principles math to practical field constraints—size power systems, pipe
              networks, EV trips, thermal cooling, and footbridges against real codes and budgets.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveCurrentCase}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Saved to Study Log
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                Save Design to Study Log
              </>
            )}
          </button>
        </div>

        {/* Scenario Selector */}
        <div
          role="tablist"
          aria-label="Real-life engineering cases"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl mb-6"
        >
          {PROBLEM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeProblem === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveProblem(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Visual & Problem Brief Stage */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {activeMeta.domain} · {activeMeta.discipline}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {activeProblem === 'solar' && 'Campus Robotics Shed Off-Grid Solar & Battery Design'}
                  {activeProblem === 'pump' && '6-Story Apartment Water Booster & Pipe Sizing'}
                  {activeProblem === 'ev' && '170 km Mountain Round-Trip EV Energy Budget'}
                  {activeProblem === 'thermal' && 'Enclosed 3D-Printing & Compute Room Cooling Audit'}
                  {activeProblem === 'bridge' && '10 m Campus Creek Pedestrian Footbridge Audit'}
                </h3>
              </div>

              <div className="shrink-0">
                {activeVerdict === 'pass' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    {activeVerdictText}
                  </span>
                )}
                {activeVerdict === 'warn' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    {activeVerdictText}
                  </span>
                )}
                {activeVerdict === 'fail' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                    {activeVerdictText}
                  </span>
                )}
              </div>
            </div>

            {/* Problem Brief */}
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeProblem === 'solar' &&
                'Design an off-grid LiFePO4 battery and solar PV system for a student workshop shed. Keep hardware cost within $6,500 while surviving a 2-day storm without dropping usable battery state-of-charge below 5%.'}
              {activeProblem === 'pump' &&
                'Morning peak demand on the 6th floor (18 m elevation) drops shower pressure. Size the pipe diameter and pump head to deliver at least 200 kPa at the 6th-floor manifold while keeping pipe water velocity at or below 2.4 m/s.'}
              {activeProblem === 'ev' &&
                'A student team drives an electric crossover (62 kWh usable pack) 85 km uphill (+1,100 m elevation) and back. Balance highway speed, payload, and regenerative braking recovery to arrive home with at least 20% SoC reserve.'}
              {activeProblem === 'thermal' &&
                'An enclosed 18 m² fabrication closet runs workstations and 3D printers continuously on a hot summer day. Size the wall insulation R-value and split AC cooling capacity so steady-state indoor temperature stays at or below 25 °C.'}
              {activeProblem === 'bridge' &&
                'A 10 m clear-span campus footbridge carries crowd loads across a creek. Select girder material, number of parallel beams, and cross-section inertia so midspan deflection stays under L/360 (27.8 mm) and safety factor stays at or above 2.5.'}
            </p>

            {/* Scenario-Specific SVG Visualization */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 overflow-x-auto">
              {activeProblem === 'solar' && (
                <svg viewBox="0 0 600 220" className="w-full h-auto min-w-[460px]" role="img" aria-label="7-day battery state of charge simulation with 2-day storm">
                  <line x1="48" y1="24" x2="48" y2="180" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                  <line x1="48" y1="180" x2="572" y2="180" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                  {/* Storm band Days 3-4 */}
                  <rect x={48 + (2 / 7) * 524} y="24" width={(2 / 7) * 524} height="156" className="fill-amber-500/10 dark:fill-amber-400/10" />
                  <text x={48 + (3 / 7) * 524} y="38" textAnchor="middle" className="fill-amber-700 dark:fill-amber-400 text-[10px] font-mono">
                    2-Day Storm (25% Sun)
                  </text>
                  {/* 20% reserve line */}
                  <line x1="48" y1={180 - 0.2 * 145} x2="572" y2={180 - 0.2 * 145} className="stroke-rose-500/50" strokeWidth="1" strokeDasharray="4 4" />
                  <path
                    d={solarModel.socTrace
                      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${(48 + (pt.day / 7) * 524).toFixed(1)} ${(180 - (pt.socPct / 100) * 145).toFixed(1)}`)
                      .join(' ')}
                    fill="none"
                    className="stroke-sky-600 dark:stroke-sky-400"
                    strokeWidth="2.8"
                  />
                  {solarModel.socTrace.map((pt) => (
                    <g key={pt.day}>
                      <circle
                        cx={48 + (pt.day / 7) * 524}
                        cy={180 - (pt.socPct / 100) * 145}
                        r="4"
                        className="fill-sky-600 dark:fill-sky-400"
                      />
                      <text x={48 + (pt.day / 7) * 524} y="198" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">
                        D{pt.day}
                      </text>
                    </g>
                  ))}
                  <text x="14" y="102" transform="rotate(-90 14 102)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">
                    Usable SoC [%]
                  </text>
                </svg>
              )}

              {activeProblem === 'pump' && (
                <svg viewBox="0 0 600 220" className="w-full h-auto min-w-[460px]" role="img" aria-label="6-story booster pump hydraulic elevation diagram">
                  {/* Building outline */}
                  <rect x="350" y="34" width="180" height="156" fill="none" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                  {[1, 2, 3, 4, 5, 6].map((fl) => (
                    <line key={fl} x1="350" y1={190 - fl * 25} x2="530" y2={190 - fl * 25} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  ))}
                  <text x="440" y="56" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[11px] font-mono font-semibold">
                    6th Floor (18 m)
                  </text>
                  <text x="440" y="74" textAnchor="middle" className="fill-sky-700 dark:fill-sky-400 text-[12px] font-mono font-semibold">
                    {pumpModel.deliveredKpa.toFixed(0)} kPa
                  </text>
                  {/* Ground Pump */}
                  <circle cx="90" cy="172" r="18" className="fill-white dark:fill-slate-900 stroke-sky-600 dark:stroke-sky-400" strokeWidth="2.5" />
                  <text x="90" y="176" textAnchor="middle" className="fill-slate-900 dark:fill-slate-100 text-[10px] font-mono font-semibold">
                    PUMP
                  </text>
                  {/* Pipe run */}
                  <polyline
                    points="108,172 325,172 325,46 375,46"
                    fill="none"
                    className="stroke-sky-600 dark:stroke-sky-400"
                    strokeWidth={Math.max(3, Math.min(10, pipeDiameterMm / 5))}
                    strokeLinejoin="round"
                  />
                  <text x="215" y="162" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono">
                    Ø{pipeDiameterMm} mm · v = {pumpModel.velocity.toFixed(2)} m/s
                  </text>
                  <text x="215" y="198" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">
                    Friction Loss h_f = {pumpModel.headLossM.toFixed(2)} m · Pump Head = {pumpHeadM} m
                  </text>
                </svg>
              )}

              {activeProblem === 'ev' && (
                <svg viewBox="0 0 600 220" className="w-full h-auto min-w-[460px]" role="img" aria-label="EV mountain round-trip elevation and battery energy profile">
                  <line x1="48" y1="180" x2="564" y2="180" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                  {/* Mountain elevation profile */}
                  <polygon
                    points="48,180 306,58 564,180"
                    className="fill-slate-200/70 dark:fill-slate-800/70 stroke-slate-400 dark:stroke-slate-600"
                    strokeWidth="1.5"
                  />
                  {/* Battery SoC line */}
                  <polyline
                    points={`48,42 306,${(42 + (evModel.outboundKwh / evModel.packCapacityKwh) * 138).toFixed(1)} 564,${Math.min(180, 42 + (evModel.totalTripKwh / evModel.packCapacityKwh) * 138).toFixed(1)}`}
                    fill="none"
                    className="stroke-sky-600 dark:stroke-sky-400"
                    strokeWidth="3"
                  />
                  <text x="54" y="34" className="fill-sky-700 dark:fill-sky-400 text-[11px] font-mono font-semibold">
                    Start: 100% SoC
                  </text>
                  <text x="306" y="48" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono">
                    Summit (+1,100 m · 85 km)
                  </text>
                  <text x="558" y="34" textAnchor="end" className="fill-slate-700 dark:fill-slate-200 text-[11px] font-mono font-semibold">
                    Return: {Math.max(0, evModel.remainingSocPct).toFixed(0)}% SoC
                  </text>
                </svg>
              )}

              {activeProblem === 'thermal' && (
                <svg viewBox="0 0 600 220" className="w-full h-auto min-w-[460px]" role="img" aria-label="6-hour room temperature transient curve">
                  <line x1="48" y1="24" x2="48" y2="180" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                  <line x1="48" y1="180" x2="572" y2="180" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
                  {/* 25 C comfort threshold */}
                  <line x1="48" y1={180 - ((25 - 15) / 25) * 150} x2="572" y2={180 - ((25 - 15) / 25) * 150} className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="1.5" strokeDasharray="5 4" />
                  <text x="568" y={174 - ((25 - 15) / 25) * 150} textAnchor="end" className="fill-emerald-700 dark:fill-emerald-400 text-[10px] font-mono">
                    25 °C Target Limit
                  </text>
                  <path
                    d={thermalModel.trace
                      .map((pt, idx) => {
                        const x = 48 + (pt.hr / 6) * 524;
                        const clampedT = Math.max(15, Math.min(40, pt.tempC));
                        const y = 180 - ((clampedT - 15) / 25) * 150;
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    className="stroke-amber-600 dark:stroke-amber-400"
                    strokeWidth="2.8"
                  />
                  {[0, 1, 2, 3, 4, 5, 6].map((h) => (
                    <text key={h} x={48 + (h / 6) * 524} y="198" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">
                      {h}h
                    </text>
                  ))}
                  <text x="14" y="102" transform="rotate(-90 14 102)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">
                    Indoor Temp [°C]
                  </text>
                </svg>
              )}

              {activeProblem === 'bridge' && (
                <svg viewBox="0 0 600 220" className="w-full h-auto min-w-[460px]" role="img" aria-label="10 meter creek footbridge deflection and girder check">
                  {/* Creek banks */}
                  <polygon points="10,160 85,160 115,205 10,205" className="fill-slate-200 dark:fill-slate-800" />
                  <polygon points="590,160 515,160 485,205 590,205" className="fill-slate-200 dark:fill-slate-800" />
                  {/* Water */}
                  <rect x="105" y="182" width="390" height="23" className="fill-sky-500/15 dark:fill-sky-400/15" />
                  {/* Neutral span line */}
                  <line x1="80" y1="145" x2="520" y2="145" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" strokeDasharray="4 4" />
                  {/* Deflected bridge curve */}
                  <path
                    d={`M 80 145 Q 300 ${145 + Math.min(34, bridgeModel.deflectionMm * 0.7)} 520 145`}
                    fill="none"
                    className="stroke-sky-600 dark:stroke-sky-400"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Midspan load arrow */}
                  <line x1="300" y1="72" x2="300" y2="132" className="stroke-rose-600 dark:stroke-rose-400" strokeWidth="2.5" />
                  <polygon points="300,138 294,126 306,126" className="fill-rose-600 dark:fill-rose-400" />
                  <text x="300" y="62" textAnchor="middle" className="fill-rose-700 dark:fill-rose-300 text-[12px] font-mono font-semibold">
                    Crowd Load = {crowdLoadKn} kN ({girderCount}× girders)
                  </text>
                  <text x="300" y="198" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono">
                    L/360 Code Limit = {bridgeModel.deflectionLimitMm.toFixed(1)} mm · Actual δ = {bridgeModel.deflectionMm.toFixed(1)} mm
                  </text>
                </svg>
              )}
            </div>

            {/* Key Quantitative Readout Strip */}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {activeProblem === 'solar' && (
                <>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Daily Harvest</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {solarModel.dailyHarvestKwh.toFixed(2)} kWh
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Autonomy</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {solarModel.autonomyDays.toFixed(2)} days
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Storm Min SoC</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {solarModel.minSocPct.toFixed(0)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Est. Cost</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      ${solarModel.totalCost.toLocaleString()}
                    </dd>
                  </div>
                </>
              )}

              {activeProblem === 'pump' && (
                <>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">6th Floor Press.</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {pumpModel.deliveredKpa.toFixed(0)} kPa
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Flow Velocity</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {pumpModel.velocity.toFixed(2)} m/s
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Friction Loss</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {pumpModel.headLossM.toFixed(2)} m
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Shaft Power</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {pumpModel.shaftPowerW.toFixed(0)} W
                    </dd>
                  </div>
                </>
              )}

              {activeProblem === 'ev' && (
                <>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Climb Leg</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {evModel.outboundKwh.toFixed(1)} kWh
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Descent Leg</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {evModel.returnKwh.toFixed(1)} kWh
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Arrival SoC</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {Math.max(0, evModel.remainingSocPct).toFixed(1)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Efficiency</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {evModel.avgWhPerKm.toFixed(0)} Wh/km
                    </dd>
                  </div>
                </>
              )}

              {activeProblem === 'thermal' && (
                <>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Equilibrium T</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {thermalModel.equilibriumTempC.toFixed(1)} °C
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Peak Heat Load</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {thermalModel.requiredKw.toFixed(2)} kW
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Required Cooling</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {Math.round(thermalModel.requiredBtuH).toLocaleString()} BTU/h
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">AC Installed</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {acCapacityKw.toFixed(1)} kW
                    </dd>
                  </div>
                </>
              )}

              {activeProblem === 'bridge' && (
                <>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Midspan δ</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {bridgeModel.deflectionMm.toFixed(1)} mm
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Span Ratio</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      L / {Math.round(bridgeModel.deflectionRatio)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Max Stress</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {bridgeModel.bendingStressMpa.toFixed(1)} MPa
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Safety Factor</dt>
                    <dd className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                      {bridgeModel.safetyFactor.toFixed(2)}×
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Right Design Decision Controls */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Design Variables & Constraints
              </h4>
              <button
                type="button"
                onClick={handleResetActive}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset Case
              </button>
            </div>

            {activeProblem === 'solar' && (
              <>
                <SliderField
                  id="sol-watts"
                  label="Solar PV Array Size"
                  valueLabel={`${solarWatts} Wp`}
                  min={600}
                  max={3600}
                  step={100}
                  value={solarWatts}
                  onChange={setSolarWatts}
                />
                <SliderField
                  id="sol-bat"
                  label="LiFePO4 Battery Bank"
                  valueLabel={`${batteryKwh.toFixed(1)} kWh`}
                  min={2}
                  max={16}
                  step={0.5}
                  value={batteryKwh}
                  onChange={setBatteryKwh}
                />
                <SliderField
                  id="sol-load"
                  label="Workshop Daily Load"
                  valueLabel={`${dailyLoadKwh.toFixed(1)} kWh/day`}
                  min={2}
                  max={10}
                  step={0.2}
                  value={dailyLoadKwh}
                  onChange={setDailyLoadKwh}
                />
                <SliderField
                  id="sol-sun"
                  label="Peak Sun Hours"
                  valueLabel={`${peakSunHours.toFixed(1)} h/day`}
                  min={2.5}
                  max={6.5}
                  step={0.1}
                  value={peakSunHours}
                  onChange={setPeakSunHours}
                />
                <SliderField
                  id="sol-auto"
                  label="Target Autonomy"
                  valueLabel={`${autonomyTargetDays.toFixed(1)} days`}
                  min={1.0}
                  max={3.0}
                  step={0.5}
                  value={autonomyTargetDays}
                  onChange={setAutonomyTargetDays}
                />
              </>
            )}

            {activeProblem === 'pump' && (
              <>
                <div>
                  <label htmlFor="pump-mat" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Pipe Material
                  </label>
                  <select
                    id="pump-mat"
                    value={pipeMaterial}
                    onChange={(e) => setPipeMaterial(e.target.value as 'pvc' | 'copper')}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="pvc">Schedule 40 PVC</option>
                    <option value="copper">Type L Drawn Copper</option>
                  </select>
                </div>
                <SliderField
                  id="pump-dia"
                  label="Pipe Inner Diameter"
                  valueLabel={`${pipeDiameterMm} mm`}
                  min={16}
                  max={52}
                  step={2}
                  value={pipeDiameterMm}
                  onChange={setPipeDiameterMm}
                />
                <SliderField
                  id="pump-head"
                  label="Booster Pump Head"
                  valueLabel={`${pumpHeadM} m`}
                  min={25}
                  max={65}
                  step={1}
                  value={pumpHeadM}
                  onChange={setPumpHeadM}
                />
                <SliderField
                  id="pump-flow"
                  label="Peak Demand Flow Rate"
                  valueLabel={`${flowLpm} L/min`}
                  min={15}
                  max={90}
                  step={5}
                  value={flowLpm}
                  onChange={setFlowLpm}
                />
                <SliderField
                  id="pump-len"
                  label="Total Pipe Run Length"
                  valueLabel={`${pipeLengthM} m`}
                  min={24}
                  max={90}
                  step={2}
                  value={pipeLengthM}
                  onChange={setPipeLengthM}
                />
              </>
            )}

            {activeProblem === 'ev' && (
              <>
                <SliderField
                  id="ev-speed"
                  label="Highway Cruising Speed"
                  valueLabel={`${evSpeedKmh} km/h`}
                  min={65}
                  max={130}
                  step={5}
                  value={evSpeedKmh}
                  onChange={setEvSpeedKmh}
                />
                <SliderField
                  id="ev-payload"
                  label="Passengers & Gear Mass"
                  valueLabel={`${evPayloadKg} kg`}
                  min={75}
                  max={450}
                  step={15}
                  value={evPayloadKg}
                  onChange={setEvPayloadKg}
                />
                <SliderField
                  id="ev-wind"
                  label="Outbound Headwind"
                  valueLabel={`${evHeadwindKmh} km/h`}
                  min={0}
                  max={45}
                  step={5}
                  value={evHeadwindKmh}
                  onChange={setEvHeadwindKmh}
                />
                <SliderField
                  id="ev-regen"
                  label="Regen Braking Recovery"
                  valueLabel={`${evRegenPct}%`}
                  min={20}
                  max={85}
                  step={5}
                  value={evRegenPct}
                  onChange={setEvRegenPct}
                />
              </>
            )}

            {activeProblem === 'thermal' && (
              <>
                <SliderField
                  id="thm-equip"
                  label="Equipment Heat Generation"
                  valueLabel={`${equipHeatW} W`}
                  min={400}
                  max={2200}
                  step={50}
                  value={equipHeatW}
                  onChange={setEquipHeatW}
                />
                <SliderField
                  id="thm-out"
                  label="Outdoor Summer Temp"
                  valueLabel={`${outdoorTempC} °C`}
                  min={24}
                  max={44}
                  step={1}
                  value={outdoorTempC}
                  onChange={setOutdoorTempC}
                />
                <SliderField
                  id="thm-rval"
                  label="Wall & Glazing R-Value"
                  valueLabel={`${wallRValue.toFixed(1)} m²·K/W`}
                  min={0.8}
                  max={5.0}
                  step={0.2}
                  value={wallRValue}
                  onChange={setWallRValue}
                />
                <SliderField
                  id="thm-ac"
                  label="Cooling Unit Capacity"
                  valueLabel={`${acCapacityKw.toFixed(1)} kW`}
                  min={0.8}
                  max={4.5}
                  step={0.1}
                  value={acCapacityKw}
                  onChange={setAcCapacityKw}
                />
              </>
            )}

            {activeProblem === 'bridge' && (
              <>
                <div>
                  <label htmlFor="brg-mat" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Girder Material
                  </label>
                  <select
                    id="brg-mat"
                    value={bridgeMaterial}
                    onChange={(e) => setBridgeMaterial(e.target.value as 'steel' | 'timber' | 'aluminum')}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="steel">ASTM A992 Steel (200 GPa)</option>
                    <option value="aluminum">6061-T6 Aluminum (68.9 GPa)</option>
                    <option value="timber">Glulam Timber (12.4 GPa)</option>
                  </select>
                </div>
                <SliderField
                  id="brg-girders"
                  label="Parallel Girders"
                  valueLabel={`${girderCount} beams`}
                  min={2}
                  max={6}
                  step={1}
                  value={girderCount}
                  onChange={setGirderCount}
                />
                <SliderField
                  id="brg-inertia"
                  label="Girder Moment of Inertia I"
                  valueLabel={`${girderInertiaE6} × 10⁶ mm⁴`}
                  min={16}
                  max={140}
                  step={4}
                  value={girderInertiaE6}
                  onChange={setGirderInertiaE6}
                />
                <SliderField
                  id="brg-load"
                  label="Peak Midspan Crowd Load"
                  valueLabel={`${crowdLoadKn} kN`}
                  min={10}
                  max={50}
                  step={2}
                  value={crowdLoadKn}
                  onChange={setCrowdLoadKn}
                />
              </>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {activeProblem === 'solar' &&
                'Tip: Increasing PV wattage fixes daily energy deficits, while battery kWh extends multi-day storm autonomy.'}
              {activeProblem === 'pump' &&
                'Tip: Head loss scales inversely with D⁵ (Darcy-Weisbach). Stepping up one pipe size sharply reduces friction.'}
              {activeProblem === 'ev' &&
                'Tip: Aerodynamic drag grows with v². Dropping highway speed from 120 to 95 km/h cuts aero losses by ~37%.'}
              {activeProblem === 'thermal' &&
                'Tip: Total cooling load equals internal electronics heat plus conductive heat gain through the enclosure.'}
              {activeProblem === 'bridge' &&
                'Tip: Timber requires significantly larger section inertia I than steel to meet the L/360 stiffness limit.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface SliderFieldProps {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}

const SliderField: React.FC<SliderFieldProps> = ({
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
