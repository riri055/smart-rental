import React, { useState, useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/common/StatCard';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import { EnterpriseBarChart, EnterpriseHorizontalBarChart } from '../components/common/Charts';
import {
  Clock,
  Activity,
  Fuel,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

export const UsageLogsScreen: React.FC = () => {
  const { usageLogs, assets, sites, addToast, navigateTo } = useFleet();

  const [searchAsset, setSearchAsset] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    return usageLogs.filter((log) => {
      if (siteFilter !== 'all' && log.siteId !== siteFilter) return false;
      if (typeFilter !== 'all' && log.equipmentType !== typeFilter) return false;
      if (searchAsset.trim()) {
        const q = searchAsset.toLowerCase();
        return (
          log.assetId.toLowerCase().includes(q) ||
          log.assetName.toLowerCase().includes(q) ||
          log.siteId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [usageLogs, siteFilter, typeFilter, searchAsset]);

  // Aggregate stats
  const totalOperatingHours = Math.round(filteredLogs.reduce((acc, curr) => acc + curr.operatingHours, 0));
  const totalIdleHours = Math.round(filteredLogs.reduce((acc, curr) => acc + curr.idleHours, 0));
  const totalFuelLiters = Math.round(filteredLogs.reduce((acc, curr) => acc + curr.fuelBurnLiters, 0));
  const overallEfficiency = totalOperatingHours + totalIdleHours > 0
    ? Math.round((totalOperatingHours / (totalOperatingHours + totalIdleHours)) * 100)
    : 0;

  // Chart data: 7-day timeline of Operating vs Idle Hours
  const dailyTimelineMap = new Map<string, { date: string; operating: number; idle: number }>();
  filteredLogs.forEach((l) => {
    const existing = dailyTimelineMap.get(l.date) || { date: l.date.substring(5), operating: 0, idle: 0 };
    existing.operating += l.operatingHours;
    existing.idle += l.idleHours;
    dailyTimelineMap.set(l.date, existing);
  });

  const dailyTimelineData = Array.from(dailyTimelineMap.values()).map((d) => ({
    label: d.date,
    value: Math.round(d.operating * 10) / 10,
    secondaryValue: Math.round(d.idle * 10) / 10
  })).slice(-7);

  // Chart data: Site Comparison
  const siteComparisonData = Object.values(sites).map((s) => {
    const siteLogs = filteredLogs.filter((l) => l.siteId === s.id);
    const avgUtil = siteLogs.length > 0 ? Math.round((siteLogs.reduce((acc, curr) => acc + curr.utilization, 0) / siteLogs.length)) : 0;
    return {
      label: s.id,
      name: s.name.split(' ')[0],
      value: avgUtil,
      color: avgUtil >= 70 ? '#2E7D32' : avgUtil >= 40 ? '#F7C83E' : '#C62828'
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">TELEMETRY USAGE LOGS</h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF7] text-[#242424] border border-[#242424]">
              {filteredLogs.length} Verified Records
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Detailed engine hours, machine idling logs, fuel consumption, and operational efficiency analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addToast('Exported telemetry logs to CSV', 'info')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFDF7] border border-[#242424]/20 hover:border-[#242424] text-xs font-semibold text-[#242424] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Telemetry CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Operating Hours"
          value={`${totalOperatingHours} hrs`}
          subtext="Productive heavy machinery run-time"
          badgeText="Productive"
          badgeVariant="green"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title="Cumulative Idle Hours"
          value={`${totalIdleHours} hrs`}
          subtext="Thermal & fuel overhead loss"
          badgeText="Overhead"
          badgeVariant="red"
          highlight={totalIdleHours > totalOperatingHours * 0.4}
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <StatCard
          title="Productive Efficiency"
          value={`${overallEfficiency}%`}
          subtext="Ratio of Operating to Total Time"
          badgeText={overallEfficiency >= 65 ? 'Optimal' : 'Low Efficiency'}
          badgeVariant={overallEfficiency >= 65 ? 'mustard' : 'orange'}
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          title="Estimated Diesel Burn"
          value={`${totalFuelLiters.toLocaleString()} L`}
          subtext="Calculated from CAN-bus injector flow"
          badgeText="IoT Sensor"
          badgeVariant="default"
          icon={<Fuel className="w-4 h-4" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Operating vs Idle Trend (7 Cols) */}
        <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Fleet Run-Time vs Idle-Time Trend
              </h3>
              <p className="text-[11px] text-[#78756E]">Daily aggregate breakdown across machines</p>
            </div>
          </div>

          <EnterpriseBarChart
            data={dailyTimelineData}
            height={230}
            unit="h"
            primaryColor="#242424"
            secondaryColor="#F7C83E"
            primaryName="Operating Hours"
            secondaryName="Idle Hours"
          />
        </div>

        {/* Site Efficiency Comparison (5 Cols) */}
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

      {/* Filter and Log Table */}
      <div className="space-y-3">
        {/* Table Filters */}
        <div className="bg-[#FFFDF7] p-3 rounded-lg border border-[#242424]/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-[#78756E] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search asset ID..."
                value={searchAsset}
                onChange={(e) => setSearchAsset(e.target.value)}
                className="w-full bg-[#F7F2E6] border border-[#242424]/20 text-xs pl-8 pr-2 py-1.5 rounded outline-none"
              />
            </div>

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none font-mono"
            >
              <option value="all">All Sites</option>
              {Object.values(sites).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none"
            >
              <option value="all">All Equipment Types</option>
              <option value="Excavator">Excavators</option>
              <option value="Bulldozer">Bulldozers</option>
              <option value="Crane">Cranes</option>
              <option value="Grader">Graders</option>
              <option value="Wheel Loader">Wheel Loaders</option>
            </select>
          </div>

          <div className="text-xs text-[#78756E] font-mono">
            Showing {filteredLogs.length} Telemetry Events
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#F7F2E6] border-b border-[#242424]/20 z-10">
                <tr className="text-[#605D57] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-2.5 px-4 font-bold text-[#242424]">Date</th>
                  <th className="py-2.5 px-4 font-bold text-[#242424]">Asset ID</th>
                  <th className="py-2.5 px-4 font-bold">Equipment Model</th>
                  <th className="py-2.5 px-4 font-bold">Site</th>
                  <th className="py-2.5 px-4 font-bold font-mono">Operating Hrs</th>
                  <th className="py-2.5 px-4 font-bold font-mono">Idle Hrs</th>
                  <th className="py-2.5 px-4 font-bold font-mono">Utilization</th>
                  <th className="py-2.5 px-4 font-bold font-mono">Fuel (L)</th>
                  <th className="py-2.5 px-4 font-bold text-right">Inspect</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#242424]/10">
                {filteredLogs.slice(0, 40).map((log, idx) => (
                  <tr key={`${log.assetId}-${log.date}-${idx}`} className="hover:bg-[#FAF7EE] transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[#78756E]">{log.date}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#242424]">
                      <button
                        onClick={() => navigateTo('asset-details', log.assetId)}
                        className="hover:underline text-[#242424]"
                      >
                        {log.assetId}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#242424]">{log.assetName}</td>
                    <td className="py-2.5 px-4 font-mono text-[#242424]">{log.siteId}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#2E7D32]">
                      {log.operatingHours} hrs
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#C62828]">
                      {log.idleHours} hrs
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#242424]">
                      {log.utilization}%
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#78756E]">{log.fuelBurnLiters} L</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => navigateTo('asset-details', log.assetId)}
                        className="px-2 py-0.5 rounded bg-[#F7F2E6] hover:bg-[#242424] hover:text-[#FFFDF7] text-[10px] font-semibold font-mono border border-[#242424]/20 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
