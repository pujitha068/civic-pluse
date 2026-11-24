export type SocietalScenarioId = 'air' | 'water' | 'ems' | 'cleangrid';

export interface SocietalScenarioSpec {
  id: SocietalScenarioId;
  indexLabel: string;
  title: string;
  sector: string;
  authorityRef: string;
  crisisLabel: string;
  brief: string;
  targetSummary: string;
  governingModel: string;
}

export const SOCIETAL_SCENARIOS: SocietalScenarioSpec[] = [
  {
    id: 'air',
    indexLabel: '01. Urban Air & Heat',
    title: 'Urban Air Quality & Heat-Island Mitigation',
    sector: 'Public Health',
    authorityRef: 'WHO Air Quality & Heat Safety Guidelines',
    crisisLabel: 'Trigger Rush-Hour Inversion',
    brief:
      'Stagnant afternoon air and commuter exhaust push neighborhood PM2.5 and heat index into hazardous levels for children and seniors. Shift transit to electric fleets, expand cool-canopy albedo, and tighten industrial filtration to restore safe breathing.',
    targetSummary: 'PM2.5 ≤ 25 µg/m³ · Heat ≤ 32 °C',
    governingModel: 'dC/dt = E_traffic(1 - η_ev) + E_ind(1 - η_filt) - k_disp·C',
  },
  {
    id: 'water',
    indexLabel: '02. Clean Water Network',
    title: 'Municipal Clean Water Leak & Pressure Balancer',
    sector: 'Water Security',
    authorityRef: 'Municipal Non-Revenue Water Standard',
    crisisLabel: 'Trigger Main Pipe Rupture',
    brief:
      'A ruptured arterial main drops tap pressure for clinics and wastes treated drinking water. Isolate the damaged valve segment, regulate Pressure-Reducing Valves (PRV), and stage clean backup pumps to stabilize supply.',
    targetSummary: 'Pressure 260–340 kPa · Loss ≤ 8%',
    governingModel: 'Q_leak = C_d · A_burst · √(2g · H_zone)   |   P_out = P_in - ΔP_prv',
  },
  {
    id: 'ems',
    indexLabel: '03. Emergency Dispatch',
    title: 'Ambulance Dispatch & Hospital ER Load Balancing',
    sector: 'Healthcare Access',
    authorityRef: 'EMS 8-Minute Golden Response Benchmark',
    crisisLabel: 'Trigger Multi-Incident Surge',
    brief:
      'A highway collision combined with seasonal respiratory admissions saturates the central emergency room, delaying ambulances. Stage forward EMS units, enable regional hospital diversion, and expand tele-triage fast-track.',
    targetSummary: 'Response ≤ 8.0 min · ER Load < 85%',
    governingModel: 'T_resp = T_dispatch + d_avg(N_units) / v_ems + T_offload(ρ_ER)',
  },
  {
    id: 'cleangrid',
    indexLabel: '04. Clean Energy Grid',
    title: 'Evening Peak Blackout Prevention & Clean Dispatch',
    sector: 'Climate & Energy',
    authorityRef: 'Community Microgrid Reliability Standard',
    crisisLabel: 'Trigger Heatwave Duck-Curve',
    brief:
      'As sunset reduces rooftop solar output during an evening heatwave, air-conditioning demand threatens rolling neighborhood blackouts. Dispatch community batteries, smart thermostat demand-response, and clean hydro reserves.',
    targetSummary: 'Freq 59.90–60.10 Hz · Blackout Risk 0%',
    governingModel: 'P_net = P_solar + P_batt + P_hydro - P_demand(1 - DR%)',
  },
];

export interface AirControls {
  evTransitPct: number; // 10..95
  canopyAlbedoPct: number; // 15..85
  filtrationPct: number; // 20..95
}

export interface WaterControls {
  valveIsolationPct: number; // 0..100
  prvTargetKpa: number; // 220..380
  backupPumpLps: number; // 0..140
}

export interface EmsControls {
  stagedUnits: number; // 4..20
  diversionPct: number; // 0..60
  teleTriagePct: number; // 5..45
}

export interface CleanGridControls {
  batteryDispatchMw: number; // 0..180
  demandResponsePct: number; // 0..35
  hydroReserveMw: number; // 20..160
}

export interface SocietalTelemetryFrame {
  t: number;
  primary: number;
  secondary: number;
  tertiary: number;
  status: 'nominal' | 'warning' | 'critical';
  statusLabel: string;
}

export interface SocietalVerificationResult {
  scenarioId: SocietalScenarioId;
  passed: boolean;
  timestamp: string;
  headline: string;
  checks: { label: string; actual: string; target: string; ok: boolean }[];
}

export type CivicIssueCategory =
  | 'Air & Heat'
  | 'Water & Sanitation'
  | 'Emergency & Safety'
  | 'Power & Outage';

export type CivicSeverity = 'Advisory' | 'Urgent' | 'Critical';

export interface CommunityReport {
  id: string;
  zone: string;
  category: CivicIssueCategory;
  severity: CivicSeverity;
  title: string;
  actionNote: string;
  status: 'Open' | 'Dispatched' | 'Resolved';
  reportedAt: string;
}

export const INITIAL_COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: 'rep-101',
    zone: 'District 4 · Riverfront School Corridor',
    category: 'Air & Heat',
    severity: 'Urgent',
    title: 'Afternoon PM2.5 spike near freight arterial crossing',
    actionNote: 'Reroute diesel delivery trucks onto bypass corridor and open misting shelter.',
    status: 'Dispatched',
    reportedAt: '16:40',
  },
  {
    id: 'rep-102',
    zone: 'District 2 · Cedar Clinic Main',
    category: 'Water & Sanitation',
    severity: 'Critical',
    title: 'Pressure drop reported along 12-inch hospital feeder line',
    actionNote: 'Isolate sector valve B-4 and boost PRV setpoint to 300 kPa.',
    status: 'Open',
    reportedAt: '17:05',
  },
  {
    id: 'rep-103',
    zone: 'District 7 · Senior Housing Complex',
    category: 'Power & Outage',
    severity: 'Advisory',
    title: 'Peak AC load approaching feeder transformer warning limit',
    actionNote: 'Enroll 140 smart thermostats in 18% evening demand-response window.',
    status: 'Resolved',
    reportedAt: '15:20',
  },
];
