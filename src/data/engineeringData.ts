export type SandboxId = 'beam' | 'rlc' | 'projectile' | 'pid';

export interface EngineeringMaterial {
  id: string;
  name: string;
  spec: string;
  youngsModulusGPa: number;
  yieldStrengthMPa: number;
  densityKgM3: number;
  poissonsRatio: number;
  notes: string;
}

export const ENGINEERING_MATERIALS: EngineeringMaterial[] = [
  {
    id: 'steel-a992',
    name: 'Structural Steel',
    spec: 'ASTM A992 Grade 50',
    youngsModulusGPa: 200,
    yieldStrengthMPa: 345,
    densityKgM3: 7850,
    poissonsRatio: 0.26,
    notes: 'Standard wide-flange building and bridge frame alloy.',
  },
  {
    id: 'al-6061',
    name: 'Aluminum Alloy',
    spec: '6061-T6 Extruded',
    youngsModulusGPa: 68.9,
    yieldStrengthMPa: 276,
    densityKgM3: 2700,
    poissonsRatio: 0.33,
    notes: 'High strength-to-weight aerospace and robotics chassis alloy.',
  },
  {
    id: 'ti-6al4v',
    name: 'Titanium Alloy',
    spec: 'Ti-6Al-4V Grade 5',
    youngsModulusGPa: 113.8,
    yieldStrengthMPa: 880,
    densityKgM3: 4430,
    poissonsRatio: 0.34,
    notes: 'High fatigue resistance for turbine, medical, and flight hardware.',
  },
  {
    id: 'douglas-fir',
    name: 'Structural Timber',
    spec: 'Douglas Fir Select',
    youngsModulusGPa: 13.1,
    yieldStrengthMPa: 48,
    densityKgM3: 530,
    poissonsRatio: 0.29,
    notes: 'Orthotropic light-frame beam benchmark (parallel to grain).',
  },
];

export type FormulaDiscipline =
  | 'Statics & Solids'
  | 'Circuits & Signals'
  | 'Fluids & Thermo'
  | 'Dynamics & Control';

export interface EngineeringFormula {
  id: string;
  title: string;
  discipline: FormulaDiscipline;
  courseTag: string;
  expression: string;
  variables: string;
  context: string;
  relatedSandbox?: SandboxId;
}

