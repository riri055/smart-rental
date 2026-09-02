import React, { useMemo, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EquipmentIcon } from '../components/common/EquipmentIcon';
import {
  Search,
  ArrowUpDown,
  Sliders,
  ArrowLeftRight,
  Building2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const EQUIPMENT_TYPES = [
  'Bulldozer',
  'Crane',
  'Dump Truck',
  'Excavator',
  'Grader',
  'Wheel Loader',
];

const STATUSES = ['Active', 'Available', 'Idle', 'Overdue', 'Unknown'];

export const AssetsScreen: React.FC = () => {
  const { assets, sites, navigateTo, loading, error } = useFleet();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<'id' | 'condition'>('id');
  const [sortAsc, setSortAsc] = useState(true);

  const processedAssets = useMemo(() => {
    return assets
      .filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (siteFilter !== 'all' && a.current_site_id !== siteFilter) return false;
        if (typeFilter !== 'all' && a.equipment_type !== typeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            a.equipment_id.toLowerCase().includes(q) ||
            a.model.toLowerCase().includes(q) ||
            a.equipment_type.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const valA = sortField === 'condition' ? a.condition_score : a.equipment_id;
        const valB = sortField === 'condition' ? b.condition_score : b.equipment_id;
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [assets, statusFilter, siteFilter, typeFilter, searchQuery, sortField, sortAsc]);

  const handleSort = (field: 'id' | 'condition') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (loading && assets.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-[#78756E]">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs font-mono">Loading asset registry…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 max-w-md mx-auto text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-[#C62828] mx-auto" />
        <h2 className="text-sm font-bold text-[#242424]">Unable to reach the backend</h2>
        <p className="text-xs text-[#78756E] leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424]/15 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tight text-[#242424]">
              FLEET ASSET REGISTRY
            </h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFDF7] text-[#242424] border border-[#242424]">
              {processedAssets.length} of {assets.length} Units
            </span>
          </div>
          <p className="text-xs text-[#78756E] mt-0.5">
            Search, filter, and inspect heavy machinery across all operational sites.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#78756E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, model, or equipment type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] focus:bg-[#FFFDF7] text-xs text-[#242424] pl-9 pr-3 py-2 rounded-md outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-2 rounded-md outline-none font-medium text-[#242424]"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-2 rounded-md outline-none font-mono font-medium text-[#242424]"
          >
            <option value="all">All Sites</option>
            {Object.values(sites).map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.site_id} · {s.site_name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-[#F7F2E6] border border-[#242424]/20 px-2.5 py-2 rounded-md outline-none font-medium text-[#242424]"
          >
            <option value="all">All Equipment Types</option>
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}s
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' ||
            siteFilter !== 'all' ||
            typeFilter !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSiteFilter('all');
                setTypeFilter('all');
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
                <th className="py-3 px-4 font-bold">Site</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th
                  onClick={() => handleSort('condition')}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-[#EFE9DC]"
                >
                  <div className="flex items-center gap-1">
                    <span>Condition Score</span>
                    <ArrowUpDown className="w-3 h-3 text-[#78756E]" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#242424]/10">
              {processedAssets.length > 0 ? (
                processedAssets.map((asset) => (
                  <tr key={asset.equipment_id} className="hover:bg-[#FAF7EE] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#242424]">
                      <span
                        onClick={() => navigateTo('asset-details', asset.equipment_id)}
                        className="cursor-pointer hover:underline text-[#242424]"
                      >
                        {asset.equipment_id}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-[#F7F2E6] border border-[#242424]/10 text-[#242424]">
                          <EquipmentIcon type={asset.equipment_type} size={15} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#242424]">{asset.model}</div>
                          <div className="text-[10px] text-[#78756E] font-mono">
                            {asset.equipment_type}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {asset.current_site_id ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#78756E]" />
                          <span className="font-semibold text-[#242424] font-mono">
                            {asset.current_site_id}
                          </span>
                          <span className="text-[10px] text-[#78756E]">
                            {sites[asset.current_site_id]?.site_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#78756E] font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={asset.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="w-28">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-bold text-[#242424]">
                            {asset.condition_score.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full bg-[#EAE5D8] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              asset.condition_score >= 85
                                ? 'bg-[#2E7D32]'
                                : asset.condition_score >= 70
                                  ? 'bg-[#F7C83E]'
                                  : 'bg-[#C62828]'
                            }`}
                            style={{ width: `${Math.min(100, asset.condition_score)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigateTo('asset-details', asset.equipment_id)}
                          className="p-1.5 rounded bg-[#F7F2E6] hover:bg-[#242424] hover:text-[#FFFDF7] text-[#242424] border border-[#242424]/20 transition-colors"
                          title="Inspect Details"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigateTo('check-in-out', asset.equipment_id)}
                          className="p-1.5 rounded bg-[#F7F2E6] hover:bg-[#242424] hover:text-[#FFFDF7] text-[#242424] border border-[#242424]/20 transition-colors"
                          title="Check In / Out"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#78756E]">
                    No equipment matched the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
