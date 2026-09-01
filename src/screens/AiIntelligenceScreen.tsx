import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import { EnterpriseBarChart } from '../components/common/Charts';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Building2,
  Clock,
  Layers,
  ArrowLeftRight,
  Check,
  X
} from 'lucide-react';

export const AiIntelligenceScreen: React.FC = () => {
  const {
    recommendations,
    demandForecasts,
    assets,
    sites,
    acceptRecommendation,
    dismissRecommendation,
    navigateTo,
    stats
  } = useFleet();

  const [activeTab, setActiveTab] = useState<'all' | 'demand' | 'anomalies' | 'recommendations'>('all');

  // Chart data: Predicted vs Current Demand across sites
  const demandChartData = demandForecasts.map((df) => ({
    label: df.siteId,
    value: df.currentCount,
    secondaryValue: df.predictedDemand,
    sublabel: df.equipmentType
  }));

  // Filtered anomalies from assets
  const criticalAnomalies = assets.filter((a) => a.riskLevel === 'Critical' || a.idleHoursPerDay >= 9 || a.utilization < 20);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              AI INTELLIGENCE & DEMAND FORECASTING
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] border border-[#242424]">
              Neural Fleet Models
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Geospatial demand forecasts, telemetry anomaly detection, and automated fleet rebalancing.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg bg-[#F7F2E6] p-1 border border-[#242424]/20">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-[#242424] text-[#FFFDF7] shadow-sm' : 'text-[#605D57]'
            }`}
          >
            All AI Engines
          </button>
          <button
            onClick={() => setActiveTab('demand')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'demand' ? 'bg-[#242424] text-[#FFFDF7] shadow-sm' : 'text-[#605D57]'
            }`}
          >
            Demand Forecast
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'anomalies' ? 'bg-[#242424] text-[#FFFDF7] shadow-sm' : 'text-[#605D57]'
            }`}
          >
            Anomaly Detector
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'recommendations' ? 'bg-[#242424] text-[#FFFDF7] shadow-sm' : 'text-[#605D57]'
            }`}
          >
            Rebalancing Plans
          </button>
        </div>
      </div>

      {/* Top 3 AI Model Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Rebalancing Signals"
          value={recommendations.filter((r) => r.status === 'Pending').length}
          subtext="High-confidence dispatch optimizations"
          badgeText="Pending Approval"
          badgeVariant="mustard"
          icon={<Sparkles className="w-4 h-4" />}
        />
        <StatCard
          title="Detected Telemetry Anomalies"
          value={criticalAnomalies.length}
          subtext="Includes EQX1007 0% utilization"
          badgeText="Critical Alert"
          badgeVariant="red"
          highlight={criticalAnomalies.some((a) => a.id === 'EQX1007')}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <StatCard
          title="High Predicted Demand Surge"
          value="Site S003"
          subtext="+133% Excavator Surge over next 14d"
          badgeText="Critical Deficit"
          badgeVariant="red"
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* SECTION 1: SMART RECOMMENDATIONS (Demo Case: EQX1004 S004 -> S003) */}
      {(activeTab === 'all' || activeTab === 'recommendations') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#242424]/15 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F7C83E]" />
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Autonomous Optimization Recommendations
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#78756E]">
              Interactive 1-Click Dispatch Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const isEQX1004 = rec.assetId === 'EQX1004';
              const isEQX1007 = rec.assetId === 'EQX1007';

              return (
                <div
                  key={rec.id}
                  className={`rounded-lg border p-4.5 bg-[#FFFDF7] flex flex-col justify-between transition-all ${
                    rec.status === 'Applied'
                      ? 'border-[#2E7D32] bg-[#EBF5ED]/40 shadow-sm'
                      : isEQX1004
                      ? 'border-2 border-[#F7C83E] shadow-[3px_3px_0px_#F7C83E]'
                      : isEQX1007
                      ? 'border-2 border-[#C62828] shadow-[3px_3px_0px_#C62828]'
                      : 'border-[#242424]/20 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F2E6] text-[#242424] border border-[#242424]/10">
                          {rec.id}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#242424]">{rec.assetId}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#2E7D32] font-bold">
                          {rec.confidence}% Confidence
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            rec.status === 'Applied'
                              ? 'bg-[#2E7D32] text-white'
                              : rec.status === 'Dismissed'
                              ? 'bg-[#78756E] text-white'
                              : 'bg-[#F7C83E] text-[#242424]'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-[#242424] mb-1">
                      {rec.type}: {rec.assetName}
                    </h3>

                    {/* Route transfer visual */}
                    <div className="flex items-center gap-2 p-2 rounded bg-[#F7F2E6] border border-[#242424]/10 text-xs font-mono mb-2.5">
                      <span className="font-bold text-[#605D57]">{rec.sourceSiteName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#242424]" />
                      <span className="font-bold text-[#2E7D32]">{rec.targetSiteName}</span>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-[#605D57] leading-relaxed mb-3">
                      {rec.reason}
                    </p>

                    {/* Impact */}
                    <div className="p-2 rounded bg-[#FEF6DC] border border-[#F7C83E] text-xs text-[#242424] font-medium mb-3">
                      💰 <strong>Projected Impact:</strong> {rec.impact}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#242424]/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigateTo('asset-details', rec.assetId)}
                      className="text-xs font-semibold text-[#242424] hover:underline"
                    >
                      Inspect Telemetry
                    </button>

                    {rec.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dismissRecommendation(rec.id)}
                          className="px-2.5 py-1 rounded border border-[#242424]/30 hover:border-[#242424] text-xs text-[#78756E] hover:text-[#242424] transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => acceptRecommendation(rec.id)}
                          className="px-4 py-1.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-bold shadow-[2px_2px_0px_#F7C83E] transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 text-[#F7C83E]" />
                          <span>Accept Recommendation</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#2E7D32] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Recommendation Applied
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: DEMAND FORECASTING (Demo Focus: Site S003 Excavator Demand) */}
      {(activeTab === 'all' || activeTab === 'demand') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#242424]/15 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1565C0]" />
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Site Demand Forecasting & Deficit Predictions
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#78756E]">
              14-Day Horizon Prediction
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Demand Bar Chart (7 Cols) */}
            <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                    Current Inventory vs Predicted Machine Demand
                  </h3>
                  <p className="text-[11px] text-[#78756E]">Critical deficit highlighted in Site S003</p>
                </div>
              </div>

              <EnterpriseBarChart
                data={demandChartData}
                height={230}
                unit=" units"
                primaryColor="#78756E"
                secondaryColor="#F7C83E"
                primaryName="Current Units"
                secondaryName="14-Day Demand"
              />
            </div>

            {/* Site S003 Spotlight Card & Forecast Cards (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              {demandForecasts.map((df) => {
                const isS003 = df.siteId === 'S003';

                return (
                  <div
                    key={`${df.siteId}-${df.equipmentType}`}
                    className={`rounded-lg border p-3.5 bg-[#FFFDF7] transition-all ${
                      isS003
                        ? 'border-2 border-[#C62828] bg-[#FFF8F8] shadow-[2px_2px_0px_#C62828]'
                        : 'border-[#242424]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-extrabold text-[#242424]">{df.siteId}</span>
                        <span className="text-xs font-bold text-[#242424]">{df.siteName}</span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          df.urgency === 'Critical Deficit'
                            ? 'bg-[#C62828] text-white'
                            : df.urgency === 'Excess Surplus'
                            ? 'bg-[#1565C0] text-white'
                            : 'bg-[#FEF3C7] text-[#D97706]'
                        }`}
                      >
                        {df.urgency} ({df.changePct})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#605D57]">
                        Category: <strong>{df.equipmentType}</strong>
                      </span>
                      <span className="font-mono text-[#242424]">
                        Current: <strong>{df.currentCount}</strong> → Needed: <strong className="text-[#C62828]">{df.predictedDemand}</strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-[#78756E] leading-relaxed">
                      {df.notes}
                    </p>

                    {isS003 && (
                      <div className="mt-2 pt-2 border-t border-[#C62828]/20 flex items-center justify-between">
                        <span className="text-[11px] text-[#C62828] font-bold">
                          ⚡ AI Reallocation Plan Available
                        </span>
                        <button
                          onClick={() => acceptRecommendation('REC-001')}
                          className="px-2.5 py-1 rounded bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-[10px] font-semibold"
                        >
                          Transfer EQX1004 to S003
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ANOMALY DETECTION ENGINE (Demo Focus: EQX1007) */}
      {(activeTab === 'all' || activeTab === 'anomalies') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#242424]/15 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C62828]" />
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Neural Anomaly Detection Engine
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#78756E]">
              IoT Sensor Pattern Outliers
            </span>
          </div>

          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F7F2E6] border-b border-[#242424]/20">
                <tr className="text-[#605D57] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold text-[#242424]">Asset ID</th>
                  <th className="py-3 px-4 font-bold">Equipment Model</th>
                  <th className="py-3 px-4 font-bold">Site</th>
                  <th className="py-3 px-4 font-bold font-mono">Idle Hrs/Day</th>
                  <th className="py-3 px-4 font-bold font-mono">Utilization</th>
                  <th className="py-3 px-4 font-bold">Anomaly Type</th>
                  <th className="py-3 px-4 font-bold font-mono">ML Confidence</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#242424]/10">
                {/* EQX1007 Highlighted Anomaly Row */}
                <tr className="bg-[#FEE2E2]/60 hover:bg-[#FEE2E2]">
                  <td className="py-3 px-4 font-mono font-bold text-[#C62828]">
                    <div className="flex items-center gap-1.5">
                      <span>EQX1007</span>
                      <span className="px-1 py-0.2 rounded bg-[#C62828] text-white text-[9px]">CRITICAL</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#242424]">Volvo EC300E Digger</td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#242424]">Site S003</td>
                  <td className="py-3 px-4 font-mono font-extrabold text-[#C62828]">12.0 hrs / day</td>
                  <td className="py-3 px-4 font-mono font-extrabold text-[#C62828]">0.0%</td>
                  <td className="py-3 px-4 text-[#C62828] font-semibold">
                    Zero Utilization / Excessive Idle / Unassigned Operator
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#C62828]">98.4%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigateTo('asset-details', 'EQX1007')}
                      className="px-2.5 py-1 rounded bg-[#C62828] hover:bg-[#B71C1C] text-white text-[11px] font-semibold font-mono"
                    >
                      Inspect & Fix
                    </button>
                  </td>
                </tr>

                {/* EQX1004 Underutilized Row */}
                <tr className="bg-[#FEF6DC]/60 hover:bg-[#FEF6DC]">
                  <td className="py-3 px-4 font-mono font-bold text-[#242424]">
                    <div className="flex items-center gap-1.5">
                      <span>EQX1004</span>
                      <span className="px-1 py-0.2 rounded bg-[#F7C83E] text-[#242424] text-[9px] font-bold">REBALANCE</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#242424]">Hitachi ZX350LC-6</td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#242424]">Site S004</td>
                  <td className="py-3 px-4 font-mono text-[#242424]">9.0 hrs / day</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#D97706]">18.2%</td>
                  <td className="py-3 px-4 text-[#605D57]">
                    Underutilization Surplus (Candidate for S003 transfer)
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#242424]">96.1%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => acceptRecommendation('REC-001')}
                      className="px-2.5 py-1 rounded bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-[11px] font-semibold font-mono"
                    >
                      Reallocate S003
                    </button>
                  </td>
                </tr>

                {/* EQX1002 Overdue Row */}
                <tr className="hover:bg-[#FAF7EE]">
                  <td className="py-3 px-4 font-mono font-bold text-[#242424]">EQX1002</td>
                  <td className="py-3 px-4 font-medium text-[#242424]">Liebherr LTM 1120-4.1 (Crane)</td>
                  <td className="py-3 px-4 font-mono text-[#242424]">Site S001</td>
                  <td className="py-3 px-4 font-mono text-[#242424]">11.0 hrs / day</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#C62828]">0.0%</td>
                  <td className="py-3 px-4 text-[#605D57]">Lease Overdue 51 Days</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#242424]">92.0%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigateTo('asset-details', 'EQX1002')}
                      className="px-2.5 py-1 rounded bg-[#F7F2E6] hover:bg-[#242424] hover:text-[#FFFDF7] text-[11px] font-semibold font-mono border border-[#242424]/20"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
