import React, { useEffect, useMemo, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import * as api from '../api/client';
import type { Rental } from '../api/types';
import {
  Calendar,
  Building2,
  User,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

function defaultReturnDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().substring(0, 10);
}

export const CheckInOutScreen: React.FC = () => {
  const { assets, sites, operators, selectedAssetId, checkoutAsset, checkinAsset, addToast, navigateTo, selectAsset } =
    useFleet();

  const [mode, setMode] = useState<'checkout' | 'checkin'>('checkout');
  const [targetAssetId, setTargetAssetId] = useState<string>('');

  // Checkout form
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>(defaultReturnDate());

  // Open rental for the selected asset (drives check-in flow)
  const [openRental, setOpenRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteList = useMemo(() => Object.values(sites), [sites]);

  // Keep target asset synced with selection and the loaded list.
  useEffect(() => {
    if (selectedAssetId) {
      setTargetAssetId(selectedAssetId);
    } else if (!targetAssetId && assets.length > 0) {
      setTargetAssetId(assets[0].equipment_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssetId, assets]);

  // Default site/operator once reference data is loaded.
  useEffect(() => {
    if (siteList.length > 0 && !selectedSiteId) {
      setSelectedSiteId(siteList[0].site_id);
    }
    if (operators.length > 0 && !operatorId) {
      setOperatorId(operators[0].operator_id);
    }
  }, [siteList, operators, selectedSiteId, operatorId]);

  // Look up the open rental (if any) for the selected asset.
  useEffect(() => {
    if (!targetAssetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getAsset(targetAssetId)
      .then((detail) => {
        if (cancelled) return;
        setOpenRental(detail.current_rental);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetAssetId]);

  const currentAsset = assets.find((a) => a.equipment_id === targetAssetId);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssetId || !selectedSiteId || !operatorId || !returnDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const rental = await checkoutAsset({
        equipment_id: targetAssetId,
        site_id: selectedSiteId,
        operator_id: operatorId,
        expected_return: returnDate,
      });
      addToast(`Asset ${targetAssetId} checked out (${rental.rental_id})`, 'success');
      navigateTo('asset-details', targetAssetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      addToast('Check-out failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openRental) return;
    setSubmitting(true);
    setError(null);
    try {
      await checkinAsset(openRental.rental_id);
      addToast(`Asset ${targetAssetId} checked in`, 'success');
      navigateTo('asset-details', targetAssetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      addToast('Check-in failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-[#242424]/15 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              CHECK IN / CHECK OUT OPERATIONS
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] border border-[#242424]">
              Fleet Dispatch
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Authorize lease dispatches and returns against the live backend.
          </p>
        </div>

        <div className="flex items-center rounded-lg bg-[#F7F2E6] p-1 border border-[#242424]/20">
          <button
            onClick={() => setMode('checkout')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              mode === 'checkout' ? 'bg-[#242424] text-[#FFFDF7] shadow-sm' : 'text-[#605D57] hover:text-[#242424]'
            }`}
          >
            Check Out (Deploy)
          </button>
          <button
            onClick={() => setMode('checkin')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              mode === 'checkin' ? 'bg-[#242424] text-[#FFFDF7] shadow-sm' : 'text-[#605D57] hover:text-[#242424]'
            }`}
          >
            Check In (Return)
          </button>
        </div>
      </div>

      {/* Asset Selector */}
      <div className="rounded-lg border border-[#242424] bg-[#FFFDF7] p-4.5 shadow-[3px_3px_0px_rgba(36,36,36,0.15)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold font-mono text-[#242424] mb-1.5">
              1. SELECT FLEET ASSET:
            </label>
            <select
              value={targetAssetId}
              onChange={(e) => {
                setTargetAssetId(e.target.value);
                selectAsset(e.target.value);
              }}
              className="w-full bg-[#F7F2E6] border border-[#242424] p-2.5 rounded-md text-xs font-mono font-bold text-[#242424] outline-none"
            >
              {assets.map((a) => (
                <option key={a.equipment_id} value={a.equipment_id}>
                  {a.equipment_id} — {a.model} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6 flex items-center justify-between bg-[#F7F2E6] p-3 rounded-md border border-[#242424]/15">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-[#FFFDF7] border border-[#242424]/10 text-[#242424]">
                <EquipmentIcon type={currentAsset?.equipment_type ?? ''} size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#242424]">{currentAsset?.model ?? '—'}</div>
                <div className="text-[11px] text-[#78756E]">
                  Site:{' '}
                  <strong className="text-[#242424]">
                    {currentAsset?.current_site_id ?? 'Unassigned'}
                  </strong>
                </div>
              </div>
            </div>
            {currentAsset && <StatusBadge status={currentAsset.status} size="sm" />}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-[#78756E] py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking asset status…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#C62828] bg-[#FEE2E2] border border-[#C62828]/40 rounded p-3">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && !error && mode === 'checkout' && (
        <form onSubmit={handleCheckoutSubmit} className="space-y-5">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] border-b border-[#242424]/10 pb-2">
              2. DISPATCH & LEASE PARAMETERS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  <Building2 className="w-3.5 h-3.5 inline mr-1" />
                  Destination Site:
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono font-medium"
                  required
                >
                  {siteList.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.site_id} · {s.site_name} ({s.site_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Expected Return Date:
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Assigned Operator:
                </label>
                <select
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono"
                  required
                >
                  {operators.map((o) => (
                    <option key={o.operator_id} value={o.operator_id}>
                      {o.operator_id} — {o.operator_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-[#78756E]">
              Authorizing dispatch will mark the asset <strong>Active</strong> and create a rental record.
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-bold tracking-wide shadow-[3px_3px_0px_#F7C83E] transition-all disabled:opacity-50"
            >
              {submitting ? 'Processing…' : 'Authorize & Check Out'}
            </button>
          </div>
        </form>
      )}

      {!loading && !error && mode === 'checkin' && (
        <form onSubmit={handleCheckinSubmit} className="space-y-5">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] border-b border-[#242424]/10 pb-2">
              2. RETURN & CHECK-IN
            </h3>

            {openRental ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#242424]/10">
                  <span className="text-[#78756E]">Rental ID:</span>
                  <span className="font-mono font-semibold text-[#242424]">
                    {openRental.rental_id}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#242424]/10">
                  <span className="text-[#78756E]">Operator:</span>
                  <span className="font-semibold text-[#242424]">{openRental.operator_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#242424]/10">
                  <span className="text-[#78756E]">Check Out:</span>
                  <span className="font-semibold text-[#242424]">{openRental.check_out}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#78756E]">Expected Return:</span>
                  <span className="font-semibold text-[#242424]">{openRental.expected_return}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded bg-[#EBF5ED] border border-[#2E7D32]/30 text-xs text-[#2E7D32]">
                This asset has no open rental and is already in the pool. Use the Check Out flow to
                deploy it.
              </div>
            )}
          </div>

          {openRental && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[#78756E]">
                Returning equipment will mark the rental <strong>Completed</strong> and free the asset.
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-bold tracking-wide shadow-[3px_3px_0px_#2E7D32] transition-all disabled:opacity-50"
              >
                {submitting ? 'Processing…' : 'Complete Check-In'}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
