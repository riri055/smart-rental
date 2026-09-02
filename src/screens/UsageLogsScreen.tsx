import React, { useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/common/StatCard';
import {
  EnterpriseBarChart,
  EnterpriseHorizontalBarChart,
} from '../components/common/Charts';
import {
  Clock,
  Activity,
  TrendingDown,
  Database,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

function pct(value: number | null): number {
  return value != null ? Math.round(value * 1000) / 10 : 0;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export const UsageLogsScreen: React.FC = () => {
  const { usageSummary, sites, loading, error } = useFleet();

  const typeBarData = useMemo(
    () =>
      (usageSummary?.by_equipment_type ?? []).map((b) => ({
        label: b.equipment_type ?? 'Unknown',
        value: round(b.operating_hours),
        secondaryValue: round(b.idle_hours),
      })),
    [usageSummary],
  );

  const siteComparisonData = useMemo(
    () =>
      (usageSummary?.by_site ?? []).map((b) => {
        const util = pct(b.utilization);
        return {
          label: b.site_id ?? 'Unassigned',
          name: sites[b.site_id ?? '']?.site_name ?? 'Unassigned',
          value: util,
          color: util >= 70 ? '#2E7D32' : util >= 40 ? '#F7C83E' : '#C62828',
        };
      }),
    [usageSummary, sites],
  );

  if (loading && !usageSummary) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-[#78756E]">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs font-mono">Loading fleet usage metrics…</p>
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

  if (!usageSummary) {
    return null;
  }

  const operating = round(usageSummary.operating_hours);
  const idle = round(usageSummary.total_idle_hours);
  const efficiency = pct(usageSummary.utilization);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              TELEMETRY USAGE LOGS
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF7] text-[#242424] border border-[#242424]">
              {usageSummary.telemetry_records.toLocaleString()} Records
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Fleet-wide engine hours, idle overhead, and utilization from telemetry.
          </p>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Operating Hours"
          value={`${operating.toLocaleString()} hrs`}
          subtext="Productive heavy machinery run-time"
          badgeText="Productive"
          badgeVariant="green"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title="Cumulative Idle Hours"
          value={`${idle.toLocaleString()} hrs`}
          subtext="Thermal & fuel overhead loss"
          badgeText="Overhead"
          badgeVariant="red"
          highlight={idle > operating * 0.4}
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <StatCard
          title="Fleet Utilization"
          value={`${efficiency}%`}
          subtext="Operating ratio across all telemetry"
          badgeText={efficiency >= 65 ? 'Optimal' : 'Low Efficiency'}
          badgeVariant={efficiency >= 65 ? 'mustard' : 'orange'}
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          title="Telemetry Samples"
          value={usageSummary.telemetry_records.toLocaleString()}
          subtext="Sensor readings in the dataset"
          badgeText="IoT"
          badgeVariant="default"
          icon={<Database className="w-4 h-4" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Operating vs Idle Hours by Equipment Type
              </h3>
              <p className="text-[11px] text-[#78756E]">Cumulative breakdown across machine categories</p>
            </div>
          </div>

          <EnterpriseBarChart
            data={typeBarData}
            height={230}
            unit="h"
            primaryColor="#242424"
            secondaryColor="#F7C83E"
            primaryName="Operating Hours"
            secondaryName="Idle Hours"
          />
        </div>

        <div className="lg:col-span-5 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Works Hub Average Utilization
              </h3>
              <p className="text-[11px] text-[#78756E]">Site-by-site operational index (%)</p>
            </div>
          </div>

          <div className="py-2">
            <EnterpriseHorizontalBarChart
              data={siteComparisonData}
              maxValue={100}
              unit="%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
