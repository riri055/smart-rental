import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { getAlerts, updateAlertStatus } from '../api/client';
import type { Alert } from '../api/types';
import { useFleet } from '../context/FleetContext';

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

function severityClass(severity: string): string {
  return SEVERITY_STYLES[severity] ?? 'bg-[#F7F2E6] text-[#242424] border-[#242424]/20';
}

function severityDot(severity: string): string {
  return SEVERITY_DOT[severity] ?? 'bg-[#78756E]';
}

export const AlertsScreen: React.FC = () => {
  const { navigateTo, addToast } = useFleet();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>('all');
  const [severity, setSeverity] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAlerts(await getAlerts());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set(alerts.map((a) => a.category));
    return Array.from(set).sort();
  }, [alerts]);

  const counts = useMemo(
    () => ({
      total: alerts.length,
      open: alerts.filter((a) => a.status === 'open').length,
      critical: alerts.filter(
        (a) => a.status === 'open' && a.severity === 'Critical',
      ).length,
      acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    }),
    [alerts],
  );

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (category === 'all' || a.category === category) &&
          (severity === 'all' || a.severity === severity) &&
          (status === 'all' || a.status === status),
      ),
    [alerts, category, severity, status],
  );

  const handleToggleStatus = useCallback(
    async (alert: Alert) => {
      const next = alert.status === 'open' ? 'acknowledged' : 'open';
      setActingId(alert.alert_id);
      try {
        const updated = await updateAlertStatus(alert.alert_id, next);
        setAlerts((prev) =>
          prev.map((a) => (a.alert_id === updated.alert_id ? updated : a)),
        );
        addToast(
          next === 'acknowledged'
            ? `Alert ${alert.alert_id} acknowledged`
            : `Alert ${alert.alert_id} reopened`,
          'success',
        );
      } catch {
        addToast('Failed to update alert', 'error');
      } finally {
        setActingId(null);
      }
    },
    [addToast],
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#242424]/15 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              FLEET ALERTS
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] border border-[#242424]">
              Operational Rules
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Overdue returns, unassigned equipment, excessive idle, abnormal usage, and condition
            risk — computed from live fleet data.
          </p>
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold transition-all disabled:opacity-50"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Alerts" value={counts.total} tone="dark" />
        <SummaryCard label="Open" value={counts.open} tone="amber" />
        <SummaryCard label="Critical (Open)" value={counts.critical} tone="red" />
        <SummaryCard label="Acknowledged" value={counts.acknowledged} tone="green" />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'all', label: 'All categories' },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label="Severity"
            value={severity}
            onChange={setSeverity}
            options={[
              { value: 'all', label: 'All severities' },
              { value: 'Critical', label: 'Critical' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
          />
          <div>
            <label className="block text-xs font-bold font-mono text-[#242424] mb-1.5">
              Status
            </label>
            <div className="flex items-center rounded-lg bg-[#F7F2E6] p-1 border border-[#242424]/20">
              {[
                { value: 'all', label: 'All' },
                { value: 'open', label: 'Open' },
                { value: 'acknowledged', label: 'Acknowledged' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    status === opt.value
                      ? 'bg-[#242424] text-[#FFFDF7] shadow-sm'
                      : 'text-[#605D57] hover:text-[#242424]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-[#78756E] py-12">
          <Loader2 className="w-4 h-4 animate-spin" /> Evaluating fleet alerts…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-xs text-[#C62828] bg-[#FEE2E2] border border-[#C62828]/40 rounded p-3">
          <AlertOctagon className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-12 flex flex-col items-center text-center gap-3 shadow-sm">
          <AlertOctagon className="w-8 h-8 text-[#2E7D32]" />
          <p className="text-xs text-[#78756E]">
            No alerts match the current filters.
          </p>
        </div>
      )}

      {/* Alert list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertRow
              key={alert.alert_id}
              alert={alert}
              acting={actingId === alert.alert_id}
              onToggle={() => void handleToggleStatus(alert)}
              onView={() => navigateTo('asset-details', alert.asset_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: number;
  tone: 'dark' | 'amber' | 'red' | 'green';
}> = ({ label, value, tone }) => {
  const toneClasses: Record<string, string> = {
    dark: 'border-[#242424] text-[#242424]',
    amber: 'border-[#B45309]/40 text-[#B45309]',
    red: 'border-[#C62828]/40 text-[#C62828]',
    green: 'border-[#2E7D32]/40 text-[#2E7D32]',
  };
  return (
    <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-wider font-mono font-bold text-[#78756E]">
        {label}
      </div>
      <div className={`text-2xl font-mono font-bold mt-1 ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => {
  return (
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
};

const AlertRow: React.FC<{
  alert: Alert;
  acting: boolean;
  onToggle: () => void;
  onView: () => void;
}> = ({ alert, acting, onToggle, onView }) => {
  const isOpen = alert.status === 'open';
  return (
    <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-4 shadow-sm hover:border-[#242424]/40 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Severity marker */}
        <div className="flex sm:flex-col items-center sm:items-start gap-2 shrink-0 sm:w-24">
          <span
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-bold ${severityClass(alert.severity)}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${severityDot(alert.severity)}`} />
            {alert.severity}
          </span>
          <span className="text-[10px] font-mono text-[#78756E]">{alert.timestamp}</span>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#242424]">
              {alert.alert_id}
            </span>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F2E6] text-[#242424] border border-[#242424]/15">
              {alert.category}
            </span>
            <button
              onClick={onView}
              className="text-[11px] font-mono font-bold text-[#1565C0] hover:underline"
            >
              {alert.asset_id} · {alert.equipment_type}
            </button>
            <span className="text-[11px] text-[#78756E]">
              Site: {alert.site_id ?? 'Unassigned'}
            </span>
          </div>
          <p className="text-xs text-[#605D57] leading-relaxed">{alert.explanation}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wide text-[#78756E]">
              Recommended:
            </span>
            <span className="text-[11px] font-bold text-[#242424] border border-[#242424]/20 rounded px-1.5 py-0.5 bg-[#F7F2E6]">
              {alert.recommended_action}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0 flex items-center sm:justify-end">
          <button
            onClick={onToggle}
            disabled={acting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-all disabled:opacity-50 ${
              isOpen
                ? 'bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] border-[#242424]'
                : 'bg-[#F7F2E6] hover:bg-[#EAE5D8] text-[#242424] border-[#242424]/30'
            }`}
          >
            {acting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isOpen ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F7C83E]" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            {isOpen ? 'Acknowledge' : 'Reopen'}
          </button>
        </div>
      </div>
    </div>
  );
};
