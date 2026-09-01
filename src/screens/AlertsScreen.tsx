import React, { useState, useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/StatusBadge';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  Filter,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';

export const AlertsScreen: React.FC = () => {
  const {
    alerts,
    resolveAlert,
    navigateTo,
    acceptRecommendation,
    recommendations,
    stats
  } = useFleet();

  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((al) => {
      if (severityFilter !== 'all' && al.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && al.status !== statusFilter) return false;
      if (typeFilter !== 'all' && al.alertType !== typeFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, statusFilter, typeFilter]);

  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && a.status === 'Open').length;
  const highCount = alerts.filter((a) => a.severity === 'High' && a.status === 'Open').length;
  const overdueAlerts = alerts.filter((a) => a.alertType === 'Overdue Return' && a.status === 'Open').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">FLEET ALERTS & ANOMALIES</h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FEE2E2] text-[#C62828] border border-[#C62828]/40">
              {stats.openAlertsCount} Unresolved
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Automated threshold anomalies, overdue return alerts, and underutilization flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('ai-intelligence')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F7C83E] hover:bg-[#E5B728] text-[#242424] text-xs font-bold border border-[#242424] shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Root Cause Analysis</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Critical Anomalies"
          value={criticalCount}
          subtext="Requires immediate intervention"
          badgeText="Critical"
          badgeVariant="red"
          highlight={criticalCount > 0}
          icon={<ShieldAlert className="w-4 h-4" />}
        />
        <StatCard
          title="High Priority Alerts"
          value={highCount}
          subtext="Unassigned or overdue assets"
          badgeText="High"
          badgeVariant="orange"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <StatCard
          title="Overdue Leases"
          value={overdueAlerts}
          subtext="Return date exceeded"
          badgeText="Overdue"
          badgeVariant="red"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title="Resolved Alerts"
          value={alerts.filter((a) => a.status === 'Resolved').length}
          subtext="Historical actions cleared"
          badgeText="Cleared"
          badgeVariant="green"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFDF7] p-3.5 rounded-lg border border-[#242424]/20 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded-md outline-none font-medium"
          >
            <option value="all">All Alert Statuses</option>
            <option value="Open">Open Only ({stats.openAlertsCount})</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded-md outline-none font-medium"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Alert Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded-md outline-none font-medium"
          >
            <option value="all">All Alert Types</option>
            <option value="Excessive Idle Time">Excessive Idle Time</option>
            <option value="Unassigned Rented Asset">Unassigned Rented Asset</option>
            <option value="Underutilization">Underutilization</option>
            <option value="Overdue Return">Overdue Return</option>
            <option value="Return Approaching">Return Approaching</option>
          </select>

          {(statusFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSeverityFilter('all');
                setTypeFilter('all');
              }}
              className="text-xs text-[#78756E] hover:text-[#242424] underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-[#78756E] font-mono">
          Showing {filteredAlerts.length} Alerts
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((al) => {
            const isDemoEQX1007 = al.assetId === 'EQX1007';
            const isDemoEQX1004 = al.assetId === 'EQX1004';

            return (
              <div
                key={al.id}
                className={`rounded-lg border p-4.5 bg-[#FFFDF7] transition-all shadow-sm flex flex-col justify-between ${
                  al.status === 'Open'
                    ? al.severity === 'Critical'
                      ? 'border-[#C62828] bg-[#FFF8F8] shadow-[2px_2px_0px_#C62828]'
                      : 'border-[#242424]/30 hover:border-[#242424]'
                    : 'border-[#242424]/10 bg-[#FAF7EE] opacity-80'
                }`}
              >
                <div>
                  {/* Alert Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242424]/10 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#242424]">{al.id}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F7F2E6] text-[#242424] border border-[#242424]/15">
                        {al.assetId} · {al.equipmentType}
                      </span>
                      <RiskBadge risk={al.severity} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#78756E]">{al.timestamp}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          al.status === 'Open'
                            ? 'bg-[#C62828] text-white'
                            : 'bg-[#2E7D32] text-white'
                        }`}
                      >
                        {al.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-[#242424] mb-1">
                    {al.alertType}: {al.assetName} (Site {al.siteId})
                  </h3>
                  <p className="text-xs text-[#605D57] leading-relaxed mb-3">
                    {al.description}
                  </p>

                  {/* Recommended Action Pill */}
                  <div className="p-2.5 rounded bg-[#F7F2E6] border border-[#242424]/10 text-xs text-[#242424] flex items-start gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#F7C83E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono">AI Recommended Action:</strong> {al.recommendedAction}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-[#242424]/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => navigateTo('asset-details', al.assetId)}
                    className="text-xs font-semibold text-[#242424] hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Asset Telemetry ({al.assetId})</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    {al.status === 'Open' && (
                      <>
                        {isDemoEQX1004 && (
                          <button
                            onClick={() => acceptRecommendation('REC-001')}
                            className="px-3 py-1 rounded bg-[#F7C83E] hover:bg-[#E5B728] text-[#242424] text-xs font-bold border border-[#242424] transition-colors"
                          >
                            Execute AI Reallocation (S004→S003)
                          </button>
                        )}

                        {isDemoEQX1007 && (
                          <button
                            onClick={() => acceptRecommendation('REC-002')}
                            className="px-3 py-1 rounded bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-semibold transition-colors"
                          >
                            Assign Certified Operator
                          </button>
                        )}

                        <button
                          onClick={() => resolveAlert(al.id)}
                          className="px-3 py-1 rounded bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Resolve</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-10 text-center text-xs text-[#78756E]">
            <CheckCircle2 className="w-8 h-8 text-[#2E7D32] mx-auto mb-2" />
            No alerts found matching the current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
