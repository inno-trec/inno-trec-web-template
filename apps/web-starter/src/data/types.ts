/**
 * The shapes of the data the backend sends. They are examples: replace them with the types of your
 * own backend (if it publishes an OpenAPI description, `npx openapi-typescript <url> -o src/data/schema.d.ts`
 * generates them). Conventions the pages expect: instants as ISO strings in UTC, the community's IANA
 * time zone in every response with times, the unit in each field name, and `null` (never 0) for missing data.
 */

/* ---------- Energy ---------- */

export type EnergyPeriod = 'today' | 'last7days' | 'last30days';

/** Power in kW at one instant, state of charge in %. */
export interface ReadingDto {
  time: string;
  consumptionKw: number | null;
  pvKw: number | null;
  storageKw: number | null;
  gridKw: number | null;
  storageSocPct: number | null;
  estimated: boolean;
}

/** Energy of one hour (period `today`) or one day (longer periods). */
export interface EnergyRowDto {
  time: string;
  consumptionKwh: number | null;
  pvKwh: number | null;
  storageKwh: number | null;
  gridKwh: number | null;
  missingReadings: number;
}

export interface EnergyReportDto {
  timeZone: string;
  from: string;
  to: string;
  resolutionMinutes: number;
  readings: ReadingDto[];
  rowUnit: 'hour' | 'day';
  rows: EnergyRowDto[];
  totals: { consumptionKwh: number; pvKwh: number; gridImportKwh: number; selfConsumptionPct: number };
}

/* ---------- PV performance ---------- */

export type PerformancePeriod = 'last30days' | 'last12months';

export interface Indicator {
  value: number | null;
  unit: '%' | 'kWh/kWp';
  historicalReference: number | null;
  communityReference: number | null;
  status: 'normal' | 'below_normal' | 'unknown';
}

export interface SystemPerformance {
  assetId: string;
  name: string;
  peakPowerKwp: number;
  performanceRatio: Indicator;
  availability: Indicator;
  specificYield: Indicator;
  efficiency: Indicator;
}

export interface PvPerformanceReport {
  timeZone: string;
  from: string;
  to: string;
  systems: SystemPerformance[];
  community: {
    performanceRatioPct: number | null;
    availabilityPct: number | null;
    specificYieldKwhPerKwp: number | null;
    efficiencyPct: number | null;
  };
}

/* ---------- Data checks ---------- */

export interface SourceComparisonDto {
  source: string;
  label: string;
  energyKwh: number | null;
  coveragePct: number;
  deviationPct: number | null;
  status: 'within_tolerance' | 'outside_tolerance' | 'missing';
  deviations: Array<{ time: string; deviationPct: number | null }>;
}

export interface QuantityCheckDto {
  quantity: 'consumption' | 'pv' | 'storage' | 'grid';
  referenceSource: string;
  referenceLabel: string;
  referenceEnergyKwh: number | null;
  tolerancePct: number;
  comparisons: SourceComparisonDto[];
}

export interface SourceCheckReportDto {
  timeZone: string;
  from: string;
  to: string;
  quantities: QuantityCheckDto[];
}

/* ---------- Alerts and assets ---------- */

export interface Alert {
  id: string;
  kind: 'corrective' | 'predictive';
  severity: 'info' | 'warning' | 'critical';
  state: 'new' | 'acknowledged' | 'resolved';
  assetId: string;
  assetName: string;
  title: string;
  text: string;
  raisedAt: string;
  indicator?: { name: string; value: number; reference: number; unit: string };
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
  resolution?: string | null;
  /** Files attached when the alert was resolved. */
  photos?: Array<{ name: string; sizeBytes: number }>;
}

/** Which alerts a list shows. `open` means new and acknowledged. */
export type AlertShow = 'open' | 'new' | 'acknowledged' | 'resolved' | 'all';

export interface AlertQuery {
  show: AlertShow;
  kind: 'all' | Alert['kind'];
  /** Starts at 1. */
  page: number;
  pageSize: number;
}

/** One page of alerts, newest first. `total` counts the alerts that match; `counts` gives each `show` for the same kind. */
export interface AlertPageDto {
  alerts: Alert[];
  total: number;
  counts: Record<AlertShow, number>;
}

export interface Asset {
  id: string;
  name: string;
  type: 'pv_system' | 'inverter' | 'battery' | 'meter';
  site: string;
  status: 'running' | 'attention' | 'fault' | 'offline';
  dataQuality: 'CERTIFIED' | 'MEASURED' | 'ESTIMATED' | 'MANUAL';
  ratings: Array<{ value: number; unit: 'kW' | 'kWh' | 'kWp' | '%' }>;
  installedOn: string;
  lastReadingAt: string | null;
  openAlerts: Alert[];
}

/* ---------- Users and accounts ---------- */

export type RoleId = 'viewer' | 'technician' | 'manager' | 'admin';

export interface Role {
  id: RoleId;
  label: string;
  description: string;
}

/** `requested`: the person created an account and waits for a manager to approve it. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  status: 'requested' | 'invited' | 'active' | 'deactivated';
  lastActiveAt: string | null;
  accessUntil: string | null;
  emailAlerts: boolean;
  note: string;
  /** What the person wrote when they asked for an account. */
  requestMessage?: string;
}

export interface Invitation {
  name: string;
  email: string;
  role: RoleId;
  sendEmail: boolean;
}

export interface UserChanges {
  role?: RoleId;
  accessUntil?: string | null;
  emailAlerts?: boolean;
  note?: string;
  status?: 'active' | 'deactivated';
}

/** The person who is signed in. */
export interface Session {
  userId: string;
  name: string;
  email: string;
  role: RoleId;
  roleLabel: string;
}
