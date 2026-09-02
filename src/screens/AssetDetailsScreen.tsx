import React, { useEffect, useMemo, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import { LeafletMap, type AssetMapPoint } from '../components/common/LeafletMap';
import { EnterpriseAreaChart } from '../components/common/Charts';
import * as api from '../api/client';
import type {
  AssetDetail,
  HistoryItem,
  Telemetry,
  Usage,
} from '../api/types';
import {
  Building2,
  Calendar,
  Fuel,
  User,
  ArrowLeftRight,
  Activity,
  History,
  Loader2,
  AlertTriangle,
  Navigation,
} from 'lucide-react';

function historySummary(item: HistoryItem): string {
  const d = item.data as Record<string, unknown>;
  switch (item.type) {
    case 'rental':
      return `Rental ${String(d.rental_id ?? '')} · ${String(d.rental_status ?? '')} · operator ${String(d.operator_id ?? '')}`;
    case 'event':
      return `${String(d.event_type ?? '')} (${String(d.severity ?? '')})`;
    case 'maintenance':
      return `${String(d.maintenance_type ?? '')} · ${String(d.status ?? '')}`;
    case 'lifecycle_event':
      return `${String(d.event ?? '')} · customer ${String(d.customer_id ?? '')}`;
    default:
      return item.type;
  }
}

export const AssetDetailsScreen: React.FC = () => {
  const {
    assets,
    sites,
    selectedAssetId,
    selectAsset,
    navigateTo,
    positions,
  } = useFleet();

  const assetId = selectedAssetId || assets[0]?.equipment_id || '';

  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    Promise.all([
      api.getAsset(assetId),
      api.getAssetTelemetry(assetId, { limit: 30 }),
      api.getAssetUsage(assetId),
      api.getAssetHistory(assetId),
    ])
      .then(([d, t, u, h]) => {
        if (cancelled) return;
        setDetail(d);
        setTelemetry(t);
        setUsage(u);
        setHistory(h);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const listAsset = assets.find((a) => a.equipment_id === assetId);

  const chartData = useMemo(
    () =>
      [...telemetry]
        .reverse()
        .map((t) => ({
          label: t.timestamp.substring(5),
          operating: Math.max(0, t.engine_hours - t.idle_hours),
          idle: t.idle_hours,
        })),
    [telemetry],
  );

  const mapPoints = useMemo<AssetMapPoint[]>(() => {
    if (!listAsset) return [];
    const pos = positions[listAsset.equipment_id];
    if (!pos) return [];
    return [
      {
        id: listAsset.equipment_id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        status: listAsset.status,
        model: listAsset.model,
        siteId: listAsset.current_site_id,
        siteName: sites[listAsset.current_site_id ?? '']?.site_name ?? 'Unassigned',
        conditionScore: listAsset.condition_score,
      },
    ];
  }, [listAsset, positions, sites]);

  if (!assetId) {
    return <div className="py-24 text-center text-xs text-[#78756E]">No assets available.</div>;
  }

  const site = listAsset?.current_site_id ? sites[listAsset.current_site_id] : undefined;
  const utilization = usage?.utilization != null ? Math.round(usage.utilization * 1000) / 10 : null;
  const latest = detail?.latest_telemetry ?? telemetry[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header & Asset Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424]/15 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              ASSET TELEMETRY & DIAGNOSTICS
            </h1>
            <select
              value={assetId}
              onChange={(e) => selectAsset(e.target.value)}
              className="text-xs font-mono font-bold bg-[#FFFDF7] border border-[#242424] px-2.5 py-1 rounded shadow-sm outline-none"
            >
              {assets.map((a) => (
                <option key={a.equipment_id} value={a.equipment_id}>
                  {a.equipment_id} — {a.equipment_type} ({a.current_site_id ?? 'Unassigned'})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[#78756E] mt-1">
            IoT sensor telemetry, usage metrics, rental status, and asset history.
          </p>
        </div>
      </div>

      {loading && !detail && (
        <div className="py-24 flex flex-col items-center gap-3 text-[#78756E]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs font-mono">Loading {assetId} telemetry…</p>
        </div>
      )}

      {error && (
        <div className="py-16 max-w-md mx-auto text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#C62828] mx-auto" />
          <p className="text-xs text-[#78756E] leading-relaxed">{error}</p>
        </div>
      )}

      {detail && listAsset && (
        <>
          {/* Primary Asset Card */}
          <div className="rounded-lg border border-[#242424] bg-[#FFFDF7] p-5 shadow-[3px_3px_0px_rgba(36,36,36,0.15)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#242424]/10 pb-4 mb-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-lg bg-[#F7F2E6] border border-[#242424]/20 text-[#242424] mt-0.5">
                  <EquipmentIcon type={detail.equipment_type} size={28} />
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xl font-extrabold text-[#242424]">
                      {detail.equipment_id}
                    </span>
                    <StatusBadge status={detail.status} size="md" />
                  </div>

                  <h2 className="text-base font-bold text-[#242424] mt-1">{detail.model}</h2>

                  <div className="flex items-center gap-4 text-xs text-[#78756E] mt-1 flex-wrap">
                    <span>
                      Category: <strong className="text-[#242424]">{detail.equipment_type}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Site:{' '}
                      <strong className="text-[#242424]">
                        {site ? `${site.site_name} (${site.site_id})` : 'Unassigned'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Condition:{' '}
                      <strong className="text-[#242424]">{detail.condition_score.toFixed(1)} / 100</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('check-in-out', detail.equipment_id)}
                  className="px-3 py-2 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#F7C83E]" />
                  <span>Check In / Out Asset</span>
                </button>
              </div>
            </div>

            {/* Telemetry counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
              <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
                <span className="text-[10px] text-[#78756E] block font-sans font-semibold">
                  UTILIZATION
                </span>
                <span className="text-xl font-bold text-[#242424]">
                  {utilization != null ? `${utilization}%` : '—'}
                </span>
                <span className="text-[10px] text-[#78756E] block mt-1">Operating / engine time</span>
              </div>

              <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
                <span className="text-[10px] text-[#78756E] block font-sans font-semibold">
                  TOTAL ENGINE HOURS
                </span>
                <span className="text-xl font-bold text-[#242424]">
                  {usage ? usage.engine_hours.toFixed(1) : '—'}
                </span>
                <span className="text-[10px] text-[#78756E] block mt-1">Sum of telemetry readings</span>
              </div>

              <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
                <span className="text-[10px] text-[#78756E] block font-sans font-semibold">
                  TOTAL IDLE HOURS
                </span>
                <span className={`text-xl font-bold ${usage && usage.idle_hours > usage.engine_hours * 0.4 ? 'text-[#C62828]' : 'text-[#242424]'}`}>
                  {usage ? usage.idle_hours.toFixed(1) : '—'}
                </span>
                <span className="text-[10px] text-[#78756E] block mt-1">Engine on / no work</span>
              </div>

              <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
                <span className="text-[10px] text-[#78756E] block font-sans font-semibold">
                  LATEST FUEL USED
                </span>
                <span className="text-xl font-bold text-[#242424]">
                  {latest ? `${latest.fuel_used_l.toFixed(1)} L` : '—'}
                </span>
                <span className="text-[10px] text-[#78756E] block mt-1">Most recent reading</span>
              </div>

              <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
                <span className="text-[10px] text-[#78756E] block font-sans font-semibold">
                  TELEMETRY RECORDS
                </span>
                <span className="text-xl font-bold text-[#242424]">{usage?.record_count ?? '—'}</span>
                <span className="text-[10px] text-[#78756E] block mt-1">Logged sensor samples</span>
              </div>
            </div>
          </div>

          {/* Telemetry Trend & Location */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                    Operating vs Idle Hours Trend
                  </h3>
                  <p className="text-[11px] text-[#78756E]">Recent daily engine sensor stream</p>
                </div>
                <span className="text-xs font-mono text-[#78756E] bg-[#F7F2E6] px-2 py-0.5 rounded border border-[#242424]/10">
                  Site {detail.current_site_id ?? 'Unassigned'}
                </span>
              </div>

              {chartData.length > 0 ? (
                <EnterpriseAreaChart data={chartData} height={230} />
              ) : (
                <div className="py-12 text-center text-xs text-[#78756E]">
                  No telemetry readings available for this asset.
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                    Current Location
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#242424] bg-[#F7F2E6] px-2 py-0.5 rounded border border-[#242424]/10">
                    {detail.current_site_id ?? 'Unassigned'}
                  </span>
                </div>

                <div className="h-44 rounded border border-[#242424]/20 overflow-hidden mb-3">
                  <LeafletMap
                    assets={mapPoints}
                    sites={Object.values(sites)}
                    selectedAssetId={assetId}
                    height="100%"
                    zoom={13}
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Site Facility:
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {site?.site_name ?? 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> Last GPS:
                    </span>
                    <span className="font-mono text-[11px] text-[#242424]">
                      {latest ? `${latest.latitude.toFixed(4)}, ${latest.longitude.toFixed(4)}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" /> Engine Temp:
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {latest ? `${latest.engine_temp_c.toFixed(1)} °C` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Rental & Recent Events & History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#242424]" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                    Current Rental
                  </h3>
                </div>
              </div>

              {detail.current_rental ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#242424]/10">
                    <span className="text-[#78756E]">Rental ID:</span>
                    <span className="font-mono font-semibold text-[#242424]">
                      {detail.current_rental.rental_id}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Operator:
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {detail.current_rental.operator_id}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#242424]/10">
                    <span className="text-[#78756E]">Check Out:</span>
                    <span className="font-semibold text-[#242424]">
                      {detail.current_rental.check_out}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#242424]/10">
                    <span className="text-[#78756E]">Expected Return:</span>
                    <span className="font-semibold text-[#242424]">
                      {detail.current_rental.expected_return}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#78756E]">Status:</span>
                    <StatusBadge status={detail.current_rental.rental_status} size="sm" />
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#78756E]">
                  No open rental. Asset is in the pool.
                </div>
              )}
            </div>

            <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#242424]" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                    Recent Events
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#78756E]">
                  {detail.latest_events.length} recorded
                </span>
              </div>

              {detail.latest_events.length > 0 ? (
                <div className="space-y-2">
                  {detail.latest_events.map((evt) => (
                    <div
                      key={evt.event_id}
                      className="p-2.5 rounded bg-[#F7F2E6] border border-[#242424]/10 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#242424]">{evt.event_type}</div>
                        <div className="text-[10px] text-[#78756E] font-mono">
                          {evt.event_id} · {evt.timestamp}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#78756E]">{evt.severity}</span>
                        <StatusBadge status={evt.resolution_status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#78756E]">
                  No events recorded for this asset.
                </div>
              )}
            </div>
          </div>

          {/* Full History Timeline */}
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#242424]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                  Asset History Timeline
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#78756E]">
                {history.length} entries
              </span>
            </div>

            {history.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item, idx) => (
                  <div
                    key={`${item.type}-${item.date}-${idx}`}
                    className="flex items-start gap-3 p-2.5 rounded bg-[#F7F2E6] border border-[#242424]/10 text-xs"
                  >
                    <span className="font-mono text-[10px] text-[#78756E] shrink-0 w-20 pt-0.5">
                      {item.date}
                    </span>
                    <div>
                      <div className="font-bold text-[#242424] uppercase text-[10px] font-mono">
                        {item.type}
                      </div>
                      <div className="text-[11px] text-[#605D57]">{historySummary(item)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#78756E]">
                No history recorded for this asset.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
