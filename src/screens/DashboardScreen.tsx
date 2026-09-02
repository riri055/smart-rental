import React, { useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LeafletMap, type AssetMapPoint } from '../components/common/LeafletMap';
import { EnterpriseBarChart, EnterpriseDonutChart } from '../components/common/Charts';
import {
  Boxes,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ExternalLink,
  ArrowLeftRight,
  Loader2,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const {
    assets,
    sites,
    stats,
    usageSummary,
    positions,
    loading,
    error,
    navigateTo,
    selectedSiteFilter,
  } = useFleet();

  const filteredAssets = useMemo(
    () =>
      selectedSiteFilter === 'all'
        ? assets
        : assets.filter((a) => a.current_site_id === selectedSiteFilter),
    [assets, selectedSiteFilter],
  );

  const mapPoints = useMemo<AssetMapPoint[]>(() => {
    return assets
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
  }, [assets, positions, sites]);

  if (loading && assets.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-[#78756E]">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs font-mono">Loading fleet data from backend…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 max-w-md mx-auto text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-[#C62828] mx-auto" />
        <h2 className="text-sm font-bold text-[#242424]">Unable to reach the backend</h2>
        <p className="text-xs text-[#78756E] leading-relaxed">{error}</p>
      </div>
    );
  }

  const utilByTypeData = (usageSummary?.by_equipment_type ?? []).map((b) => ({
    label: b.equipment_type ?? 'Unknown',
    value: b.utilization != null ? Math.round(b.utilization * 1000) / 10 : 0,
  }));

  const statusPieData = [
    { label: 'Active', value: stats.activeCount, color: '#242424' },
    { label: 'Available', value: stats.availableCount, color: '#2E7D32' },
    { label: 'Idle', value: stats.idleCount, color: '#D97706' },
    { label: 'Overdue', value: stats.overdueCount, color: '#C62828' },
    { label: 'Unknown', value: stats.unknownCount, color: '#78756E' },
  ].filter((d) => d.value > 0);

  const filteredCounts = {
    total: filteredAssets.length,
    active: filteredAssets.filter((a) => a.status === 'Active').length,
    available: filteredAssets.filter((a) => a.status === 'Available').length,
    overdue: filteredAssets.filter((a) => a.status === 'Overdue').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424]/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#242424] font-mono">
              FLEET OVERVIEW
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] border border-[#242424]">
              {selectedSiteFilter === 'all' ? 'All 8 Sites' : `Site ${selectedSiteFilter}`}
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-1">
            Latest available telemetry, asset status distribution, and fleet-wide utilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('check-in-out')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#242424] text-[#FFFDF7] hover:bg-[#383838] text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#F7C83E]" />
            <span>Check In / Out</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Assets"
          value={filteredCounts.total}
          subtext="Heavy Machinery Fleet"
          badgeText="Tracked"
          badgeVariant="default"
          icon={<Boxes className="w-4 h-4" />}
          onClick={() => navigateTo('assets')}
        />
        <StatCard
          title="Active / Rented"
          value={filteredCounts.active}
          subtext="Currently deployed on rental"
          badgeText="Deployed"
          badgeVariant="mustard"
          icon={<Truck className="w-4 h-4" />}
          onClick={() => navigateTo('assets')}
        />
        <StatCard
          title="Available in Pool"
          value={filteredCounts.available}
          subtext="Ready for immediate lease"
          badgeText="Ready"
          badgeVariant="green"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => navigateTo('assets')}
        />
        <StatCard
          title="Overdue Assets"
          value={filteredCounts.overdue}
          subtext="Requires recovery action"
          badgeText="Critical"
          badgeVariant="red"
          highlight={filteredCounts.overdue > 0}
          icon={<AlertTriangle className="w-4 h-4" />}
          onClick={() => navigateTo('assets')}
        />
        <StatCard
          title="Fleet Utilization"
          value={`${stats.avgUtilization}%`}
          subtext="Telemetry-derived operating ratio"
          badgeText={stats.avgUtilization >= 70 ? 'Optimal' : 'Low Util'}
          badgeVariant={stats.avgUtilization >= 70 ? 'green' : 'orange'}
          icon={<Activity className="w-4 h-4" />}
          onClick={() => navigateTo('usage-logs')}
        />
      </div>

      {/* Charts & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                  Utilization by Equipment Type
                </h3>
                <p className="text-[11px] text-[#78756E]">
                  Fleet-wide operating ratio per machine category (%)
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#242424] bg-[#F7F2E6] px-2 py-0.5 rounded border border-[#242424]/10">
                Avg: {stats.avgUtilization}%
              </span>
            </div>

            <EnterpriseBarChart
              data={utilByTypeData}
              unit="%"
              maxValue={100}
              primaryColor="#F7C83E"
              primaryName="Utilization"
            />
          </div>

          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4.5">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] mb-1">
              Asset Status Distribution
            </h3>
            <p className="text-[11px] text-[#78756E] mb-2">Fleet availability breakdown</p>

            <div className="py-2">
              <EnterpriseDonutChart
                data={statusPieData}
                centerTitle="Total Assets"
                centerValue={stats.totalAssets}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#242424]/10 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#242424]" />
                <span className="text-[#605D57]">Active:</span>
                <span className="font-mono font-bold text-[#242424]">{stats.activeCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#2E7D32]" />
                <span className="text-[#605D57]">Available:</span>
                <span className="font-mono font-bold text-[#242424]">{stats.availableCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#D97706]" />
                <span className="text-[#605D57]">Idle:</span>
                <span className="font-mono font-bold text-[#242424]">{stats.idleCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#C62828]" />
                <span className="text-[#605D57]">Overdue:</span>
                <span className="font-mono font-bold text-[#C62828]">{stats.overdueCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4.5 flex-1 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                  Operational Fleet View
                </h3>
                <p className="text-[11px] text-[#78756E]">
                  Asset positions across {Object.keys(sites).length} operational sites
                </p>
              </div>
              <button
                onClick={() => navigateTo('fleet-tracker')}
                className="text-xs font-semibold text-[#242424] hover:underline flex items-center gap-1"
              >
                <span>Fullscreen</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 min-h-[340px] rounded border border-[#242424]/20 overflow-hidden mb-3">
              <LeafletMap
                assets={mapPoints}
                sites={Object.values(sites)}
                height="100%"
                onNavigateToAsset={(aid) => navigateTo('asset-details', aid)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-[#78756E] pt-2 border-t border-[#242424]/10">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1565C0]" /> Active
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]" /> Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Idle
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#C62828]" /> Overdue
                </span>
              </div>
              <StatusBadge status="Available" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
