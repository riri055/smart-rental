import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import {
  ArrowLeftRight,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  Clock
} from 'lucide-react';

export const CheckInOutScreen: React.FC = () => {
  const {
    assets,
    sites,
    selectedAssetId,
    checkOutAsset,
    checkInAsset,
    navigateTo,
    selectAsset
  } = useFleet();

  const [mode, setMode] = useState<'checkout' | 'checkin'>('checkout');
  const [targetAssetId, setTargetAssetId] = useState<string>(selectedAssetId || assets[0]?.id || 'EQX1004');
  
  // Checkout Form State
  const [selectedSiteId, setSelectedSiteId] = useState<string>('S003');
  const [operatorId, setOperatorId] = useState<string>('OP106');
  const [operatorName, setOperatorName] = useState<string>('Sarah Jenkins');
  const [returnDate, setReturnDate] = useState<string>('2025-06-15');
  const [conditionScore, setConditionScore] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('Standard 30-day lease for Highway excavation mobilization.');

  // Checkin Form State
  const [hoursAdded, setHoursAdded] = useState<number>(14.5);
  const [checkinCondition, setCheckinCondition] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [checkinNotes, setCheckinNotes] = useState<string>('Equipment returned in normal operating order. Fluid levels verified.');

  // Checklist items
  const [checklist, setChecklist] = useState({
    hydraulics: true,
    engineOil: true,
    tracksTires: true,
    telemetryTransponder: true,
    cabSafetyHarness: true,
    fuelTankFilled: true
  });

  // Keep targetAsset synced if selectedAssetId changes
  useEffect(() => {
    if (selectedAssetId) {
      setTargetAssetId(selectedAssetId);
    }
  }, [selectedAssetId]);

  const currentAsset = assets.find((a) => a.id === targetAssetId) || assets[0];

  // Auto-tune mode based on current asset status
  useEffect(() => {
    if (currentAsset.status === 'Available') {
      setMode('checkout');
    } else if (currentAsset.status === 'Rented' || currentAsset.status === 'Overdue') {
      setMode('checkin');
    }
  }, [currentAsset.status, targetAssetId]);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = checkOutAsset({
      assetId: targetAssetId,
      siteId: selectedSiteId,
      operatorId,
      operatorName,
      checkinDate: returnDate,
      conditionScore,
      notes: checkoutNotes
    });

    if (success) {
      navigateTo('asset-details', targetAssetId);
    }
  };

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = checkInAsset({
      assetId: targetAssetId,
      conditionScore: checkinCondition,
      engineHoursAdded: Number(hoursAdded),
      notes: checkinNotes
    });

    if (success) {
      navigateTo('asset-details', targetAssetId);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
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
            Authorize lease dispatches, operator assignments, returns, and inspection condition grading.
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex items-center rounded-lg bg-[#F7F2E6] p-1 border border-[#242424]/20">
          <button
            onClick={() => setMode('checkout')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              mode === 'checkout'
                ? 'bg-[#242424] text-[#FFFDF7] shadow-sm'
                : 'text-[#605D57] hover:text-[#242424]'
            }`}
          >
            Check Out (Deploy)
          </button>
          <button
            onClick={() => setMode('checkin')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              mode === 'checkin'
                ? 'bg-[#242424] text-[#FFFDF7] shadow-sm'
                : 'text-[#605D57] hover:text-[#242424]'
            }`}
          >
            Check In (Return)
          </button>
        </div>
      </div>

      {/* Asset Selector Card */}
      <div className="rounded-lg border border-[#242424] bg-[#FFFDF7] p-4.5 shadow-[3px_3px_0px_rgba(36,36,36,0.15)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold font-mono text-[#242424] mb-1.5">
              1. SELECT FLEET ASSET FOR DISPATCH / RETURN:
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
                <option key={a.id} value={a.id}>
                  {a.id} — {a.modelName} ({a.status}) · Site {a.siteId}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6 flex items-center justify-between bg-[#F7F2E6] p-3 rounded-md border border-[#242424]/15">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-[#FFFDF7] border border-[#242424]/10 text-[#242424]">
                <EquipmentIcon type={currentAsset.equipmentType} size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#242424]">{currentAsset.modelName}</div>
                <div className="text-[11px] text-[#78756E]">
                  Current Site: <strong className="text-[#242424]">{currentAsset.siteName} ({currentAsset.siteId})</strong>
                </div>
              </div>
            </div>
            <StatusBadge status={currentAsset.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Main Workflow Form */}
      {mode === 'checkout' ? (
        /* CHECK OUT WORKFLOW */
        <form onSubmit={handleCheckoutSubmit} className="space-y-5">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] border-b border-[#242424]/10 pb-2">
              2. DISPATCH & LEASE PARAMETERS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Destination Site */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Destination Operational Site / Hub:
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono font-medium"
                  required
                >
                  {Object.values(sites).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} · {s.name} ({s.project})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Return Date */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Expected Return Inspection Date:
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono"
                  required
                />
              </div>

              {/* Operator ID */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Assigned Certified Operator ID:
                </label>
                <select
                  value={operatorId}
                  onChange={(e) => {
                    setOperatorId(e.target.value);
                    if (e.target.value === 'OP106') setOperatorName('Sarah Jenkins');
                    if (e.target.value === 'OP101') setOperatorName('Marcus Vance');
                    if (e.target.value === 'OP104') setOperatorName('Priya Nair');
                    if (e.target.value === 'OP114') setOperatorName('Arjun Patel');
                    if (e.target.value === 'OP121') setOperatorName('David Zhao');
                  }}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono"
                >
                  <option value="OP106">OP106 — Sarah Jenkins (Excavator Specialist)</option>
                  <option value="OP104">OP104 — Priya Nair (Heavy Excavator/Master)</option>
                  <option value="OP101">OP101 — Marcus Vance (General Fleet)</option>
                  <option value="OP114">OP114 — Arjun Patel (Grader/Dozer)</option>
                  <option value="OP121">OP121 — David Zhao (Crane Rigging)</option>
                </select>
              </div>

              {/* Condition Grade */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Pre-Dispatch Condition Grade:
                </label>
                <select
                  value={conditionScore}
                  onChange={(e) => setConditionScore(e.target.value as any)}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono font-bold"
                >
                  <option value="A">Grade A — Flawless / Fresh Maintenance</option>
                  <option value="B">Grade B — Good Working Order</option>
                  <option value="C">Grade C — Minor Wear (Acceptable)</option>
                  <option value="D">Grade D — Immediate Service Required</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Dispatch Work Order Notes:
              </label>
              <textarea
                rows={2}
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs"
                placeholder="Specific worksite task instructions, haul route, etc."
              />
            </div>
          </div>

          {/* Inspection Verification Checklist */}
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] border-b border-[#242424]/10 pb-2">
              3. PRE-MOBILIZATION SAFETY CHECKLIST
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2 rounded bg-[#F7F2E6] cursor-pointer hover:bg-[#EFE9DC]">
                <input
                  type="checkbox"
                  checked={checklist.hydraulics}
                  onChange={(e) => setChecklist({ ...checklist, hydraulics: e.target.checked })}
                  className="accent-[#242424]"
                />
                <span>Hydraulic pressure & hoses verified</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#F7F2E6] cursor-pointer hover:bg-[#EFE9DC]">
                <input
                  type="checkbox"
                  checked={checklist.engineOil}
                  onChange={(e) => setChecklist({ ...checklist, engineOil: e.target.checked })}
                  className="accent-[#242424]"
                />
                <span>Engine oil & coolant levels optimal</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#F7F2E6] cursor-pointer hover:bg-[#EFE9DC]">
                <input
                  type="checkbox"
                  checked={checklist.tracksTires}
                  onChange={(e) => setChecklist({ ...checklist, tracksTires: e.target.checked })}
                  className="accent-[#242424]"
                />
                <span>Track tension & undercarriage inspected</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-[#F7F2E6] cursor-pointer hover:bg-[#EFE9DC]">
                <input
                  type="checkbox"
                  checked={checklist.telemetryTransponder}
                  onChange={(e) => setChecklist({ ...checklist, telemetryTransponder: e.target.checked })}
                  className="accent-[#242424]"
                />
                <span>IoT GPS & CAN-bus telemetry synced</span>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-[#78756E]">
              Authorizing dispatch will change status to <strong>Rented</strong> and log dispatch timestamp.
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-bold tracking-wide shadow-[3px_3px_0px_#F7C83E] transition-all"
            >
              Authorize & Check Out Equipment
            </button>
          </div>
        </form>
      ) : (
        /* CHECK IN WORKFLOW */
        <form onSubmit={handleCheckinSubmit} className="space-y-5">
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#242424] border-b border-[#242424]/10 pb-2">
              2. RETURN INSPECTION & METER LOGS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Additional Operating Hours */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Logged Operating Hours on this Lease:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={hoursAdded}
                    onChange={(e) => setHoursAdded(Number(e.target.value))}
                    className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono font-bold text-[#242424]"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#78756E] font-mono">hrs</span>
                </div>
              </div>

              {/* Returned Condition */}
              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1">
                  Post-Return Condition Assessment:
                </label>
                <select
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value as any)}
                  className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs font-mono font-bold"
                >
                  <option value="A">Grade A — Clean & Ready for Immediate Deployment</option>
                  <option value="B">Grade B — Good Condition (Minor Wash Required)</option>
                  <option value="C">Grade C — Moderate Wear (Stage-1 Checkup)</option>
                  <option value="D">Grade D — Mechanical Issue (Route to Maintenance)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Return Inspection Findings:
              </label>
              <textarea
                rows={2}
                value={checkinNotes}
                onChange={(e) => setCheckinNotes(e.target.value)}
                className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] p-2 rounded-md text-xs"
                placeholder="Wear observations, fluid top-up required, etc."
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-[#78756E]">
              Returning equipment will change status to <strong>Available</strong> (or <strong>Maintenance</strong> if Grade D).
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-bold tracking-wide shadow-[3px_3px_0px_#2E7D32] transition-all"
            >
              Complete Check-In Inspection
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
