import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getAnomalies,
  getDemandForecast,
  getImpact,
  getRecommendations,
} from '../api/client';
import type {
  Anomaly,
  DemandForecast,
  Impact,
  Recommendation,
} from '../api/types';
import { useFleet } from '../context/FleetContext';

const STATUS_STYLES: Record<string, string> = {
  Sufficient: 'bg-[#EBF5ED] text-[#2E7D32] border-[#2E7D32]/40',
  Watch: 'bg-[#FEF3C7] text-[#B45309] border-[#B45309]/40',
  Shortage: 'bg-[#FEE2E2] text-[#C62828] border-[#C62828]/40',
};

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-[#FEE2E2] text-[#C62828] border-[#C62828]/40',
  High: 'bg-[#FDE8D7] text-[#C2410C] border-[#C2410C]/40',
  Medium: 'bg-[#FEF3C7] text-[#B45309] border-[#B45309]/40',
  Low: 'bg-[#EBF5ED] text-[#2E7D32] border-[#2E7D32]/40',
};

const SEVERITY_DOT: Record<string, string> = {
  Critical: 'bg-[#C62828]',
  High: 'bg-[#C2410C]',
  Medium: 'bg-[#B45309]',
  Low: 'bg-[#2E7D32]',
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function statusClass(status: string): string {
  return STATUS_STYLES[status] ?? 'bg-[#F7F2E6] text-[#242424] border-[#242424]/20';
}

function severityClass(severity: string): string {
  return SEVERITY_STYLES[severity] ?? 'bg-[#F7F2E6] text-[#242424] border-[#242424]/20';
}

function severityDot(severity: string): string {
  return SEVERITY_DOT[severity] ?? 'bg-[#78756E]';
}

const HORIZONS = [7, 14, 30];

export const AiIntelligenceScreen: React.FC = () => {
  const { navigateTo } = useFleet();

  const [forecasts, setForecasts] = useState<DemandForecast[] | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [recoLoading, setRecoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demand selectors
  const [horizon, setHorizon] = useState(7);
  const [demandSite, setDemandSite] = useState('all');
  const [demandType, setDemandType] = useState('all');

  // Anomaly filter
  const [anomalySeverity, setAnomalySeverity] = useState('all');

  // Recommendation selectors
  const [recoSite, setRecoSite] = useState('');
  const [recoType, setRecoType] = useState('');

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fc, an, imp] = await Promise.all([
        getDemandForecast({ horizon_days: horizon }),
        getAnomalies(),
        getImpact(),
      ]);
      setForecasts(fc);
      setAnomalies(an);
      setImpact(imp);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [horizon]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  const siteOptions = useMemo(() => {
    const set = new Set((forecasts ?? []).map((f) => f.site_id));
    return Array.from(set).sort();
  }, [forecasts]);

  const typeOptions = useMemo(() => {
    const set = new Set((forecasts ?? []).map((f) => f.equipment_type));
    return Array.from(set).sort();
  }, [forecasts]);

  // Default recommendation selectors to the first available combo.
  useEffect(() => {
    if (recoSite === '' && siteOptions.length > 0) {
      setRecoSite(siteOptions[0]);
    }
    if (recoType === '' && typeOptions.length > 0) {
      setRecoType(typeOptions[0]);
    }
  }, [siteOptions, typeOptions, recoSite, recoType]);

  useEffect(() => {
    if (!recoSite || !recoType) return;
    let cancelled = false;
    setRecoLoading(true);
    getRecommendations({ site_id: recoSite, equipment_type: recoType })
      .then((data) => {
        if (!cancelled) setRecommendations(data);
      })
      .catch(() => {
        if (!cancelled) setRecommendations([]);
      })
      .finally(() => {
        if (!cancelled) setRecoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recoSite, recoType]);

  const filteredForecasts = useMemo(
    () =>
      (forecasts ?? []).filter(
        (f) =>
          (demandSite === 'all' || f.site_id === demandSite) &&
          (demandType === 'all' || f.equipment_type === demandType),
      ),
    [forecasts, demandSite, demandType],
  );

  const detail = useMemo(() => {
    if (demandSite !== 'all' && demandType !== 'all') {
      return (
        forecasts?.find(
          (f) => f.site_id === demandSite && f.equipment_type === demandType,
        ) ?? null
      );
    }
    return null;
  }, [forecasts, demandSite, demandType]);

  const filteredAnomalies = useMemo(
    () =>
      (anomalies ?? []).filter(
        (a) => anomalySeverity === 'all' || a.severity === anomalySeverity,
      ),
    [anomalies, anomalySeverity],
  );

  const anomalyCounts = useMemo(() => {
    const total = (anomalies ?? []).length;
    const critical = (anomalies ?? []).filter(
      (a) => a.severity === 'Critical',
    ).length;
    const high = (anomalies ?? []).filter((a) => a.severity === 'High').length;
    return { total, critical, high };
  }, [anomalies]);

  const chartData = useMemo(() => {
    if (!detail) return [];
    return detail.history.map((h) => ({
      date: h.date.slice(5),
      demand: h.demand,
    }));
  }, [detail]);

  if (loading && !forecasts) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-[#78756E]">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs font-mono">Running explainable AI analysis…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 max-w-md mx-auto text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-[#C62828] mx-auto" />
        <h2 className="text-sm font-bold text-[#242424]">
          Unable to reach the backend
        </h2>
        <p className="text-xs text-[#78756E] leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#242424]/15 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              AI INTELLIGENCE &amp; DEMAND FORECASTING
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] border border-[#242424]">
              Explainable Rules
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Deterministic demand forecasts, telemetry anomaly detection, and asset
            recommendations — clearly labelled as{' '}
            <span className="font-bold text-[#242424]">forecast / simulated decision support</span>.
          </p>
        </div>
        <button
          onClick={() => void loadCore()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold transition-all disabled:opacity-50"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Demand forecast */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-3">
        <SectionHeading
          title="Demand Forecast"
          subtitle="Rolling weighted average + linear trend per site and equipment type."
        />
        <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Site"
              value={demandSite}
              onChange={setDemandSite}
              options={[
                { value: 'all', label: 'All sites' },
                ...siteOptions.map((s) => ({ value: s, label: s })),
              ]}
            />
            <Select
              label="Equipment type"
              value={demandType}
              onChange={setDemandType}
              options={[
                { value: 'all', label: 'All types' },
                ...typeOptions.map((t) => ({ value: t, label: t })),
              ]}
            />
            <div>
              <label className="block text-xs font-bold font-mono text-[#242424] mb-1.5">
                Horizon
              </label>
              <div className="flex items-center rounded-lg bg-[#F7F2E6] p-1 border border-[#242424]/20">
                {HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      horizon === h
                        ? 'bg-[#242424] text-[#FFFDF7] shadow-sm'
                        : 'text-[#605D57] hover:text-[#242424]'
                    }`}
                  >
                    {h}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {detail ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Detail card */}
            <div className="lg:col-span-5 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#242424]">
                    {detail.site_id} · {detail.equipment_type}
                  </h3>
                  <p className="text-[11px] text-[#78756E]">
                    {detail.site_name} — {detail.horizon_days}-day horizon
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold ${statusClass(detail.status)}`}
                >
                  {detail.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <Metric label="Predicted demand" value={round1(detail.predicted_demand)} />
                <Metric label="Recent avg" value={round1(detail.recent_average)} />
                <Metric label="Trend /day" value={`${detail.trend >= 0 ? '+' : ''}${round1(detail.trend)}`} />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <Metric label="Available now" value={detail.currently_available} />
                <Metric label="Rented" value={detail.currently_rented} />
                <Metric label="Becoming avail." value={detail.becoming_available} />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <Metric label="Expected avail." value={detail.expected_available} />
                <Metric label="Demand gap" value={round1(detail.demand_gap)} />
                <Metric label="Confidence" value={detail.confidence} />
              </div>

              <div className="mt-4 rounded border border-[#242424]/15 bg-[#F7F2E6] p-3">
                <div className="text-[10px] font-mono uppercase tracking-wide text-[#78756E] mb-1">
                  Fleet context
                </div>
                <p className="text-xs text-[#605D57]">
                  {detail.fleet_total} {detail.equipment_type}(s) fleet-wide ·{' '}
                  {detail.fleet_available} currently free.
                </p>
              </div>

              <p className="mt-3 text-xs text-[#605D57] leading-relaxed">
                {detail.explanation}
              </p>
            </div>

            {/* History chart */}
            <div className="lg:col-span-7 rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Recent daily rental demand
              </h3>
              <p className="text-[11px] text-[#78756E] mb-3">
                Last 30 days · dashed line = recent average
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE5D8" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontFamily: 'monospace' }}
                      interval="preserveStartEnd"
                      stroke="#78756E"
                    />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="#78756E" />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        fontFamily: 'monospace',
                        border: '1px solid #242424',
                        borderRadius: 6,
                      }}
                      formatter={(value: number) => [value, 'demand']}
                    />
                    <ReferenceLine
                      y={detail.recent_average}
                      stroke="#C62828"
                      strokeDasharray="4 2"
                      strokeWidth={1.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="demand"
                      stroke="#242424"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm text-xs text-[#78756E]">
            Select a specific site and equipment type to see the forecast detail and
            history chart.
          </div>
        )}

        {/* Overview table */}
        <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#242424]/15 flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
              Forecast overview
            </h3>
            <span className="text-[11px] text-[#78756E]">
              {filteredForecasts.length} combinations
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F7F2E6] text-[#605D57]">
                <tr>
                  <th className="px-4 py-2 font-bold">Site</th>
                  <th className="px-4 py-2 font-bold">Type</th>
                  <th className="px-4 py-2 font-bold text-right">Predicted</th>
                  <th className="px-4 py-2 font-bold text-right">Expected avail.</th>
                  <th className="px-4 py-2 font-bold text-right">Gap</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredForecasts.map((f) => (
                  <tr
                    key={`${f.site_id}-${f.equipment_type}`}
                    className="border-t border-[#242424]/10 hover:bg-[#FAF7EE]"
                  >
                    <td className="px-4 py-2 text-[#242424] font-bold">{f.site_id}</td>
                    <td className="px-4 py-2 text-[#605D57]">{f.equipment_type}</td>
                    <td className="px-4 py-2 text-right text-[#242424]">
                      {round1(f.predicted_demand)}
                    </td>
                    <td className="px-4 py-2 text-right text-[#605D57]">
                      {f.expected_available}
                    </td>
                    <td className="px-4 py-2 text-right text-[#242424]">
                      {f.demand_gap >= 0 ? '+' : ''}
                      {round1(f.demand_gap)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold ${statusClass(f.status)}`}
                      >
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredForecasts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[#78756E]">
                      No forecast combinations match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Anomalies */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-3">
        <SectionHeading
          title="Anomaly Detection"
          subtitle="Rule-based telemetry flags: excessive idle, high engine temperature, abnormal fuel, unassigned equipment."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Total anomalies" value={anomalyCounts.total} tone="dark" />
          <MiniStat label="Critical" value={anomalyCounts.critical} tone="red" />
          <MiniStat label="High" value={anomalyCounts.high} tone="orange" />
          <MiniStat
            label="Medium & Low"
            value={anomalyCounts.total - anomalyCounts.critical - anomalyCounts.high}
            tone="amber"
          />
        </div>

        <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            {['all', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
              <button
                key={s}
                onClick={() => setAnomalySeverity(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                  anomalySeverity === s
                    ? 'bg-[#242424] text-[#FFFDF7] border-[#242424]'
                    : 'bg-[#F7F2E6] text-[#605D57] border-[#242424]/20 hover:text-[#242424]'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredAnomalies.map((a) => (
              <div
                key={a.anomaly_id}
                className="rounded border border-[#242424]/15 p-3 hover:border-[#242424]/40 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-bold ${severityClass(a.severity)}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${severityDot(a.severity)}`} />
                    {a.severity}
                  </span>
                  <button
                    onClick={() => navigateTo('asset-details', a.equipment_id)}
                    className="font-mono text-xs font-bold text-[#1565C0] hover:underline"
                  >
                    {a.equipment_id} · {a.equipment_type}
                  </button>
                  <span className="text-[10px] font-mono text-[#78756E]">
                    {a.anomaly_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-[#78756E] ml-auto">
                    Site: {a.site ?? 'Unassigned'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#605D57] leading-relaxed">
                  {a.explanation}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-[#78756E]">
                    Recommended:
                  </span>
                  <span className="text-[11px] font-bold text-[#242424] border border-[#242424]/20 rounded px-1.5 py-0.5 bg-[#F7F2E6]">
                    {a.recommended_action}
                  </span>
                </div>
              </div>
            ))}
            {filteredAnomalies.length === 0 && (
              <div className="py-8 text-center text-xs text-[#78756E]">
                No anomalies match the current filter.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Recommendations */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-3">
        <SectionHeading
          title="Asset Recommendations"
          subtitle="Transparent weighted ranking of which existing asset to deploy for a target site and type."
        />
        <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Target site"
              value={recoSite}
              onChange={setRecoSite}
              options={siteOptions.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Equipment type needed"
              value={recoType}
              onChange={setRecoType}
              options={typeOptions.map((t) => ({ value: t, label: t }))}
            />
          </div>
        </div>

        {recoLoading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-[#78756E] py-10">
            <Loader2 className="w-4 h-4 animate-spin" /> Ranking candidate assets…
          </div>
        ) : (
          <div className="space-y-2.5">
            {(recommendations ?? []).map((r) => (
              <div
                key={r.equipment_id}
                className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm hover:border-[#242424]/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="w-8 h-8 rounded border border-[#242424] bg-[#F7C83E] text-[#242424] font-mono font-bold text-sm flex items-center justify-center">
                      {r.rank}
                    </span>
                    <button
                      onClick={() => navigateTo('asset-details', r.equipment_id)}
                      className="font-mono text-xs font-bold text-[#1565C0] hover:underline"
                    >
                      {r.equipment_id}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F2E6] text-[#242424] border border-[#242424]/15">
                        {r.availability_status}
                      </span>
                      <span className="text-[11px] text-[#78756E] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {r.current_site ?? 'Unassigned'}
                      </span>
                      <span className="text-[11px] text-[#78756E]">
                        Condition {Math.round(r.condition_score)}/100
                      </span>
                      {r.utilization != null && (
                        <span className="text-[11px] text-[#78756E]">
                          Utilization {Math.round(r.utilization * 100)}%
                        </span>
                      )}
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {r.reasons.map((reason) => (
                        <li key={reason} className="text-[11px] text-[#605D57] flex gap-1.5">
                          <span className="text-[#F7C83E]">▸</span> {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="font-mono text-2xl font-bold text-[#242424]">
                      {round1(r.recommendation_score)}
                    </div>
                    <div className="text-[10px] text-[#78756E]">/ 100 score</div>
                  </div>
                </div>
              </div>
            ))}
            {(recommendations ?? []).length === 0 && !recoLoading && (
              <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-8 text-center text-xs text-[#78756E]">
                No {recoType} assets are available to recommend for {recoSite}.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Projected impact */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-3">
        <SectionHeading
          title="Projected Impact"
          subtitle="Simulated fleet-level effect of rebalancing idle assets — not a commitment."
        />
        <div className="rounded-lg border-2 border-dashed border-[#F7C83E]/70 bg-[#FFFDF7] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#F7C83E]" />
            <span className="text-[11px] font-mono font-bold text-[#242424]">
              Projected / simulated impact
            </span>
          </div>

          {impact ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat
                label="Baseline utilization"
                value={`${impact.baseline_utilization ?? '—'}%`}
                tone="dark"
              />
              <MiniStat
                label="Baseline idle ratio"
                value={`${impact.baseline_idle_ratio ?? '—'}%`}
                tone="red"
              />
              <MiniStat
                label="Projected idle ratio"
                value={`${impact.projected_idle_ratio ?? '—'}%`}
                tone="green"
              />
              <MiniStat
                label="Idle reduction (hrs)"
                value={round1(impact.idle_reduction_hours)}
                tone="green"
              />
              <MiniStat
                label="Total demand gap"
                value={round1(impact.total_demand_gap)}
                tone="red"
              />
              <MiniStat
                label="Shortage combos"
                value={impact.shortage_count}
                tone="red"
              />
              <MiniStat
                label="Excess-idle assets"
                value={impact.excess_idle_asset_count}
                tone="orange"
              />
              <MiniStat
                label="Reassignable assets"
                value={impact.reassignable_assets}
                tone="amber"
              />
            </div>
          ) : (
            <div className="text-xs text-[#78756E]">Impact data unavailable.</div>
          )}
        </div>
      </section>
    </div>
  );
};

const SectionHeading: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div>
    <h2 className="text-sm font-bold font-mono tracking-tight text-[#242424]">
      {title}
    </h2>
    <p className="text-xs text-[#78756E]">{subtitle}</p>
  </div>
);

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-bold font-mono text-[#242424] mb-1.5">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono font-medium text-[#242424] outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const Metric: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="rounded border border-[#242424]/15 bg-[#FAF7EE] p-2.5">
    <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#78756E]">
      {label}
    </div>
    <div className="text-lg font-mono font-bold text-[#242424] mt-0.5">{value}</div>
  </div>
);

const MiniStat: React.FC<{
  label: string;
  value: string | number;
  tone: 'dark' | 'red' | 'orange' | 'amber' | 'green';
}> = ({ label, value, tone }) => {
  const toneClasses: Record<string, string> = {
    dark: 'border-[#242424] text-[#242424]',
    red: 'border-[#C62828]/40 text-[#C62828]',
    orange: 'border-[#C2410C]/40 text-[#C2410C]',
    amber: 'border-[#B45309]/40 text-[#B45309]',
    green: 'border-[#2E7D32]/40 text-[#2E7D32]',
  };
  return (
    <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm">
      <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#78756E]">
        {label}
      </div>
      <div className={`text-2xl font-mono font-bold mt-1 ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
};
