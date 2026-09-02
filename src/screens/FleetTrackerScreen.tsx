import React, { useEffect, useMemo, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { LeafletMap, type AssetMapPoint } from '../components/common/LeafletMap';
import { StatusBadge } from '../components/common/StatusBadge';
import * as api from '../api/client';
import type { AssetDetail } from '../api/types';
import {
  MapPin,
  Building2,
  Navigation,
  ExternalLink,
  AlertTriangle,
  Loader2,
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
  const { assets, sites, positions, selectedAssetId, selectAsset, navigateTo } =
    useFleet();

  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [detail, setDetail] = useState<AssetDetail | null>(null);

  const assetId = selectedAssetId || assets[0]?.equipment_id || '';

  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
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

  const mapPoints = useMemo<AssetMapPoint[]>(() => {
    return assets
      .filter((a) => {
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
      })
      .map((a) => {
        const pos = positions[a.equipment_id];
        if (!pos) return null;
        const site = a.current_site_id ? sites[a.current_site_id] : undefined;
        return {
          id: a.equipment_id,
          latitude: pos.latitude,
          longitude: pos.longitude,
          status: a.status,
          model: a.model,
          siteId: a.current_site_id,
          siteName: site?.site_name ?? 'Unassigned',
          conditionScore: a.condition_score,
        };
      })
      .filter((p): p is AssetMapPoint => p !== null);
  }, [assets, positions, sites, siteFilter, statusFilter, typeFilter, searchFilter]);

  const activeAsset = detail ?? assets.find((a) => a.equipment_id === assetId);
  const activeSite = activeAsset?.current_site_id
    ? sites[activeAsset.current_site_id]
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              LIVE FLEET TRACKER
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF7] text-[#242424] border border-[#242424]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
              {mapPoints.length} GPS Positions
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Geospatial tracking of heavy machinery across all regional worksites.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
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
              {t}s
            </option>
          ))}
        </select>
      </div>

      {/* Main Map & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-[600px] rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-2 relative shadow-sm">
          <LeafletMap
            assets={mapPoints}
            sites={Object.values(sites)}
            selectedAssetId={assetId}
            onSelectAsset={(id) => selectAsset(id)}
            onNavigateToAsset={(id) => navigateTo('asset-details', id)}
            height="100%"
            highlightSiteId={siteFilter !== 'all' ? siteFilter : undefined}
          />
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
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#F7F2E6] p-3 rounded border border-[#242424]/10 text-xs mb-3 font-mono">
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">CONDITION</span>
                    <span className="font-bold text-sm text-[#242424]">
                      {activeAsset.condition_score.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">TYPE</span>
                    <span className="font-bold text-sm text-[#242424]">
                      {activeAsset.equipment_type}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-[#78756E] block font-sans">OPERATOR</span>
                    <span className="font-bold text-sm text-[#242424]">
                      {detail?.current_rental?.operator_id ?? 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Site Location
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {activeSite ? `${activeSite.site_name} (${activeSite.site_id})` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> GPS Coordinates
                    </span>
                    <span className="font-mono text-[11px] text-[#242424]">
                      {positions[activeAsset.equipment_id]
                        ? `${positions[activeAsset.equipment_id].latitude.toFixed(4)}, ${positions[activeAsset.equipment_id].longitude.toFixed(4)}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#242424]/10 space-y-2">
                <button
                  onClick={() => navigateTo('asset-details', activeAsset.equipment_id)}
                  className="w-full py-2 px-3 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Open Detailed Diagnostics</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#F7C83E]" />
                </button>

                <button
                  onClick={() => navigateTo('check-in-out', activeAsset.equipment_id)}
                  className="w-full py-1.5 rounded-md border border-[#242424] text-xs font-semibold text-[#242424] hover:bg-[#F7F2E6] transition-colors text-center"
                >
                  Check In / Out
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-8 text-center text-xs text-[#78756E]">
              {assets.length === 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading fleet positions…
                </span>
              ) : (
                'Select an asset pin on the map to inspect telemetry.'
              )}
            </div>
          )}

          {/* Quick Select List */}
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-3 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#78756E] uppercase tracking-wider mb-2 font-mono">
              Quick Select ({mapPoints.length})
            </div>
            <div className="space-y-1">
              {mapPoints.slice(0, 20).map((a) => (
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

      {!mapPoints.length && assets.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#78756E]">
          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          No assets match the current filters.
        </div>
      )}
    </div>
  );
};
