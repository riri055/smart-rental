import React from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge, RiskBadge } from '../components/common/StatusBadge';
import { LeafletMap } from '../components/common/LeafletMap';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import { EnterpriseBarChart, EnterpriseDonutChart } from '../components/common/Charts';
import {
  Boxes,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ArrowLeftRight
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const {
    assets,
    sites,
    alerts,
    recommendations,
    stats,
    navigateTo,
    selectedSiteFilter,
    acceptRecommendation
  } = useFleet();

  // Filter assets if site filter is active
  const filteredAssets =
    selectedSiteFilter === 'all'
      ? assets
      : assets.filter((a) => a.siteId === selectedSiteFilter);

  // Chart 1: Utilization by Equipment Type
  const equipmentTypes = ['Excavator', 'Bulldozer', 'Crane', 'Grader', 'Wheel Loader'];
  const utilByTypeData = equipmentTypes.map((type) => {
    const typeAssets = filteredAssets.filter((a) => a.equipmentType === type);
    const avgUtil =
      typeAssets.length > 0
        ? Math.round(
            (typeAssets.reduce((acc, curr) => acc + curr.utilization, 0) / typeAssets.length) * 10
          ) / 10
        : 0;

    return {
      label: type,
      value: avgUtil
    };
  });

  // Chart 2: Rental Status Donut
  const statusPieData = [
    { label: 'Rented', value: filteredAssets.filter((a) => a.status === 'Rented').length, color: '#242424' },
    { label: 'Available', value: filteredAssets.filter((a) => a.status === 'Available').length, color: '#2E7D32' },
    { label: 'Maintenance', value: filteredAssets.filter((a) => a.status === 'Maintenance').length, color: '#D97706' },
    { label: 'Overdue', value: filteredAssets.filter((a) => a.status === 'Overdue').length, color: '#C62828' }
  ].filter((d) => d.value > 0);

  // Key Demo Recommendations & Anomalies
  const topRecommendations = recommendations.filter((r) => r.status === 'Pending').slice(0, 2);
  const criticalAlerts = alerts.filter((al) => al.status === 'Open' && (al.severity === 'Critical' || al.severity === 'High')).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Page Title & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424]/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#242424] font-mono">FLEET OVERVIEW</h1>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] border border-[#242424]">
              {selectedSiteFilter === 'all' ? 'All 6 Sites' : `Site ${selectedSiteFilter}`}
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-1">
            Real-time telemetry, asset utilization distribution, and AI optimization recommendations.
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
          <button
            onClick={() => navigateTo('ai-intelligence')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFDF7] text-[#242424] hover:bg-[#FAF7EE] border border-[#242424] text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#242424]" />
            <span>AI Intelligence</span>
          </button>
        </div>
      </div>

      {/* Top 5 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Assets"
          value={filteredAssets.length}
          subtext="Heavy Machinery Fleet"
          badgeText="Active"
          badgeVariant="default"
          icon={<Boxes className="w-4 h-4" />}
          onClick={() => navigateTo('assets')}
        />
        <StatCard
          title="Rented / Active"
          value={filteredAssets.filter((a) => a.status === 'Rented').length}
          subtext={`${Math.round((filteredAssets.filter((a) => a.status === 'Rented').length / (filteredAssets.length || 1)) * 100)}% of total fleet`}
          badgeText="Deployed"
          badgeVariant="mustard"
          icon={<Truck className="w-4 h-4" />}
          onClick={() => navigateTo('assets')}
        />
        <StatCard
          title="Available in Pool"
          value={filteredAssets.filter((a) => a.status === 'Available').length}
          subtext="Ready for immediate lease"
          badgeText="Ready"
          badgeVariant="green"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => navigateTo('assets')}
        />
        <StatCard
          title="Overdue Leases"
          value={filteredAssets.filter((a) => a.status === 'Overdue').length}
          subtext="Requires recovery action"
          badgeText="Critical"
          badgeVariant="red"
          highlight={filteredAssets.some((a) => a.status === 'Overdue')}
          icon={<AlertTriangle className="w-4 h-4" />}
          onClick={() => navigateTo('alerts')}
        />
        <StatCard
          title="Fleet Utilization"
          value={`${stats.avgUtilization}%`}
          subtext="Target benchmark: > 70%"
          badgeText={stats.avgUtilization >= 70 ? 'Optimal' : 'Low Util'}
          badgeVariant={stats.avgUtilization >= 70 ? 'green' : 'orange'}
          icon={<Activity className="w-4 h-4" />}
          onClick={() => navigateTo('usage-logs')}
        />
      </div>

      {/* AI Executive Intelligence Alert Bar (Highlighting Demo Cases) */}
      <div className="rounded-lg border border-[#242424] bg-[#FFFDF7] p-4 shadow-[3px_3px_0px_rgba(36,36,36,0.1)]">
        <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#F7C83E] text-[#242424]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold font-mono tracking-tight text-[#242424]">
                AI FLEET INTELLIGENCE & OPTIMIZATION SIGNALS
              </h2>
              <p className="text-[11px] text-[#78756E]">
                Autonomous recommendations for fleet rebalancing and anomaly prevention
              </p>
            </div>
          </div>

          <button
            onClick={() => navigateTo('ai-intelligence')}
            className="text-xs font-semibold text-[#242424] hover:underline flex items-center gap-1"
          >
            <span>View All AI Models</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Key Demo Case 1: EQX1004 Reallocation */}
          <div className="rounded-md border border-[#F7C83E] bg-[#FEF6DC]/60 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7C83E] text-[#242424]">
                  REALLOCATION DISPATCH
                </span>
                <span className="text-[11px] font-mono text-[#2E7D32] font-bold">+$1,450/day</span>
              </div>
              <div className="mt-2 text-xs font-bold text-[#242424]">
                Reallocate EQX1004 (Excavator) from Site S004 → S003
              </div>
              <p className="text-[11px] text-[#605D57] mt-1">
                EQX1004 is sitting underutilized at 18.2% in Site S004 while Site S003 is facing a +133% excavator deficit.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#F7C83E]/40">
              <button
                onClick={() => navigateTo('asset-details', 'EQX1004')}
                className="text-[11px] font-semibold text-[#242424] hover:underline flex items-center gap-1"
              >
                Inspect Telemetry
              </button>
              <button
                onClick={() => acceptRecommendation('REC-001')}
                className="px-2.5 py-1 rounded bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-[11px] font-semibold transition-colors"
              >
                Accept Reallocation
              </button>
            </div>
          </div>

          {/* Key Demo Case 2: EQX1007 Idle Anomaly */}
          <div className="rounded-md border border-[#C62828]/40 bg-[#FEE2E2]/50 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#C62828] text-white">
                  CRITICAL ANOMALY
                </span>
                <span className="text-[11px] font-mono text-[#C62828] font-bold">12h/day Idle</span>
              </div>
              <div className="mt-2 text-xs font-bold text-[#242424]">
                EQX1007: 0% Utilization & Unassigned at Site S003
              </div>
              <p className="text-[11px] text-[#605D57] mt-1">
                Asset is checked out but logging 0 operating hours and 12 idle hours daily with no designated operator.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#C62828]/20">
              <button
                onClick={() => navigateTo('asset-details', 'EQX1007')}
                className="text-[11px] font-semibold text-[#C62828] hover:underline flex items-center gap-1"
              >
                Investigate EQX1007 Details
              </button>
              <button
                onClick={() => acceptRecommendation('REC-002')}
                className="px-2.5 py-1 rounded bg-[#C62828] hover:bg-[#B71C1C] text-white text-[11px] font-semibold transition-colors"
              >
                Assign Master Operator
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Fleet Utilization & Status Charts (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Utilization by Equipment Type Bar Chart */}
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                  Average Utilization by Equipment Type
                </h3>
                <p className="text-[11px] text-[#78756E]">Comparison across active machinery categories (%)</p>
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

          {/* Status Breakdown & Category Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Donut Chart */}
            <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] mb-1">
                Rental Status Distribution
              </h3>
              <p className="text-[11px] text-[#78756E] mb-2">Fleet availability breakdown</p>

              <div className="py-2">
                <EnterpriseDonutChart
                  data={statusPieData}
                  centerTitle="Total Assets"
                  centerValue={filteredAssets.length}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#242424]/10 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#242424]" />
                  <span className="text-[#605D57]">Rented:</span>
                  <span className="font-mono font-bold text-[#242424]">{stats.rentedCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#2E7D32]" />
                  <span className="text-[#605D57]">Available:</span>
                  <span className="font-mono font-bold text-[#242424]">{stats.availableCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#D97706]" />
                  <span className="text-[#605D57]">Maint:</span>
                  <span className="font-mono font-bold text-[#242424]">{stats.maintenanceCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#C62828]" />
                  <span className="text-[#605D57]">Overdue:</span>
                  <span className="font-mono font-bold text-[#C62828]">{stats.overdueCount}</span>
                </div>
              </div>
            </div>

            {/* Critical Open Alerts Summary Card */}
            <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                    Active Fleet Alerts
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#C62828] border border-[#C62828]/30">
                    {stats.openAlertsCount} Open
                  </span>
                </div>
                <p className="text-[11px] text-[#78756E] mb-3">Critical items requiring intervention</p>

                <div className="space-y-2">
                  {criticalAlerts.map((al) => (
                    <div
                      key={al.id}
                      onClick={() => navigateTo('asset-details', al.assetId)}
                      className="p-2 rounded bg-[#F7F2E6] hover:bg-[#EFE9DC] border border-[#242424]/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#242424]">{al.assetId}</span>
                        <RiskBadge risk={al.severity} />
                      </div>
                      <div className="text-[11px] text-[#242424] font-medium mt-0.5 truncate">
                        {al.alertType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigateTo('alerts')}
                className="mt-3 w-full py-1.5 rounded border border-[#242424] text-xs font-semibold text-[#242424] hover:bg-[#F7F2E6] transition-colors text-center"
              >
                Open Alert Management ({stats.openAlertsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Fleet Map Preview (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4.5 flex-1 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                  Live Tactical Fleet Grid
                </h3>
                <p className="text-[11px] text-[#78756E]">Real-time GPS telemetry from 6 operational sites</p>
              </div>
              <button
                onClick={() => navigateTo('fleet-tracker')}
                className="text-xs font-semibold text-[#242424] hover:underline flex items-center gap-1"
              >
                <span>Fullscreen</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Mini Map */}
            <div className="flex-1 min-h-[340px] rounded border border-[#242424]/20 overflow-hidden mb-3">
              <LeafletMap
                assets={filteredAssets}
                sites={sites}
                height="100%"
                onNavigateToAsset={(aid) => navigateTo('asset-details', aid)}
              />
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-[#78756E] pt-2 border-t border-[#242424]/10">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1565C0]" /> Rented
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]" /> Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Maint
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#C62828]" /> Overdue / Anomaly
                </span>
              </div>
              <button
                onClick={() => navigateTo('fleet-tracker')}
                className="font-semibold text-[#242424] hover:underline"
              >
                Track 50 Units →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
