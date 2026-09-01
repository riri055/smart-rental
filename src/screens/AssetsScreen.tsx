import React, { useState, useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatusBadge, RiskBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowRight,
  Sliders,
  ArrowLeftRight,
  Building2,
  AlertTriangle,
  Download,
  Check
} from 'lucide-react';

export const AssetsScreen: React.FC = () => {
  const {
    assets,
    sites,
    navigateTo,
    selectAsset,
    reassignAssetSite,
    addToast
  } = useFleet();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortField, setSortField] = useState<'id' | 'utilization' | 'idle' | 'engine' | 'rate'>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Transfer modal state
  const [transferModalAssetId, setTransferModalAssetId] = useState<string | null>(null);
  const [targetSiteId, setTargetSiteId] = useState<string>('S003');

  // Filtered and sorted assets
  const processedAssets = useMemo(() => {
    return assets
      .filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (siteFilter !== 'all' && a.siteId !== siteFilter) return false;
        if (typeFilter !== 'all' && a.equipmentType !== typeFilter) return false;
        if (riskFilter !== 'all' && a.riskLevel !== riskFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            a.id.toLowerCase().includes(q) ||
            a.modelName.toLowerCase().includes(q) ||
            a.operatorName.toLowerCase().includes(q) ||
            a.siteId.toLowerCase().includes(q) ||
            a.serialNumber.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a.id;
        let valB: any = b.id;

        if (sortField === 'utilization') {
          valA = a.utilization;
          valB = b.utilization;
        } else if (sortField === 'idle') {
          valA = a.idleHoursPerDay;
          valB = b.idleHoursPerDay;
        } else if (sortField === 'engine') {
          valA = a.totalEngineHours;
          valB = b.totalEngineHours;
        } else if (sortField === 'rate') {
          valA = a.dailyRate;
          valB = b.dailyRate;
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [assets, statusFilter, siteFilter, typeFilter, riskFilter, searchQuery, sortField, sortAsc]);

  const handleSort = (field: 'id' | 'utilization' | 'idle' | 'engine' | 'rate') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const executeTransfer = () => {
    if (!transferModalAssetId) return;
    reassignAssetSite(transferModalAssetId, targetSiteId);
    setTransferModalAssetId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">FLEET ASSET REGISTRY</h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF7] text-[#242424] border border-[#242424]">
              {processedAssets.length} of {assets.length} Units
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Search, filter, inspect telemetry, and reallocate heavy machinery across projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              addToast('Exported fleet inventory snapshot (50 assets) to CSV', 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFDF7] border border-[#242424]/20 hover:border-[#242424] text-xs font-semibold text-[#242424] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigateTo('check-in-out')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#242424] text-[#FFFDF7] hover:bg-[#383838] text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#F7C83E]" />
            <span>Check In / Out</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFDF7] p-3.5 rounded-lg border border-[#242424]/20 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#78756E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID (e.g. EQX1007), model, operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] focus:bg-[#FFFDF7] text-xs text-[#242424] pl-9 pr-3 py-2 rounded-md outline-none transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-2 rounded-md outline-none font-medium text-[#242424]"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Site */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-2 rounded-md outline-none font-mono font-medium text-[#242424]"
          >
            <option value="all">All Sites (S001-S006)</option>
            {Object.values(sites).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.name}
              </option>
            ))}
          </select>

          {/* Equipment Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-2 rounded-md outline-none font-medium text-[#242424]"
          >
            <option value="all">All Equipment Types</option>
            <option value="Excavator">Excavators</option>
            <option value="Bulldozer">Bulldozers</option>
            <option value="Crane">Cranes</option>
            <option value="Grader">Graders</option>
            <option value="Wheel Loader">Wheel Loaders</option>
          </select>

          {/* Risk Level */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-2 rounded-md outline-none font-medium text-[#242424]"
          >
            <option value="all">All Risk Levels</option>
            <option value="Critical">Critical Risk</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Clear button if filtered */}
          {(statusFilter !== 'all' || siteFilter !== 'all' || typeFilter !== 'all' || riskFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSiteFilter('all');
                setTypeFilter('all');
                setRiskFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#78756E] hover:text-[#242424] px-2 py-1 underline font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Asset Table */}
      <div className="rounded-lg border border-[#242424]/20 bg-[#FFFDF7] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#242424]/20 bg-[#F7F2E6] text-[#605D57] uppercase font-mono text-[10px] tracking-wider select-none">
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-4 font-bold text-[#242424] cursor-pointer hover:bg-[#EFE9DC]"
                >
                  <div className="flex items-center gap-1">
                    <span>Asset ID</span>
                    <ArrowUpDown className="w-3 h-3 text-[#78756E]" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Equipment & Model</th>
                <th className="py-3 px-4 font-bold">Site & Project</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Operator</th>
                <th
                  onClick={() => handleSort('utilization')}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-[#EFE9DC]"
                >
                  <div className="flex items-center gap-1">
                    <span>Utilization</span>
                    <ArrowUpDown className="w-3 h-3 text-[#78756E]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('idle')}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-[#EFE9DC]"
                >
                  <div className="flex items-center gap-1">
                    <span>Idle / Day</span>
                    <ArrowUpDown className="w-3 h-3 text-[#78756E]" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Risk Level</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#242424]/10">
              {processedAssets.length > 0 ? (
                processedAssets.map((asset) => {
                  const isDemoAnomaly = asset.id === 'EQX1007';
                  const isDemoRebalance = asset.id === 'EQX1004';

                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-[#FAF7EE] transition-colors ${
                        isDemoAnomaly ? 'bg-[#FEE2E2]/30' : isDemoRebalance ? 'bg-[#FEF6DC]/40' : ''
                      }`}
                    >
                      {/* Asset ID */}
                      <td className="py-3 px-4 font-mono font-bold text-[#242424]">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => navigateTo('asset-details', asset.id)}
                            className="cursor-pointer hover:underline text-[#242424]"
                          >
                            {asset.id}
                          </span>
                          {isDemoAnomaly && (
                            <span className="px-1 py-0.2 rounded bg-[#C62828] text-white text-[9px] font-mono">
                              CRITICAL
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Equipment & Model */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-[#F7F2E6] border border-[#242424]/10 text-[#242424]">
                            <EquipmentIcon type={asset.equipmentType} size={15} />
                          </div>
                          <div>
                            <div className="font-semibold text-[#242424]">{asset.modelName}</div>
                            <div className="text-[10px] text-[#78756E] font-mono">{asset.serialNumber}</div>
                          </div>
                        </div>
                      </td>

                      {/* Site & Project */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#242424] font-mono">
                          {asset.siteId} · {asset.siteName}
                        </div>
                        <div className="text-[10px] text-[#78756E] truncate max-w-[140px]">
                          {asset.projectName}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={asset.status} size="sm" />
                      </td>

                      {/* Operator */}
                      <td className="py-3 px-4">
                        {asset.operatorId ? (
                          <div>
                            <div className="font-medium text-[#242424]">{asset.operatorName}</div>
                            <div className="text-[10px] font-mono text-[#78756E]">{asset.operatorId}</div>
                          </div>
                        ) : (
                          <span className="text-[#C62828] font-mono text-[11px] font-semibold">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Utilization Bar */}
                      <td className="py-3 px-4 font-mono">
                        <div className="w-24">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="font-bold text-[#242424]">{asset.utilization}%</span>
                          </div>
                          <div className="w-full bg-[#EAE5D8] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                asset.utilization >= 70
                                  ? 'bg-[#2E7D32]'
                                  : asset.utilization >= 30
                                  ? 'bg-[#F7C83E]'
                                  : 'bg-[#C62828]'
                              }`}
                              style={{ width: `${Math.min(100, asset.utilization)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Idle Hours / Day */}
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`font-semibold ${
                            asset.idleHoursPerDay >= 10 ? 'text-[#C62828] font-bold' : 'text-[#242424]'
                          }`}
                        >
                          {asset.idleHoursPerDay}h / day
                        </span>
                      </td>

                      {/* Risk Level */}
                      <td className="py-3 px-4">
                        <RiskBadge risk={asset.riskLevel} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigateTo('asset-details', asset.id)}
                            className="p-1.5 rounded bg-[#F7F2E6] hover:bg-[#242424] hover:text-[#FFFDF7] text-[#242424] border border-[#242424]/20 transition-colors"
                            title="Inspect Details"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigateTo('check-in-out', asset.id)}
                            className="p-1.5 rounded bg-[#F7F2E6] hover:bg-[#242424] hover:text-[#FFFDF7] text-[#242424] border border-[#242424]/20 transition-colors"
                            title="Check In / Out"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setTransferModalAssetId(asset.id);
                              setTargetSiteId(asset.siteId === 'S003' ? 'S001' : 'S003');
                            }}
                            className="px-2 py-1 rounded bg-[#F7F2E6] hover:bg-[#242424] hover:text-[#FFFDF7] text-[#242424] border border-[#242424]/20 text-[11px] font-semibold transition-colors"
                            title="Reassign Site"
                          >
                            Transfer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#78756E]">
                    No equipment matched the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Transfer Modal Dialog */}
      {transferModalAssetId && (
        <div className="fixed inset-0 bg-[#242424]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] rounded-lg border border-[#242424] shadow-[4px_4px_0px_rgba(36,36,36,0.3)] max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424]/10 pb-3">
              <div className="font-mono font-bold text-sm text-[#242424]">
                REASSIGN SITE FOR {transferModalAssetId}
              </div>
              <button
                onClick={() => setTransferModalAssetId(null)}
                className="text-xs text-[#78756E] hover:text-[#242424]"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                Select Destination Works Hub:
              </label>
              <select
                value={targetSiteId}
                onChange={(e) => setTargetSiteId(e.target.value)}
                className="w-full bg-[#F7F2E6] border border-[#242424] p-2 rounded-md text-xs font-mono font-semibold"
              >
                {Object.values(sites).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.name} ({s.project})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded bg-[#FEF6DC] border border-[#F7C83E] text-xs text-[#242424]">
              💡 <strong>AI Logistics Tip:</strong> Site S003 (North Orbital Expressway) has an urgent excavator demand.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]/10">
              <button
                onClick={() => setTransferModalAssetId(null)}
                className="px-3 py-1.5 rounded-md border border-[#242424] text-xs font-semibold text-[#242424] hover:bg-[#F7F2E6]"
              >
                Cancel
              </button>
              <button
                onClick={executeTransfer}
                className="px-4 py-1.5 rounded-md bg-[#242424] text-xs font-semibold text-[#FFFDF7] hover:bg-[#383838]"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