export const ENGINEERING_FORMULAS: EngineeringFormula[] = [
  {
    id: 'euler-bernoulli-stress',
    title: 'Flexural Bending Stress',
    discipline: 'Statics & Solids',
    courseTag: 'ME 212 · Mechanics of Materials',
    expression: 'σ_max = (M_max · c) / I',
    variables: 'M_max: peak moment (N·m) · c: extreme fiber distance (m) · I: area moment of inertia (m⁴)',
    context: 'Valid for slender beams in pure linear-elastic bending before local flange buckling.',
    relatedSandbox: 'beam',
  },
  {
    id: 'cantilever-deflection',
    title: 'Cantilever Point-Load Deflection',
    discipline: 'Statics & Solids',
    courseTag: 'CE 301 · Structural Analysis',
    expression: 'δ_max = (P · a² · (3L - a)) / (6 · E · I)',
    variables: 'P: point load (N) · a: load position (m) · L: beam span (m) · E: Young’s modulus (Pa)',
    context: 'Gives tip deflection at x = L when load P acts at distance a from the fixed wall.',
    relatedSandbox: 'beam',
  },
  {
    id: 'euler-buckling',
    title: 'Euler Critical Buckling Load',
    discipline: 'Statics & Solids',
    courseTag: 'ME 212 · Column Stability',
    expression: 'P_cr = (π² · E · I) / (K · L)²',
    variables: 'K: effective length factor (1.0 pinned-pinned, 2.0 fixed-free) · L: unsupported length (m)',
    context: 'Predicts elastic column instability for slenderness ratios above the transition threshold.',
  },
  {
    id: 'rlc-resonance',
    title: 'RLC Natural Resonant Frequency',
    discipline: 'Circuits & Signals',
    courseTag: 'EE 201 · Linear Circuits',
    expression: 'f_0 = 1 / (2π · √(L · C))',
    variables: 'L: inductance (H) · C: capacitance (F) · f_0: frequency where X_L = X_C (Hz)',
    context: 'At resonance, reactive impedance cancels completely and source current is limited purely by R.',
    relatedSandbox: 'rlc',
  },
  {
    id: 'rlc-quality',
    title: 'Series RLC Quality Factor & Damping',
    discipline: 'Circuits & Signals',
    courseTag: 'EE 201 · Frequency Response',
    expression: 'Q = (1 / R) · √(L / C)   |   ζ = (R / 2) · √(C / L)',
    variables: 'Q: selectivity factor · ζ: damping ratio (ζ < 1 underdamped, ζ = 1 critical)',
    context: 'Determines filter bandwidth Δf = f_0 / Q and transient ringing decay envelope.',
    relatedSandbox: 'rlc',
  },
  {
    id: 'nyquist-shannon',
    title: 'Nyquist Sampling Theorem',
    discipline: 'Circuits & Signals',
    courseTag: 'EE 310 · Signal Processing',
    expression: 'f_s ≥ 2 · f_max',
    variables: 'f_s: ADC sampling rate (Hz) · f_max: highest signal harmonic component (Hz)',
    context: 'Minimum sampling cadence required to reconstruct band-limited signals without aliasing.',
  },
  {
    id: 'bernoulli-incompressible',
    title: 'Steady Incompressible Bernoulli Equation',
    discipline: 'Fluids & Thermo',
    courseTag: 'ME 330 · Fluid Mechanics',
    expression: 'P₁ + ½ρv₁² + ρgz₁ = P₂ + ½ρv₂² + ρgz₂',
    variables: 'P: static pressure (Pa) · ρ: fluid density (kg/m³) · v: flow speed (m/s) · z: elevation (m)',
    context: 'Conserves mechanical energy along a frictionless, steady streamline at low Mach numbers.',
  },
  {
    id: 'reynolds-number',
    title: 'Pipe Flow Reynolds Number',
    discipline: 'Fluids & Thermo',
    courseTag: 'ME 330 · Internal Flow',
    expression: 'Re = (ρ · v · D) / μ = (v · D) / ν',
    variables: 'D: hydraulic diameter (m) · μ: dynamic viscosity (Pa·s) · ν: kinematic viscosity (m²/s)',
    context: 'Laminar flow holds for Re < 2300 in circular ducts; fully turbulent above Re > 4000.',
  },
  {
    id: 'ideal-gas-otto',
    title: 'Ideal Gas & Isentropic Relation',
    discipline: 'Fluids & Thermo',
    courseTag: 'ME 240 · Thermodynamics',
    expression: 'P · V = n · R_u · T   |   T₂ / T₁ = (V₁ / V₂)^(γ - 1)',
    variables: 'R_u: 8.314 J/(mol·K) · γ: specific heat ratio c_p / c_v (1.40 for dry air)',
    context: 'Core state law and reversible adiabatic compression scaling for gas cycles.',
  },
  {
    id: 'quadratic-drag',
    title: 'Aerodynamic Quadratic Drag Force',
    discipline: 'Dynamics & Control',
    courseTag: 'AE 204 · Flight Dynamics',
    expression: 'F_d = ½ · ρ · v² · C_d · A',
    variables: 'ρ: ambient density (kg/m³) · C_d: drag coefficient · A: frontal reference area (m²)',
    context: 'Opposes instantaneous velocity vector v̂; governs terminal velocity and range decay.',
    relatedSandbox: 'projectile',
  },
  {
    id: 'pid-control-law',
    title: 'Continuous-Time PID Control Law',
    discipline: 'Dynamics & Control',
    courseTag: 'ME 360 · Feedback Control',
    expression: 'u(t) = K_p·e(t) + K_i·∫e(τ)dτ + K_d·(de/dt)',
    variables: 'e(t) = r(t) - y(t): tracking error · K_p, K_i, K_d: proportional, integral, derivative gains',
    context: 'Balances rise speed, zero steady-state offset, and phase lead damping against overshoot.',
    relatedSandbox: 'pid',
  },
  {
    id: 'second-order-overshoot',
    title: 'Second-Order Percent Overshoot',
    discipline: 'Dynamics & Control',
    courseTag: 'ME 360 · System Response',
    expression: '%OS = 100 · exp(-π · ζ / √(1 - ζ²))',
    variables: 'ζ: closed-loop damping ratio (0 < ζ < 1)',
    context: 'A damping ratio of ζ = 0.707 yields 4.3% overshoot with optimal 2% settling speed.',
    relatedSandbox: 'pid',
  },
];

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

