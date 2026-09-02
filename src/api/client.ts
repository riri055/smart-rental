import type {
  Alert,
  Anomaly,
  Asset,
  AssetDetail,
  CheckinRequest,
  CheckoutRequest,
  DemandForecast,
  HealthResponse,
  HistoryItem,
  Impact,
  LatestTelemetryLocation,
  Operator,
  Recommendation,
  Rental,
  Site,
  Telemetry,
  Usage,
  UsageSummary,
} from './types';

// The Vite dev server injects VITE_* variables at build time. Default to the
// local FastAPI backend so the app works without a .env file.
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://127.0.0.1:8000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(
      0,
      `Unable to reach the backend at ${API_BASE_URL}. Is the API server running?`,
    );
  }

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (body.detail) {
        detail =
          typeof body.detail === 'string'
            ? body.detail
            : JSON.stringify(body.detail);
      }
    } catch {
      // Non-JSON error body; keep the default message.
    }
    throw new ApiError(res.status, detail);
  }

  return (await res.json()) as T;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

export function getSites(): Promise<Site[]> {
  return request<Site[]>('/api/sites');
}

export function getOperators(): Promise<Operator[]> {
  return request<Operator[]>('/api/operators');
}

export function getAssets(params?: {
  status?: string;
  equipment_type?: string;
  site_id?: string;
}): Promise<Asset[]> {
  return request<Asset[]>(`/api/assets${buildQuery(params)}`);
}

export function getAsset(equipmentId: string): Promise<AssetDetail> {
  return request<AssetDetail>(`/api/assets/${encodeURIComponent(equipmentId)}`);
}

export function getAssetTelemetry(
  equipmentId: string,
  params?: { limit?: number; start?: string; end?: string },
): Promise<Telemetry[]> {
  return request<Telemetry[]>(
    `/api/assets/${encodeURIComponent(equipmentId)}/telemetry${buildQuery(params)}`,
  );
}

export function getLatestTelemetryLocations(): Promise<LatestTelemetryLocation[]> {
  return request<LatestTelemetryLocation[]>('/api/telemetry/latest');
}

export function getAssetUsage(equipmentId: string): Promise<Usage> {
  return request<Usage>(`/api/assets/${encodeURIComponent(equipmentId)}/usage`);
}

export function getAssetHistory(equipmentId: string): Promise<HistoryItem[]> {
  return request<HistoryItem[]>(
    `/api/assets/${encodeURIComponent(equipmentId)}/history`,
  );
}

export function getUsageSummary(): Promise<UsageSummary> {
  return request<UsageSummary>('/api/usage');
}

export function getRentals(params?: {
  rental_status?: string;
  equipment_id?: string;
  site_id?: string;
  operator_id?: string;
}): Promise<Rental[]> {
  return request<Rental[]>(`/api/rentals${buildQuery(params)}`);
}

export function getRental(rentalId: string): Promise<Rental> {
  return request<Rental>(`/api/rentals/${encodeURIComponent(rentalId)}`);
}

export function checkoutRental(payload: CheckoutRequest): Promise<Rental> {
  return request<Rental>('/api/rentals/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function checkinRental(
  rentalId: string,
  payload: CheckinRequest = {},
): Promise<Rental> {
  return request<Rental>(`/api/rentals/${encodeURIComponent(rentalId)}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getAlerts(params?: {
  category?: string;
  severity?: string;
  status?: string;
  asset_id?: string;
}): Promise<Alert[]> {
  return request<Alert[]>(`/api/alerts${buildQuery(params)}`);
}

export function updateAlertStatus(
  alertId: string,
  status: 'open' | 'acknowledged',
): Promise<Alert> {
  return request<Alert>(`/api/alerts/${encodeURIComponent(alertId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function getDemandForecast(params?: {
  site_id?: string;
  equipment_type?: string;
  horizon_days?: number;
}): Promise<DemandForecast[]> {
  return request<DemandForecast[]>(`/api/ai/demand${buildQuery(params)}`);
}

export function getAnomalies(params?: {
  severity?: string;
}): Promise<Anomaly[]> {
  return request<Anomaly[]>(`/api/ai/anomalies${buildQuery(params)}`);
}

export function getRecommendations(params: {
  site_id: string;
  equipment_type: string;
  horizon_days?: number;
  limit?: number;
}): Promise<Recommendation[]> {
  return request<Recommendation[]>(
    `/api/ai/recommendations${buildQuery(params)}`,
  );
}

export function getImpact(params?: {
  horizon_days?: number;
}): Promise<Impact> {
  return request<Impact>(`/api/ai/impact${buildQuery(params)}`);
}
