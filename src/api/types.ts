// TypeScript mirrors of the Phase 2 backend JSON responses (snake_case).

export type AssetStatus =
  | 'Active'
  | 'Available'
  | 'Idle'
  | 'Overdue'
  | 'Unknown'
  | string;

export type RentalStatus =
  | 'Active'
  | 'Completed'
  | 'Extended'
  | 'Overdue'
  | string;

export interface Site {
  site_id: string;
  site_name: string;
  site_type: string;
  latitude: number;
  longitude: number;
}

export interface Operator {
  operator_id: string;
  operator_name: string;
  primary_site_id: string;
}

export interface Asset {
  equipment_id: string;
  equipment_type: string;
  model: string;
  current_site_id: string | null;
  status: AssetStatus;
  condition_score: number;
}

export interface Telemetry {
  asset_id: string;
  timestamp: string;
  engine_hours: number;
  idle_hours: number;
  fuel_used_l: number;
  engine_temp_c: number;
  latitude: number;
  longitude: number;
}

export interface EventItem {
  event_id: string;
  event_type: string;
  severity: string;
  resolution_status: string;
  timestamp: string;
}

export interface Rental {
  rental_id: string;
  equipment_id: string;
  type: string;
  customer_id: string;
  site_id: string;
  operator_id: string;
  check_out: string;
  expected_return: string;
  check_in: string | null;
  rental_status: RentalStatus;
}

export interface AssetDetail extends Asset {
  current_rental: Rental | null;
  latest_telemetry: Telemetry | null;
  latest_events: EventItem[];
}

export interface Usage {
  equipment_id: string;
  record_count: number;
  engine_hours: number;
  idle_hours: number;
  operating_hours: number;
  idle_ratio: number | null;
  utilization: number | null;
}

export interface UsageBreakdown {
  equipment_type?: string;
  site_id?: string;
  record_count: number;
  engine_hours: number;
  idle_hours: number;
  operating_hours: number;
  idle_ratio: number | null;
  utilization: number | null;
}

export interface UsageSummary {
  total_engine_hours: number;
  total_idle_hours: number;
  operating_hours: number;
  idle_ratio: number | null;
  utilization: number | null;
  telemetry_records: number;
  by_equipment_type: UsageBreakdown[];
  by_site: UsageBreakdown[];
}

export interface HistoryItem {
  type: string;
  date: string;
  data: Record<string, unknown>;
}

export interface CheckoutRequest {
  equipment_id: string;
  site_id: string;
  operator_id: string;
  customer_id?: string;
  expected_return: string;
}

export interface CheckinRequest {
  check_in?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export type AlertStatus = 'open' | 'acknowledged' | string;

export type AlertCategory =
  | 'Overdue'
  | 'Unassigned'
  | 'Excessive Idle'
  | 'Abnormal Usage'
  | 'Condition Risk'
  | 'Operational'
  | string;

export interface Alert {
  alert_id: string;
  asset_id: string;
  equipment_type: string;
  site_id: string | null;
  category: AlertCategory;
  severity: string;
  timestamp: string;
  explanation: string;
  status: AlertStatus;
  recommended_action: string;
}

// ---------------------------------------------------------------------------
// Phase 5 — AI decision support
// ---------------------------------------------------------------------------
export interface DemandHistoryPoint {
  date: string;
  demand: number;
}

export interface DemandForecast {
  site_id: string;
  site_name: string;
  equipment_type: string;
  horizon_days: number;
  reference_date: string;
  predicted_demand: number;
  recent_average: number;
  trend: number;
  confidence: string;
  currently_available: number;
  currently_rented: number;
  becoming_available: number;
  expected_available: number;
  fleet_total: number;
  fleet_available: number;
  demand_gap: number;
  status: string;
  explanation: string;
  history: DemandHistoryPoint[];
}

export interface Anomaly {
  anomaly_id: string;
  equipment_id: string;
  equipment_type: string;
  site: string | null;
  severity: string;
  anomaly_type: string;
  reference_period: string | null;
  score: number | null;
  explanation: string;
  recommended_action: string;
}

export interface Recommendation {
  rank: number;
  equipment_id: string;
  equipment_type: string;
  current_site: string | null;
  condition_score: number;
  utilization: number | null;
  availability_status: string;
  recommendation_score: number;
  reasons: string[];
}

export interface Impact {
  baseline_utilization: number | null;
  baseline_idle_ratio: number | null;
  excess_idle_asset_count: number;
  excess_idle_hours: number;
  projected_idle_ratio: number | null;
  idle_reduction_hours: number;
  total_demand_gap: number;
  shortage_count: number;
  reassignable_assets: number;
}
