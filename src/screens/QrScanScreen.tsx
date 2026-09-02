import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import { QrScanner } from '../components/common/QrScanner';
import * as api from '../api/client';
import type { AssetDetail } from '../api/types';
import {
  QrCode,
  ScanLine,
  Search,
  Loader2,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  ArrowLeftRight,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

type LookupState = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

function defaultReturnDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().substring(0, 10);
}

export const QrScanScreen: React.FC = () => {
  const {
    sites,
    operators,
    selectAsset,
    checkoutAsset,
    checkinAsset,
    addToast,
    navigateTo,
  } = useFleet();

  const [manualId, setManualId] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [scanActive, setScanActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [returnDate, setReturnDate] = useState(defaultReturnDate());
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const siteList = useMemo(() => Object.values(sites), [sites]);

  const lookup = useCallback(
    async (raw: string) => {
      const id = raw.trim().toUpperCase();
      if (!id) {
        setDetail(null);
        setLookupState('error');
        setLookupError('Enter an equipment ID or scan a valid QR code.');
        return;
      }

      setPendingId(id);
      setLookupState('loading');
      setLookupError(null);
      setDetail(null);
      setActionError(null);
      setSelectedSiteId('');
      setOperatorId('');

      try {
        const d = await api.getAsset(id);
        setDetail(d);
        setLookupState('found');
        selectAsset(id);
      } catch (err) {
        const status = err instanceof api.ApiError ? err.status : 0;
        const message = err instanceof Error ? err.message : String(err);
        setLookupState(status === 404 ? 'not-found' : 'error');
        setLookupError(
          status === 404 ? `No asset found with ID "${id}".` : message,
        );
      }
    },
    [selectAsset],
  );

  const reloadAsset = useCallback(async (id: string) => {
    const d = await api.getAsset(id);
    setDetail(d);
    setLookupState('found');
  }, []);

  const handleQrDetect = useCallback(
    (value: string) => {
      setScanActive(false);
      setScanError(null);
      void lookup(value);
    },
    [lookup],
  );

  const handleScanError = useCallback((message: string) => {
    setScanActive(false);
    setScanError(message);
  }, []);

  // Default the destination site to the asset's current site (or first site).
  useEffect(() => {
    if (siteList.length === 0) return;
    if (selectedSiteId && sites[selectedSiteId]) return;
    const preferred =
      detail?.current_site_id && sites[detail.current_site_id]
        ? detail.current_site_id
        : siteList[0].site_id;
    setSelectedSiteId(preferred);
  }, [detail, siteList, sites, selectedSiteId]);

  // Default the operator to one assigned to the selected site.
  useEffect(() => {
    if (operators.length === 0 || !selectedSiteId) return;
    const match =
      operators.find((o) => o.primary_site_id === selectedSiteId) ?? operators[0];
    setOperatorId(match.operator_id);
  }, [operators, selectedSiteId]);

  const handleManualFind = (e: React.FormEvent) => {
    e.preventDefault();
    void lookup(manualId);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !selectedSiteId || !operatorId || !returnDate) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const rental = await checkoutAsset({
        equipment_id: detail.equipment_id,
        site_id: selectedSiteId,
        operator_id: operatorId,
        expected_return: returnDate,
      });
      addToast(
        `Asset ${detail.equipment_id} checked out (${rental.rental_id})`,
        'success',
      );
      await reloadAsset(detail.equipment_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setActionError(message);
      addToast('Check-out failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckin = async () => {
    if (!detail?.current_rental) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await checkinAsset(detail.current_rental.rental_id);
      addToast(`Asset ${detail.equipment_id} checked in`, 'success');
      await reloadAsset(detail.equipment_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setActionError(message);
      addToast('Check-in failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveRental = detail?.current_rental != null;
  const site = detail?.current_site_id ? sites[detail.current_site_id] : undefined;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#242424]/15 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
            SCAN ASSET QR
          </h1>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7C83E] text-[#242424] border border-[#242424]">
            Scan or Enter ID
          </span>
        </div>
        <p className="text-xs text-[#78756E] mt-0.5">
          Scan an equipment QR code — or type the ID — then check the asset out or back in.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Identification */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] border-b border-[#242424]/10 pb-2 mb-4">
              Manual Equipment ID
            </h3>
            <form onSubmit={handleManualFind} className="space-y-3">
              <label className="block text-xs font-semibold text-[#242424]">
                Equipment ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. EQX0001"
                  className="flex-1 bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] focus:bg-[#FFFDF7] text-sm font-mono font-bold text-[#242424] px-3 py-2 rounded-md outline-none uppercase tracking-wider"
                />
                <button
                  type="submit"
                  disabled={!manualId.trim()}
                  className="px-4 py-2 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-bold shadow-[2px_2px_0px_#F7C83E] transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  Find Asset
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#242424]/10 pb-2 mb-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424]">
                Camera Scan
              </h3>
              <QrCode className="w-4 h-4 text-[#242424]" />
            </div>

            <QrScanner
              active={scanActive}
              onDetect={handleQrDetect}
              onError={handleScanError}
            />

            {!scanActive && (
              <button
                onClick={() => {
                  setScanActive(true);
                  setScanError(null);
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-bold shadow-[3px_3px_0px_#F7C83E] transition-all"
              >
                <ScanLine className="w-4 h-4 text-[#F7C83E]" />
                Start Camera Scanning
              </button>
            )}

            {scanActive && (
              <button
                onClick={() => setScanActive(false)}
                className="mt-4 w-full px-4 py-2 rounded-md border border-[#242424]/30 text-[#242424] text-xs font-bold hover:bg-[#F7F2E6] transition-all"
              >
                Stop Scanning
              </button>
            )}

            {scanError && (
              <p className="mt-3 text-[11px] text-[#C62828] flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {scanError} Use manual entry instead.
              </p>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-7">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm min-h-[320px]">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] border-b border-[#242424]/10 pb-2 mb-4">
              Asset Result
            </h3>

            {lookupState === 'idle' && (
              <div className="py-16 text-center space-y-2">
                <QrCode className="w-8 h-8 text-[#C9C4B6] mx-auto" />
                <p className="text-xs text-[#78756E]">
                  Scan a QR code or enter an equipment ID to identify an asset.
                </p>
              </div>
            )}

            {lookupState === 'loading' && (
              <div className="py-16 flex flex-col items-center gap-3 text-[#78756E]">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs font-mono">
                  Looking up asset {pendingId ? `“${pendingId}”` : ''}…
                </p>
              </div>
            )}

            {(lookupState === 'not-found' || lookupState === 'error') && (
              <div className="py-16 max-w-md mx-auto text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-[#C62828] mx-auto" />
                <p className="text-xs font-bold text-[#242424]">
                  {lookupState === 'not-found' ? 'Asset Not Found' : 'Lookup Error'}
                </p>
                <p className="text-xs text-[#78756E] leading-relaxed">{lookupError}</p>
              </div>
            )}

            {lookupState === 'found' && detail && (
              <div className="space-y-5">
                {/* Summary card */}
                <div className="rounded-md border border-[#242424]/15 bg-[#F7F2E6] p-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-lg bg-[#FFFDF7] border border-[#242424]/20 text-[#242424]">
                      <EquipmentIcon type={detail.equipment_type} size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xl font-extrabold text-[#242424]">
                          {detail.equipment_id}
                        </span>
                        <StatusBadge status={detail.status} size="md" />
                      </div>
                      <h2 className="text-base font-bold text-[#242424] mt-1">
                        {detail.model}
                      </h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#78756E] mt-1.5">
                        <span>
                          Type:{' '}
                          <strong className="text-[#242424]">
                            {detail.equipment_type}
                          </strong>
                        </span>
                        <span>
                          Site:{' '}
                          <strong className="text-[#242424]">
                            {site ? `${site.site_name} (${site.site_id})` : 'Unassigned'}
                          </strong>
                        </span>
                        <span>
                          Condition:{' '}
                          <strong className="text-[#242424]">
                            {detail.condition_score.toFixed(1)} / 100
                          </strong>
                        </span>
                        <span>
                          Operator:{' '}
                          <strong className="text-[#242424]">
                            {detail.current_rental?.operator_id ?? '—'}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigateTo('asset-details', detail.equipment_id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold shadow-sm transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#F7C83E]" />
                      View Details
                    </button>
                  </div>
                </div>

                {actionError && (
                  <div className="flex items-center gap-2 text-xs text-[#C62828] bg-[#FEE2E2] border border-[#C62828]/40 rounded p-3">
                    <AlertTriangle className="w-4 h-4" /> {actionError}
                  </div>
                )}

                {/* Contextual action */}
                {hasActiveRental && detail.current_rental ? (
                  <div className="rounded-md border border-[#2E7D32]/30 bg-[#EBF5ED] p-4">
                    <div className="flex items-center justify-between border-b border-[#2E7D32]/20 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-[#2E7D32]" />
                        <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#2E7D32]">
                          Active Rental — Check In
                        </h4>
                      </div>
                      <StatusBadge status={detail.current_rental.rental_status} size="sm" />
                    </div>

                    <div className="space-y-1.5 text-xs mb-4">
                      <div className="flex justify-between py-1 border-b border-[#2E7D32]/10">
                        <span className="text-[#5B7A5C]">Rental ID:</span>
                        <span className="font-mono font-semibold text-[#242424]">
                          {detail.current_rental.rental_id}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#2E7D32]/10">
                        <span className="text-[#5B7A5C]">Operator:</span>
                        <span className="font-semibold text-[#242424]">
                          {detail.current_rental.operator_id}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#2E7D32]/10">
                        <span className="text-[#5B7A5C]">Check Out:</span>
                        <span className="font-semibold text-[#242424]">
                          {detail.current_rental.check_out}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#5B7A5C]">Expected Return:</span>
                        <span className="font-semibold text-[#242424]">
                          {detail.current_rental.expected_return}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckin}
                      disabled={submitting}
                      className="w-full px-4 py-2.5 rounded-md bg-[#2E7D32] hover:bg-[#256B29] text-[#FFFDF7] text-xs font-bold tracking-wide shadow-[2px_2px_0px_rgba(46,125,50,0.4)] transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Processing…' : 'Check In (Return Asset)'}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCheckout}
                    className="rounded-md border border-[#1565C0]/30 bg-[#E3F2FD] p-4"
                  >
                    <div className="flex items-center gap-2 border-b border-[#1565C0]/20 pb-3 mb-4">
                      <ArrowLeftRight className="w-4 h-4 text-[#1565C0]" />
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1565C0]">
                        Available — Check Out
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#242424] mb-1">
                          <Building2 className="w-3.5 h-3.5 inline mr-1" />
                          Destination Site:
                        </label>
                        <select
                          value={selectedSiteId}
                          onChange={(e) => setSelectedSiteId(e.target.value)}
                          className="w-full bg-[#FFFDF7] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono font-medium"
                          required
                        >
                          {siteList.map((s) => (
                            <option key={s.site_id} value={s.site_id}>
                              {s.site_id} · {s.site_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#242424] mb-1">
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          Expected Return:
                        </label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full bg-[#FFFDF7] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#242424] mb-1">
                          <User className="w-3.5 h-3.5 inline mr-1" />
                          Assigned Operator:
                        </label>
                        <select
                          value={operatorId}
                          onChange={(e) => setOperatorId(e.target.value)}
                          className="w-full bg-[#FFFDF7] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono"
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

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-4 py-2.5 rounded-md bg-[#1565C0] hover:bg-[#115293] text-[#FFFDF7] text-xs font-bold tracking-wide shadow-[2px_2px_0px_rgba(21,101,192,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Check Out (Deploy Asset)
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
