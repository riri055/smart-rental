import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { LeafletMap } from '../components/common/LeafletMap';
import { StatusBadge, RiskBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import {
  MapPin,
  Radio,
  SlidersHorizontal,
  Building2,
  Navigation,
  ExternalLink,
  Fuel,
  Clock,
  User,
  AlertTriangle,
  ArrowLeftRight
} from 'lucide-react';

export const FleetTrackerScreen: React.FC = () => {
  const {
    assets,
    sites,
    selectedAssetId,
    selectAsset,
    navigateTo,
    isLiveSimulationActive,
    toggleLiveSimulation
  } = useFleet();

  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Filtered assets
  const filteredAssets = assets.filter((a) => {
    if (siteFilter !== 'all' && a.siteId !== siteFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (typeFilter !== 'all' && a.equipmentType !== typeFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.modelName.toLowerCase().includes(q) ||
        a.operatorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">LIVE FLEET TRACKER</h1>
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF7] text-[#242424] border border-[#242424]">
              <span className={`w-2 h-2 rounded-full ${isLiveSimulationActive ? 'bg-[#2E7D32] animate-pulse' : 'bg-[#78756E]'}`} />
              {filteredAssets.length} Active GPS Transponders
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Geospatial tracking of heavy machinery across all regional worksites.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLiveSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              isLiveSimulationActive
                ? 'bg-[#EBF5ED] border-[#2E7D32] text-[#2E7D32]'
                : 'bg-[#FFFDF7] border-[#242424]/20 text-[#78756E]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isLiveSimulationActive ? 'Telemetry Streaming (10s)' : 'Stream Paused'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFDF7] p-3 rounded-lg border border-[#242424]/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search asset ID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none w-36 focus:border-[#242424]"
          />

          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none font-mono"
          >
            <option value="all">All Sites (S001-S006)</option>
            {Object.values(sites).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-1.5 rounded outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Rented">Rented / Active</option>
            <option value="Available">Available</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Equipment Type Filter */}
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

        {/* Quick Demo Case Jump Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#78756E] uppercase">Focus:</span>
          <button
            onClick={() => selectAsset('EQX1007')}
            className={`text-xs font-mono font-bold px-2 py-1 rounded border transition-colors ${
              selectedAssetId === 'EQX1007'
                ? 'bg-[#C62828] text-white border-[#C62828]'
                : 'bg-[#FEE2E2] text-[#C62828] border-[#C62828]/40 hover:bg-[#FCD8D8]'
            }`}
          >
            EQX1007 (Anomaly)
          </button>
          <button
            onClick={() => selectAsset('EQX1004')}
            className={`text-xs font-mono font-bold px-2 py-1 rounded border transition-colors ${
              selectedAssetId === 'EQX1004'
                ? 'bg-[#F7C83E] text-[#242424] border-[#242424]'
                : 'bg-[#FEF6DC] text-[#242424] border-[#F7C83E] hover:bg-[#FEEFBF]'
            }`}
          >
            EQX1004 (S004)
          </button>
        </div>
      </div>

      {/* Main Map & Live Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Full Interactive Map Container (8 Cols) */}
        <div className="lg:col-span-8 h-[600px] rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-2 relative shadow-sm">
          <LeafletMap
            assets={filteredAssets}
            sites={sites}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(id) => selectAsset(id)}
            onNavigateToAsset={(id) => navigateTo('asset-details', id)}
            height="100%"
            highlightSiteId={siteFilter !== 'all' ? siteFilter : undefined}
          />
        </div>

        {/* Selected Asset Telemetry Inspection Card (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {activeAsset ? (
            <div className="rounded-lg border border-[#242424] bg-[#FFFDF7] p-4 shadow-[3px_3px_0px_rgba(36,36,36,0.15)] flex flex-col justify-between flex-1">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#242424]/10 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-[#242424]">
                        {activeAsset.id}
                      </span>
                      <StatusBadge status={activeAsset.status} size="sm" />
                    </div>
                    <div className="text-xs font-semibold text-[#242424] mt-0.5">
                      {activeAsset.modelName}
                    </div>
                  </div>

                  <RiskBadge risk={activeAsset.riskLevel} />
                </div>

                {/* Demo Anomaly Warning if EQX1007 */}
                {activeAsset.id === 'EQX1007' && (
                  <div className="mb-3 p-2.5 rounded bg-[#FEE2E2] border border-[#C62828] text-xs text-[#C62828]">
                    <div className="font-bold flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      CRITICAL ANOMALY DETECTED
                    </div>
                    <div className="text-[11px] mt-0.5 text-[#242424]">
                      12.0 hours daily idle time. Zero productive operating hours. No operator assigned.
                    </div>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 bg-[#F7F2E6] p-3 rounded border border-[#242424]/10 text-xs mb-3 font-mono">
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">UTILIZATION</span>
                    <span className="font-bold text-sm text-[#242424]">{activeAsset.utilization}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">IDLE HRS/DAY</span>
                    <span className="font-bold text-sm text-[#242424]">{activeAsset.idleHoursPerDay} hrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">ENGINE HRS/DAY</span>
                    <span className="font-bold text-sm text-[#242424]">{activeAsset.engineHoursPerDay} hrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78756E] block font-sans">FUEL LEVEL</span>
                    <span className="font-bold text-sm text-[#242424]">{activeAsset.fuelLevelPct}%</span>
                  </div>
                </div>

                {/* Location & Operator Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Site Location
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {activeAsset.siteName} ({activeAsset.siteId})
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Assigned Operator
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {activeAsset.operatorName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-[#FAF7EE] border border-[#242424]/10">
                    <span className="text-[#78756E] flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> GPS Coordinates
                    </span>
                    <span className="font-mono text-[11px] text-[#242424]">
                      {activeAsset.latitude.toFixed(4)}, {activeAsset.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#242424]/10 space-y-2">
                <button
                  onClick={() => navigateTo('asset-details', activeAsset.id)}
                  className="w-full py-2 px-3 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Open Detailed Diagnostics</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#F7C83E]" />
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigateTo('check-in-out', activeAsset.id)}
                    className="flex-1 py-1.5 rounded-md border border-[#242424] text-xs font-semibold text-[#242424] hover:bg-[#F7F2E6] transition-colors text-center"
                  >
                    Check In / Out
                  </button>
                  <button
                    onClick={() => navigateTo('ai-intelligence')}
                    className="flex-1 py-1.5 rounded-md bg-[#F7C83E] text-xs font-bold text-[#242424] border border-[#242424] hover:bg-[#E5B728] transition-colors text-center"
                  >
                    AI Optimize
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-8 text-center text-xs text-[#78756E]">
              Select an asset pin on the map to inspect live telemetry.
            </div>
          )}

          {/* Quick Fleet Units List (Scrollable) */}
          <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] p-3 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#78756E] uppercase tracking-wider mb-2 font-mono">
              Filtered Unit Quick Select ({filteredAssets.length})
            </div>
            <div className="space-y-1">
              {filteredAssets.slice(0, 15).map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAsset(a.id)}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                    selectedAssetId === a.id
                      ? 'bg-[#F7C83E] text-[#242424] font-bold'
                      : 'hover:bg-[#F7F2E6] text-[#242424]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[11px]">{a.id}</span>
                    <span className="text-[10px] text-[#605D57] truncate max-w-[110px]">{a.modelName}</span>
                  </div>
                  <span className="text-[10px] font-mono">{a.utilization}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
