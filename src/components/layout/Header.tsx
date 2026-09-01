import React, { useState, useRef, useEffect } from 'react';
import { useFleet } from '../../context/FleetContext';
import { Search, MapPin, ArrowLeftRight, Bell, Sparkles, Building2, ChevronDown, Check } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    sites,
    selectedSiteFilter,
    setSelectedSiteFilter,
    navigateTo,
    assets,
    stats
  } = useFleet();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (siteRef.current && !siteRef.current.contains(e.target as Node)) {
        setSiteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered assets for live search dropdown
  const searchResults = searchValue.trim()
    ? assets.filter(
        (a) =>
          a.id.toLowerCase().includes(searchValue.toLowerCase()) ||
          a.equipmentType.toLowerCase().includes(searchValue.toLowerCase()) ||
          a.modelName.toLowerCase().includes(searchValue.toLowerCase()) ||
          a.operatorName.toLowerCase().includes(searchValue.toLowerCase()) ||
          a.siteId.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 6)
    : [];

  const currentSiteName =
    selectedSiteFilter === 'all'
      ? 'All Operations Sites'
      : `${selectedSiteFilter} — ${sites[selectedSiteFilter]?.name || 'Site'}`;

  return (
    <header className="h-16 bg-[#FFFDF7] border-b border-[#242424]/15 px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(36,36,36,0.03)]">
      {/* Left: Site Switcher & Location Scope */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={siteRef}>
          <button
            onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#242424]/20 hover:border-[#242424] bg-[#F7F2E6] text-xs font-semibold text-[#242424] transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-[#242424]" />
            <span className="font-mono">{currentSiteName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#78756E]" />
          </button>

          {siteDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-[#FFFDF7] rounded-md border border-[#242424] shadow-[3px_3px_0px_rgba(36,36,36,0.2)] py-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#78756E] uppercase tracking-wider border-b border-[#242424]/10">
                Filter Fleet by Site
              </div>
              <button
                onClick={() => {
                  setSelectedSiteFilter('all');
                  setSiteDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F7F2E6] transition-colors ${
                  selectedSiteFilter === 'all' ? 'font-bold bg-[#F7F2E6]' : ''
                }`}
              >
                <span>All Fleet Locations ({assets.length} Assets)</span>
                {selectedSiteFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#242424]" />}
              </button>

              {Object.values(sites).map((s) => {
                const count = assets.filter((a) => a.siteId === s.id).length;
                const isSelected = selectedSiteFilter === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSiteFilter(s.id);
                      setSiteDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F7F2E6] transition-colors ${
                      isSelected ? 'font-bold bg-[#F7F2E6]' : ''
                    }`}
                  >
                    <div>
                      <span className="font-mono text-[11px] font-bold mr-1.5">{s.id}</span>
                      <span>{s.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#78756E] bg-[#EAE5D8] px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected site project info pill */}
        {selectedSiteFilter !== 'all' && sites[selectedSiteFilter] && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#78756E] bg-[#F7F2E6] px-2.5 py-1 rounded border border-[#242424]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
            <span className="font-medium text-[#242424]">{sites[selectedSiteFilter].project}</span>
          </div>
        )}
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md mx-6 relative" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#78756E] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search asset ID (e.g. EQX1007), equipment, operator, site..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            className="w-full bg-[#F7F2E6] border border-[#242424]/20 focus:border-[#242424] focus:bg-[#FFFDF7] text-xs text-[#242424] pl-9 pr-3 py-2 rounded-md outline-none transition-all placeholder:text-[#8E8B83]"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-2.5 text-xs text-[#78756E] hover:text-[#242424]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && searchValue.trim() && (
          <div className="absolute left-0 right-0 mt-1.5 bg-[#FFFDF7] rounded-md border border-[#242424] shadow-[3px_3px_0px_rgba(36,36,36,0.2)] py-1 z-50 max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    navigateTo('asset-details', asset.id);
                    setSearchOpen(false);
                    setSearchValue('');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#F7F2E6] transition-colors border-b border-[#242424]/5 last:border-none flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#242424]">{asset.id}</span>
                      <span className="text-xs font-medium text-[#242424]">{asset.modelName}</span>
                    </div>
                    <div className="text-[10px] text-[#78756E] flex items-center gap-2 mt-0.5">
                      <span>{asset.equipmentType}</span>
                      <span>•</span>
                      <span>Site {asset.siteId}</span>
                      <span>•</span>
                      <span>Operator: {asset.operatorName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F7F2E6] border border-[#242424]/10">
                      {asset.status}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[#78756E]">
                No matching assets or operators found for "{searchValue}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick Actions & Alerts */}
      <div className="flex items-center gap-3">
        {/* Check In / Out Quick Button */}
        <button
          onClick={() => navigateTo('check-in-out')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#242424] hover:bg-[#383838] text-[#FFFDF7] text-xs font-semibold shadow-[2px_2px_0px_rgba(36,36,36,0.2)] transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#F7C83E]" />
          <span>Check In / Out</span>
        </button>

        {/* AI Recommendations Shortcut */}
        <button
          onClick={() => navigateTo('ai-intelligence')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F7C83E] hover:bg-[#E5B728] text-[#242424] text-xs font-bold border border-[#242424] shadow-[2px_2px_0px_rgba(36,36,36,0.3)] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Optimizer</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => navigateTo('alerts')}
          className="relative p-2 rounded-md border border-[#242424]/20 hover:border-[#242424] bg-[#F7F2E6] text-[#242424] transition-all"
          title="Fleet Alerts"
        >
          <Bell className="w-4 h-4" />
          {stats.openAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#C62828] text-[#FFFDF7] font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#FFFDF7]">
              {stats.openAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
