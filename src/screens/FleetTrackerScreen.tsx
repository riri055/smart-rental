import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { LeafletMap, type AssetMapPoint } from '../components/common/LeafletMap';
import { StatusBadge } from '../components/common/StatusBadge';
import * as api from '../api/client';
import type { Alert, AssetDetail } from '../api/types';
import {
  MapPin,
  Building2,
  Navigation,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Bell,
  User,
  Calendar,
} from 'lucide-react';

const EQUIPMENT_TYPES = [
  'Bulldozer',
  'Crane',
  'Dump Truck',
  'Excavator',
  'Grader',
  'Wheel Loader',
];

const STATUSES = ['Active', 'Available', 'Idle', 'Overdue', 'Unknown'];

export const FleetTrackerScreen: React.FC = () => {
  const {
    assets,
    sites,
    positions,
    selectedAssetId,
    selectAsset,
    navigateTo,
    loading,
    error,
  } = useFleet();

  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [openAlerts, setOpenAlerts] = useState<Alert[]>([]);

  const assetId = selectedAssetId || assets[0]?.equipment_id || '';

  // Load the selected asset's full detail (telemetry, rental, events).
  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
    setDetail(null);
    api
      .getAsset(assetId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  // Load open alerts once to surface "needs attention" and per-asset counts.
  useEffect(() => {
    let cancelled = false;
    api
      .getAlerts({ status: 'open' })
      .then((alerts) => {
        if (!cancelled) setOpenAlerts(alerts);
      })
      .catch(() => {
        if (!cancelled) setOpenAlerts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openAlertsByAsset = useMemo(() => {
    const map: Record<string, Alert[]> = {};
    for (const alert of openAlerts) {
      (map[alert.asset_id] ??= []).push(alert);
    }
    return map;
  }, [openAlerts]);

  // Assets matching the active filters (drives both map and summary).
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (siteFilter !== 'all' && a.current_site_id !== siteFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (typeFilter !== 'all' && a.equipment_type !== typeFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          a.equipment_id.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          a.equipment_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, siteFilter, statusFilter, typeFilter, searchFilter]);

  const mapPoints = useMemo<AssetMapPoint[]>(() => {
    const result: AssetMapPoint[] = [];
    for (const a of filteredAssets) {
      const pos = positions[a.equipment_id];
      if (!pos) continue;
      const site = a.current_site_id ? sites[a.current_site_id] : undefined;
      result.push({
        id: a.equipment_id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        status: a.status,
        model: a.model,
        siteId: a.current_site_id,
        siteName: site?.site_name ?? 'Unassigned',
        conditionScore: a.condition_score,
        equipmentType: a.equipment_type,
      });
    }
    return result;
  }, [filteredAssets, positions, sites]);

  const summary = useMemo(() => {
    const withLocation = filteredAssets.filter(
      (a) => positions[a.equipment_id] != null,
    ).length;
    const needsAttention = filteredAssets.filter(
      (a) =>
        a.status === 'Overdue' ||
        (openAlertsByAsset[a.equipment_id]?.length ?? 0) > 0,
    ).length;
    return {
      total: filteredAssets.length,
      active: filteredAssets.filter((a) => a.status === 'Active').length,
      available: filteredAssets.filter((a) => a.status === 'Available').length,
      idle: filteredAssets.filter((a) => a.status === 'Idle').length,
      overdue: filteredAssets.filter((a) => a.status === 'Overdue').length,
      unknown: filteredAssets.filter((a) => a.status === 'Unknown').length,
      withLocation,
      needsAttention,
    };
  }, [filteredAssets, positions, openAlertsByAsset]);

  const activeAsset = detail ?? assets.find((a) => a.equipment_id === assetId);
  const activeSite = activeAsset?.current_site_id
    ? sites[activeAsset.current_site_id]
    : undefined;
  const activeAlerts = assetId ? openAlertsByAsset[assetId] ?? [] : [];
  const latestTelemetry = detail?.latest_telemetry ?? null;

  const handleNavigateToAsset = useCallback(
    (id: string) => navigateTo('asset-details', id),
    [navigateTo],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              OPERATIONAL FLEET VIEW
            </h1>
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF7] text-[#242424] border border-[#242424]">
              <MapPin className="w-3 h-3 text-[#1565C0]" />
              {mapPoints.length} assets with location
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5 max-w-2xl">
            Where rented equipment is, what state it&apos;s in, and which assets need
            attention — visualized from the latest available telemetry/location data.
          </p>
        </div>
      </div>

      {/* Fleet summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        <SummaryMetric label="Total" value={summary.total} tone="dark" />
        <SummaryMetric label="Active" value={summary.active} tone="blue" />
        <SummaryMetric label="Available" value={summary.available} tone="green" />
        <SummaryMetric label="Idle" value={summary.idle} tone="amber" />
        <SummaryMetric label="Overdue" value={summary.overdue} tone="red" />
        <SummaryMetric label="Unknown" value={summary.unknown} tone="grey" />
        <SummaryMetric label="With location" value={summary.withLocation} tone="dark" />
        <SummaryMetric label="Needs attention" value={summary.needsAttention} tone="red" />
      </div>

      {/* Filter toolbar */}
      <div className="bg-[#FFFDF7] p-3 rounded-lg border border-[#242424]/20 flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search asset ID or model..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none w-44 focus:border-[#242424]"
        />

        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none font-mono"
        >
          <option value="all">All Sites</option>
          {Object.values(sites).map((s) => (
            <option key={s.site_id} value={s.site_id}>
              {s.site_id} · {s.site_name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none"
        >
          <option value="all">All Equipment Types</option>
          {EQUIPMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {(siteFilter !== 'all' ||
          statusFilter !== 'all' ||
          typeFilter !== 'all' ||
          searchFilter.trim()) && (
          <button
            onClick={() => {
              setSiteFilter('all');
              setStatusFilter('all');
              setTypeFilter('all');
              setSearchFilter('');
            }}
            className="text-xs text-[#78756E] hover:text-[#242424] underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Main map + detail drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-[600px] rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-2 relative shadow-sm">
          <LeafletMap
            assets={mapPoints}
            sites={Object.values(sites)}
            selectedAssetId={assetId}
            onSelectAsset={selectAsset}
            onNavigateToAsset={handleNavigateToAsset}
            height="100%"
            highlightSiteId={siteFilter !== 'all' ? siteFilter : undefined}
          />

          {loading && assets.length === 0 && (
            <div className="absolute inset-0 z-[600] bg-[#FFFDF7]/85 flex items-center justify-center gap-2 text-xs text-[#78756E]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading fleet positions…
            </div>
          )}

          {!loading && error && (
            <div className="absolute inset-0 z-[600] bg-[#FFFDF7]/90 flex flex-col items-center justify-center gap-2 text-xs text-[#C62828] p-6 text-center">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {!loading && !error && assets.length > 0 && mapPoints.length === 0 && (
            <div className="absolute inset-0 z-[600] bg-[#FFFDF7]/85 flex items-center justify-center gap-2 text-xs text-[#78756E] p-6 text-center">
              No assets match the current filters.
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-3">
          {activeAsset ? (
            <div className="rounded-lg border border-[#242424] bg-[#FFFDF7] p-4 shadow-[3px_3px_0px_rgba(36,36,36,0.15)] flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-start justify-between border-b border-[#242424]/10 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-[#242424]">
                        {activeAsset.equipment_id}
                      </span>
                      <StatusBadge status={activeAsset.status} size="sm" />
                    </div>
                    <div className="text-xs font-semibold text-[#242424] mt-0.5">
                      {activeAsset.model}
                    </div>
                    <div className="text-[11px] text-[#78756E]">
                      {activeAsset.equipment_type}
                    </div>
                  </div>
                </div>

                {/* Attention + alerts */}
                {activeAlerts.length > 0 && (
                  <div className="flex items-start gap-2 rounded bg-[#FEE2E2] border border-[#C62828]/30 p-2.5 mb-3">
                    <Bell className="w-3.5 h-3.5 text-[#C62828] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-[#C62828]">
                        {activeAlerts.length} open alert{activeAlerts.length > 1 ? 's' : ''}
                      </span>
                      <div className="text-[11px] text-[#605D57] mt-0.5">
                        {activeAlerts
                          .slice(0, 2)
                          .map((a) => `${a.category} (${a.severity})`)
                          .join(' · ')}
                        {activeAlerts.length > 2 && ` · +${activeAlerts.length - 2} more`}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 bg-[#F7F2E6] p-3 rounded border border-[#242424]/10 text-xs mb-3 font-mono">
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">CONDITION</span>
                    <span className="font-bold text-sm text-[#242424]">
                      {activeAsset.condition_score.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">OPERATOR</span>
                    <span className="font-bold text-sm text-[#242424]">
                      {detail?.current_rental?.operator_id ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Site
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {activeSite ? `${activeSite.site_name} (${activeSite.site_id})` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> Latest location
                    </span>
                    <span className="font-mono text-[11px] text-[#242424]">
                      {latestTelemetry
                        ? `${latestTelemetry.latitude.toFixed(4)}, ${latestTelemetry.longitude.toFixed(4)}`
                        : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Last telemetry
                    </span>
                    <span className="font-mono text-[11px] text-[#242424]">
                      {latestTelemetry ? latestTelemetry.timestamp : '—'}
                    </span>
                  </div>

                  {detail?.current_rental && (
                    <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                      <span className="text-[#78756E] flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Rental
                      </span>
                      <span className="font-mono text-[11px] text-[#242424] flex items-center gap-1.5">
                        {detail.current_rental.rental_id}
                        <StatusBadge status={detail.current_rental.rental_status} size="sm" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#242424]/10 space-y-2">
                <button
                  onClick={() => navigateTo('asset-details', activeAsset.equipment_id)}
                  className="w-full py-2 px-3 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#F7C83E]" />
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigateTo('check-in-out', activeAsset.equipment_id)}
                    className="flex-1 py-1.5 rounded-md border border-[#242424] text-xs font-semibold text-[#242424] hover:bg-[#F7F2E6] transition-colors text-center"
                  >
                    Check In / Out
                  </button>
                  <button
                    onClick={() => navigateTo('alerts')}
                    className="flex-1 py-1.5 rounded-md border border-[#242424] text-xs font-semibold text-[#242424] hover:bg-[#F7F2E6] transition-colors text-center"
                  >
                    Alerts
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-8 text-center text-xs text-[#78756E]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading fleet…
                </span>
              ) : (
                'Select an asset pin on the map to inspect it.'
              )}
            </div>
          )}

          {/* Quick select list */}
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-3 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#78756E] uppercase tracking-wider mb-2 font-mono">
              Fleet List ({mapPoints.length})
            </div>
            <div className="space-y-1">
              {mapPoints.slice(0, 30).map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAsset(a.id)}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                    assetId === a.id
                      ? 'bg-[#F7C83E] text-[#242424] font-bold'
                      : 'hover:bg-[#F7F2E6] text-[#242424]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono font-bold text-[11px]">{a.id}</span>
                    <span className="text-[10px] text-[#605D57] truncate max-w-[110px]">
                      {a.model}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono">{a.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryMetric: React.FC<{
  label: string;
  value: number;
  tone: 'dark' | 'blue' | 'green' | 'amber' | 'red' | 'grey';
}> = ({ label, value, tone }) => {
  const toneClasses: Record<string, string> = {
    dark: 'text-[#242424]',
    blue: 'text-[#1565C0]',
    green: 'text-[#2E7D32]',
    amber: 'text-[#D97706]',
    red: 'text-[#C62828]',
    grey: 'text-[#78756E]',
  };
  return (
    <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] px-3 py-2 shadow-sm">
      <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#78756E]">
        {label}
      </div>
      <div className={`text-xl font-mono font-bold mt-0.5 ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
};
