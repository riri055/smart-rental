import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatusBadge, RiskBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import { LeafletMap } from '../components/common/LeafletMap';
import { EnterpriseAreaChart } from '../components/common/Charts';
import {
  Sliders,
  Building2,
  Calendar,
  Clock,
  Fuel,
  User,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ArrowLeftRight,
  Activity,
  History,
  Wrench,
  Navigation,
  FileCheck,
  ChevronDown
} from 'lucide-react';

export const AssetDetailsScreen: React.FC = () => {
  const {
    assets,
    sites,
    selectedAsset,
    selectedAssetId,
    selectAsset,
    assetAlerts,
    assetLifecycle,
    recommendations,
    acceptRecommendation,
    resolveAlert,
    navigateTo,
    assignOperator,
    usageLogs
  } = useFleet();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [operatorIdInput, setOperatorIdInput] = useState('OP104');
  const [operatorNameInput, setOperatorNameInput] = useState('Priya Nair (Master Excavator)');

  const asset = selectedAsset || assets[0];
  const isDemoAnomaly = asset.id === 'EQX1007';
  const isDemoRebalance = asset.id === 'EQX1004';

  // Find recommendations for this specific asset
  const assetRecommendations = recommendations.filter((r) => r.assetId === asset.id);

  // Sample 7-day usage chart data for this asset
  const assetLogs = usageLogs.filter((u) => u.assetId === asset.id);
  const chartData = (assetLogs.length > 0 ? assetLogs : [
    { date: '2025-05-14', operatingHours: isDemoAnomaly ? 0 : 5.8, idleHours: isDemoAnomaly ? 12 : 2.2, utilization: isDemoAnomaly ? 0 : 72 },
    { date: '2025-05-15', operatingHours: isDemoAnomaly ? 0 : 6.4, idleHours: isDemoAnomaly ? 12 : 1.9, utilization: isDemoAnomaly ? 0 : 77 },
    { date: '2025-05-16', operatingHours: isDemoAnomaly ? 0 : 4.5, idleHours: isDemoAnomaly ? 12 : 3.1, utilization: isDemoAnomaly ? 0 : 59 },
    { date: '2025-05-17', operatingHours: isDemoAnomaly ? 0 : 7.1, idleHours: isDemoAnomaly ? 12 : 1.4, utilization: isDemoAnomaly ? 0 : 83 },
    { date: '2025-05-18', operatingHours: isDemoAnomaly ? 0 : 6.8, idleHours: isDemoAnomaly ? 12 : 2.0, utilization: isDemoAnomaly ? 0 : 77 },
    { date: '2025-05-19', operatingHours: isDemoAnomaly ? 0 : 5.9, idleHours: isDemoAnomaly ? 12 : 2.8, utilization: isDemoAnomaly ? 0 : 68 },
    { date: '2025-05-20', operatingHours: isDemoAnomaly ? 0 : 6.2, idleHours: isDemoAnomaly ? 12 : 2.4, utilization: isDemoAnomaly ? 0 : 72 }
  ]).map((d) => ({
    label: d.date.substring(5), // MM-DD
    operating: d.operatingHours,
    idle: d.idleHours
  }));

  const handleAssignOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignOperator(asset.id, operatorIdInput, operatorNameInput);
    setAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Asset Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424]/15 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              ASSET TELEMETRY & DIAGNOSTICS
            </h1>

            {/* Quick Switch Dropdown */}
            <select
              value={selectedAssetId}
              onChange={(e) => selectAsset(e.target.value)}
              className="text-xs font-mono font-bold bg-[#FFFDF7] border border-[#242424] px-2.5 py-1 rounded shadow-sm outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.equipmentType} ({a.siteId})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[#78756E] mt-1">
            Real-time IoT sensors, operating telemetry history, and predictive AI model evaluations.
          </p>
        </div>

        {/* Demo Fast Switch Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#78756E] uppercase">Demo Focus:</span>
          <button
            onClick={() => selectAsset('EQX1007')}
            className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded border transition-colors ${
              asset.id === 'EQX1007'
                ? 'bg-[#C62828] text-white border-[#C62828]'
                : 'bg-[#FFFDF7] text-[#C62828] border-[#C62828]/40 hover:bg-[#FEE2E2]'
            }`}
          >
            EQX1007 (Critical Anomaly)
          </button>
          <button
            onClick={() => selectAsset('EQX1004')}
            className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded border transition-colors ${
              asset.id === 'EQX1004'
                ? 'bg-[#F7C83E] text-[#242424] border-[#242424]'
                : 'bg-[#FFFDF7] text-[#242424] border-[#242424]/30 hover:bg-[#FEF6DC]'
            }`}
          >
            EQX1004 (S004→S003)
          </button>
        </div>
      </div>

      {/* Primary Asset Card */}
      <div className="rounded-lg border border-[#242424] bg-[#FFFDF7] p-5 shadow-[3px_3px_0px_rgba(36,36,36,0.15)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#242424]/10 pb-4 mb-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-lg bg-[#F7F2E6] border border-[#242424]/20 text-[#242424] mt-0.5">
              <EquipmentIcon type={asset.equipmentType} size={28} />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xl font-extrabold text-[#242424]">{asset.id}</span>
                <StatusBadge status={asset.status} size="md" />
                <RiskBadge risk={asset.riskLevel} />
                <span className="text-xs font-mono text-[#78756E] bg-[#F7F2E6] px-2 py-0.5 rounded border border-[#242424]/10">
                  {asset.serialNumber}
                </span>
              </div>

              <h2 className="text-base font-bold text-[#242424] mt-1">
                {asset.modelName} ({asset.year})
              </h2>

              <div className="flex items-center gap-4 text-xs text-[#78756E] mt-1 flex-wrap">
                <span>Category: <strong className="text-[#242424]">{asset.equipmentType}</strong></span>
                <span>•</span>
                <span>Base Rate: <strong className="text-[#242424]">${asset.dailyRate}/day</strong></span>
                <span>•</span>
                <span>Condition: <strong className="text-[#242424]">Grade {asset.conditionScore}</strong></span>
                <span>•</span>
                <span>Telemetry: <strong className="text-[#2E7D32]">Online (CAN-Bus v4.2)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('check-in-out', asset.id)}
              className="px-3 py-2 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#F7C83E]" />
              <span>Check In / Out Asset</span>
            </button>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="px-3 py-2 rounded-md bg-[#F7F2E6] hover:bg-[#EAE5D8] border border-[#242424] text-xs font-semibold text-[#242424] transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#242424]" />
              <span>Assign Operator</span>
            </button>
          </div>
        </div>

        {/* 5 Real-Time Telemetry Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
          <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
            <span className="text-[10px] text-[#78756E] block font-sans font-semibold">AVERAGE UTILIZATION</span>
            <span className="text-xl font-bold text-[#242424]">{asset.utilization}%</span>
            <div className="w-full bg-[#DED8C9] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${
                  asset.utilization >= 70
                    ? 'bg-[#2E7D32]'
                    : asset.utilization >= 30
                    ? 'bg-[#F7C83E]'
                    : 'bg-[#C62828]'
                }`}
                style={{ width: `${asset.utilization}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
            <span className="text-[10px] text-[#78756E] block font-sans font-semibold">ENGINE HOURS / DAY</span>
            <span className="text-xl font-bold text-[#242424]">{asset.engineHoursPerDay} hrs</span>
            <span className="text-[10px] text-[#78756E] block mt-1">Productive run-time</span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
            <span className="text-[10px] text-[#78756E] block font-sans font-semibold">IDLE HOURS / DAY</span>
            <span className={`text-xl font-bold ${asset.idleHoursPerDay >= 10 ? 'text-[#C62828]' : 'text-[#242424]'}`}>
              {asset.idleHoursPerDay} hrs
            </span>
            <span className="text-[10px] text-[#78756E] block mt-1">Engine on / no work</span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
            <span className="text-[10px] text-[#78756E] block font-sans font-semibold">CUMULATIVE RUNTIME</span>
            <span className="text-xl font-bold text-[#242424]">{asset.totalEngineHours} hrs</span>
            <span className="text-[10px] text-[#78756E] block mt-1">Lifetime meter reading</span>
          </div>

          <div className="p-3 rounded-md bg-[#F7F2E6] border border-[#242424]/10">
            <span className="text-[10px] text-[#78756E] block font-sans font-semibold">FUEL TANK LEVEL</span>
            <span className="text-xl font-bold text-[#242424]">{asset.fuelLevelPct}%</span>
            <span className="text-[10px] text-[#2E7D32] block mt-1">Sufficient for shift</span>
          </div>
        </div>
      </div>

      {/* AI Anomaly & Recommendations Card (Special Highlight) */}
      {(isDemoAnomaly || isDemoRebalance || assetRecommendations.length > 0 || asset.riskLevel === 'Critical') && (
        <div className="rounded-lg border-2 border-[#242424] bg-[#FFFDF7] p-5 shadow-[3px_3px_0px_rgba(36,36,36,0.15)]">
          <div className="flex items-center gap-2 border-b border-[#242424]/15 pb-3 mb-3">
            <div className="p-1 rounded bg-[#F7C83E] text-[#242424]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono tracking-tight text-[#242424]">
                AI ANOMALY ANALYSIS & AUTONOMOUS ACTION PLAN
              </h3>
              <p className="text-[11px] text-[#78756E]">
                Neural model evaluation based on CAN-bus sensor telemetry & geospatial demand history
              </p>
            </div>
          </div>

          {/* EQX1007 Specific Demo Diagnosis */}
          {isDemoAnomaly && (
            <div className="rounded-md border border-[#C62828] bg-[#FEE2E2]/60 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#C62828] text-white text-xs font-mono font-bold">
                    CRITICAL ZERO-UTILIZATION ANOMALY
                  </span>
                  <span className="text-xs font-mono font-bold text-[#C62828]">Confidence: 98.4%</span>
                </div>
              </div>

              <p className="text-xs text-[#242424] leading-relaxed">
                <strong>Model Diagnosis:</strong> EQX1007 has logged <strong>12.0 hours of idle engine time per day</strong> with <strong>0% productive excavation</strong>. The equipment is currently stationed at Site S003 (North Orbital Expressway) without an assigned certified operator. Fuel burn is causing ~$340/day in pure thermal loss.
              </p>

              <div className="pt-2 border-t border-[#C62828]/30 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#78756E]">
                  <strong>Suggested Action:</strong> Assign certified operator (OP104 - Priya Nair) or revoke check-out to stop idle fuel waste.
                </div>
                <button
                  onClick={() => acceptRecommendation('REC-002')}
                  className="px-3.5 py-1.5 rounded bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Execute AI Fix (Assign Master Operator)
                </button>
              </div>
            </div>
          )}

          {/* EQX1004 Specific Demo Recommendation */}
          {isDemoRebalance && (
            <div className="rounded-md border border-[#F7C83E] bg-[#FEF6DC] p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] text-xs font-mono font-bold">
                    FLEET REBALANCING SIGNAL
                  </span>
                  <span className="text-xs font-mono font-bold text-[#2E7D32]">Confidence: 96.1%</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#2E7D32]">+$1,450/day Revenue Lift</span>
              </div>

              <p className="text-xs text-[#242424] leading-relaxed">
                <strong>Optimization Recommendation:</strong> EQX1004 is currently stationed at <strong>Site S004 (Tech Corridor Grid)</strong> with an underutilization score of <strong>18.2%</strong>. Site S003 has an urgent predicted excavator shortage (+133%). Reallocating EQX1004 from S004 $\rightarrow$ S003 will resolve the excavator deficit.
              </p>

              <div className="pt-2 border-t border-[#F7C83E]/50 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#605D57]">
                  <strong>Target Site:</strong> North Orbital Expressway (S003) · Project: Highway Phase IV
                </div>
                <button
                  onClick={() => acceptRecommendation('REC-001')}
                  className="px-3.5 py-1.5 rounded bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold transition-colors shadow-sm"
                >
                  Accept & Transfer S004 → S003
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Telemetry Chart & Location Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 7-Day Usage Telemetry Trend (7 Cols) */}
        <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                7-Day Operating Hours vs Idle Hours Telemetry
              </h3>
              <p className="text-[11px] text-[#78756E]">Daily IoT CAN-bus engine sensor stream</p>
            </div>
            <span className="text-xs font-mono text-[#78756E] bg-[#F7F2E6] px-2 py-0.5 rounded border border-[#242424]/10">
              Site {asset.siteId}
            </span>
          </div>

          <EnterpriseAreaChart data={chartData} height={230} />
        </div>

        {/* Current Works Location Card with Mini Map (5 Cols) */}
        <div className="lg:col-span-5 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Current Location & Assignment
              </h3>
              <span className="text-xs font-mono font-bold text-[#242424] bg-[#F7F2E6] px-2 py-0.5 rounded border border-[#242424]/10">
                {asset.siteId}
              </span>
            </div>

            <div className="h-44 rounded border border-[#242424]/20 overflow-hidden mb-3">
              <LeafletMap
                assets={[asset]}
                sites={sites}
                selectedAssetId={asset.id}
                height="100%"
                center={[asset.latitude, asset.longitude]}
                zoom={14}
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#242424]/10">
                <span className="text-[#78756E]">Site Facility:</span>
                <span className="font-semibold text-[#242424]">{asset.siteName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#242424]/10">
                <span className="text-[#78756E]">Active Project:</span>
                <span className="font-semibold text-[#242424]">{asset.projectName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#78756E]">Assigned Operator:</span>
                <span className="font-semibold text-[#242424]">{asset.operatorName} ({asset.operatorId || 'None'})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts on this Asset & Full Lifecycle History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Alerts for this Asset (5 Cols) */}
        <div className="lg:col-span-5 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C62828]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Active Alerts for {asset.id}
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F2E6] text-[#242424]">
              {assetAlerts.length} Recorded
            </span>
          </div>

          {assetAlerts.length > 0 ? (
            <div className="space-y-3">
              {assetAlerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-3 rounded-md border text-xs ${
                    al.status === 'Open'
                      ? 'bg-[#FEE2E2]/40 border-[#C62828]/40'
                      : 'bg-[#EBF5ED] border-[#2E7D32]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#242424]">{al.alertType}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        al.status === 'Open' ? 'bg-[#C62828] text-white' : 'bg-[#2E7D32] text-white'
                      }`}
                    >
                      {al.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#605D57] mb-2">{al.description}</p>
                  
                  {al.status === 'Open' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => resolveAlert(al.id)}
                        className="px-2.5 py-1 rounded bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-[10px] font-semibold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#78756E]">
              <CheckCircle2 className="w-6 h-6 text-[#2E7D32] mx-auto mb-2" />
              No active telemetry alerts on this asset. Operating normally.
            </div>
          )}
        </div>

        {/* Full Asset Lifecycle Timeline (7 Cols) */}
        <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#242424]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Asset Lifecycle Timeline
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#78756E]">Verified Audit Trail</span>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#242424]/15">
            {assetLifecycle.map((evt) => (
              <div key={evt.id} className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-1.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#FFFDF7] border-2 border-[#242424] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F7C83E]" />
                </div>

                <div className="flex-1 bg-[#F7F2E6] p-3 rounded-md border border-[#242424]/10 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#242424]">{evt.title}</span>
                    <span className="font-mono text-[10px] text-[#78756E]">{evt.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#605D57]">{evt.description}</p>
                  <div className="mt-2 text-[10px] font-mono text-[#78756E]">
                    Actor: <span className="font-semibold text-[#242424]">{evt.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assign Operator Modal Dialog */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-[#242424]/60 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignOperatorSubmit}
            className="bg-[#FFFDF7] rounded-lg border border-[#242424] shadow-[4px_4px_0px_rgba(36,36,36,0.3)] max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3">
              <div className="font-mono font-bold text-sm text-[#242424]">
                ASSIGN OPERATOR TO {asset.id}
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-xs text-[#78756E] hover:text-[#242424]"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Operator ID:
              </label>
              <input
                type="text"
                value={operatorIdInput}
                onChange={(e) => setOperatorIdInput(e.target.value)}
                className="w-full bg-[#F7F2E6] border border-[#242424]/20 p-2 rounded text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Operator Full Name & Certification:
              </label>
              <input
                type="text"
                value={operatorNameInput}
                onChange={(e) => setOperatorNameInput(e.target.value)}
                className="w-full bg-[#F7F2E6] border border-[#242424]/20 p-2 rounded text-xs"
                required
              />
            </div>

            <div className="p-3 rounded bg-[#FEF6DC] border border-[#F7C83E] text-xs text-[#242424]">
              Binding operator credentials will automatically update active CAN-bus transponder logs and resolve unassigned asset warnings.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]/10">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-3 py-1.5 rounded border border-[#242424] text-xs font-semibold text-[#242424]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#242424] text-xs font-semibold text-[#FFFDF7] hover:bg-[#383838]"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