export interface UnitCategory {
  id: string;
  name: string;
  units: UnitDefinition[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'stress',
    name: 'Stress & Pressure',
    units: [
      { id: 'pa', label: 'Pascal', symbol: 'Pa', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kpa', label: 'Kilopascal', symbol: 'kPa', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'mpa', label: 'Megapascal', symbol: 'MPa', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'gpa', label: 'Gigapascal', symbol: 'GPa', toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
      { id: 'bar', label: 'Bar', symbol: 'bar', toBase: (v) => v * 1e5, fromBase: (v) => v / 1e5 },
      { id: 'psi', label: 'Pounds per sq. inch', symbol: 'psi', toBase: (v) => v * 6894.757, fromBase: (v) => v / 6894.757 },
      { id: 'ksi', label: 'Kilopounds per sq. inch', symbol: 'ksi', toBase: (v) => v * 6894757, fromBase: (v) => v / 6894757 },
      { id: 'atm', label: 'Standard Atmosphere', symbol: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
    ],
  },
  {
    id: 'force',
    name: 'Force',
    units: [
      { id: 'n', label: 'Newton', symbol: 'N', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kn', label: 'Kilonewton', symbol: 'kN', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'lbf', label: 'Pound-force', symbol: 'lbf', toBase: (v) => v * 4.448222, fromBase: (v) => v / 4.448222 },
      { id: 'kip', label: 'Kilopound-force', symbol: 'kip', toBase: (v) => v * 4448.222, fromBase: (v) => v / 4448.222 },
      { id: 'kgf', label: 'Kilogram-force', symbol: 'kgf', toBase: (v) => v * 9.80665, fromBase: (v) => v / 9.80665 },
    ],
  },
  {
    id: 'torque',
    name: 'Torque & Moment',
    units: [
      { id: 'nm', label: 'Newton-meter', symbol: 'N·m', toBase: (v) => v, fromBase: (v) => v },
      { id: 'knm', label: 'Kilonewton-meter', symbol: 'kN·m', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'lbft', label: 'Pound-foot', symbol: 'lbf·ft', toBase: (v) => v * 1.355818, fromBase: (v) => v / 1.355818 },
      { id: 'lbin', label: 'Pound-inch', symbol: 'lbf·in', toBase: (v) => v * 0.1129848, fromBase: (v) => v / 0.1129848 },
    ],
  },
  {
    id: 'power',
    name: 'Power',
    units: [
      { id: 'w', label: 'Watt', symbol: 'W', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kw', label: 'Kilowatt', symbol: 'kW', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'hp', label: 'Mechanical Horsepower', symbol: 'hp', toBase: (v) => v * 745.6999, fromBase: (v) => v / 745.6999 },
      { id: 'btuh', label: 'BTU per hour', symbol: 'BTU/h', toBase: (v) => v * 0.2930711, fromBase: (v) => v / 0.2930711 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy & Work',
    units: [
      { id: 'j', label: 'Joule', symbol: 'J', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kj', label: 'Kilojoule', symbol: 'kJ', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'wh', label: 'Watt-hour', symbol: 'Wh', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'kwh', label: 'Kilowatt-hour', symbol: 'kWh', toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
      { id: 'btu', label: 'British Thermal Unit', symbol: 'BTU', toBase: (v) => v * 1055.056, fromBase: (v) => v / 1055.056 },
      { id: 'ev', label: 'Electronvolt', symbol: 'eV', toBase: (v) => v * 1.602176634e-19, fromBase: (v) => v / 1.602176634e-19 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      { id: 'c', label: 'Celsius', symbol: '°C', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
      { id: 'k', label: 'Kelvin', symbol: 'K', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', label: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (v) => ((v - 273.15) * 9) / 5 + 32 },
      { id: 'r', label: 'Rankine', symbol: '°R', toBase: (v) => (v * 5) / 9, fromBase: (v) => (v * 9) / 5 },
    ],
  },
];

export interface StudyLogItem {
  id: string;
  course: string;
  title: string;
  discipline: FormulaDiscipline;
  dueDate: string;
  notes: string;
  completed: boolean;
}

export const INITIAL_STUDY_LOG: StudyLogItem[] = [
  {
    id: 'log-1',
    course: 'ME 212',
    title: 'Cantilever Strain Gauge Lab Report',
    discipline: 'Statics & Solids',
    dueDate: '2026-11-26',
    notes: 'Compare measured 6061-T6 tip deflection against Euler-Bernoulli model at 15 kN load.',
    completed: false,
  },
  {
    id: 'log-2',
    course: 'EE 201',
    title: 'Series RLC Bode Sweep Pre-Lab',
    discipline: 'Circuits & Signals',
    dueDate: '2026-11-28',
    notes: 'Verify resonant peak f_0 = 159.2 Hz with 100 mH inductor and 10 uF film capacitor.',
    completed: false,
  },
  {
    id: 'log-3',
    course: 'ME 360',
    title: 'PID Motor Velocity Tuning Checkoff',
    discipline: 'Dynamics & Control',
    dueDate: '2026-11-30',
    notes: 'Keep overshoot below 10% and settling time under 2.5 s without integrator windup.',
    completed: true,
  },
];
