import React from 'react';
import { useFleet, type ScreenType } from '../../context/FleetContext';
import {
  LayoutDashboard,
  MapPin,
  Boxes,
  Sliders,
  ArrowLeftRight,
  FileText,
  AlertOctagon,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

interface NavItem {
  screen: ScreenType;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'red' | 'mustard' | 'default';
}

export const Sidebar: React.FC = () => {
  const { currentScreen, navigateTo, stats, isLiveSimulationActive, toggleLiveSimulation } = useFleet();

  const navItems: NavItem[] = [
    {
      screen: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      screen: 'fleet-tracker',
      label: 'Fleet Tracker',
      icon: <MapPin className="w-4 h-4" />,
      badge: 'LIVE',
      badgeVariant: 'mustard'
    },
    {
      screen: 'assets',
      label: 'Assets',
      icon: <Boxes className="w-4 h-4" />,
      badge: stats.totalAssets
    },
    {
      screen: 'asset-details',
      label: 'Asset Details',
      icon: <Sliders className="w-4 h-4" />
    },
    {
      screen: 'check-in-out',
      label: 'Check In / Out',
      icon: <ArrowLeftRight className="w-4 h-4" />
    },
    {
      screen: 'usage-logs',
      label: 'Usage Logs',
      icon: <FileText className="w-4 h-4" />
    },
    {
      screen: 'alerts',
      label: 'Alerts',
      icon: <AlertOctagon className="w-4 h-4" />,
      badge: stats.openAlertsCount,
      badgeVariant: 'red'
    },
    {
      screen: 'ai-intelligence',
      label: 'AI Intelligence',
      icon: <Sparkles className="w-4 h-4" />,
      badge: 'AI',
      badgeVariant: 'mustard'
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#242424] text-[#FFFDF7] flex flex-col justify-between border-r border-[#242424] min-h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-[#383838]">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateTo('dashboard')}>
            <div className="w-8 h-8 rounded bg-[#F7C83E] flex items-center justify-center text-[#242424] font-black text-sm font-mono border border-[#FFFDF7]/20 shadow-sm">
              SR
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-sm text-[#FFFDF7] flex items-center gap-1.5 font-mono">
                SMART RENTAL
              </div>
              <div className="text-[10px] text-[#A5A29A] tracking-wider uppercase font-mono">
                Fleet Management
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4">
          <div className="text-[10px] uppercase font-semibold text-[#8E8B83] px-3 mb-2 tracking-wider">
            Fleet Operations
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentScreen === item.screen;
              return (
                <button
                  key={item.screen}
                  onClick={() => navigateTo(item.screen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#F7C83E] text-[#242424] font-bold shadow-[2px_2px_0px_#FFFDF7]'
                      : 'text-[#D5D2C9] hover:bg-[#333333] hover:text-[#FFFDF7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#242424]' : 'text-[#A5A29A]'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isActive
                          ? 'bg-[#242424] text-[#FFFDF7]'
                          : item.badgeVariant === 'red'
                          ? 'bg-[#C62828] text-[#FFFDF7]'
                          : item.badgeVariant === 'mustard'
                          ? 'bg-[#F7C83E]/20 text-[#F7C83E] border border-[#F7C83E]/40'
                          : 'bg-[#383838] text-[#D5D2C9]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Demo Scenarios */}
        <div className="px-3 py-3 mx-3 mt-1 rounded-md bg-[#2C2C2C] border border-[#3D3D3D]">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#F7C83E] uppercase tracking-wider mb-2 font-mono">
            <Zap className="w-3 h-3 text-[#F7C83E]" />
            Demo Scenarios
          </div>
          <div className="space-y-1.5">
            <button
              onClick={() => navigateTo('asset-details', 'EQX1007')}
              className="w-full text-left px-2 py-1.5 rounded text-[11px] bg-[#1E1E1E] hover:bg-[#363636] border border-[#3A3A3A] text-[#F3F1EC] transition-colors"
            >
              <div className="font-mono font-bold text-[#F7C83E] flex items-center justify-between">
                <span>EQX1007 Anomaly</span>
                <span className="text-[9px] px-1 rounded bg-[#C62828] text-white">0% Util</span>
              </div>
              <div className="text-[10px] text-[#A5A29A] mt-0.5">12h Idle / Unassigned</div>
            </button>

            <button
              onClick={() => navigateTo('ai-intelligence')}
              className="w-full text-left px-2 py-1.5 rounded text-[11px] bg-[#1E1E1E] hover:bg-[#363636] border border-[#3A3A3A] text-[#F3F1EC] transition-colors"
            >
              <div className="font-mono font-bold text-[#F7C83E] flex items-center justify-between">
                <span>EQX1004 Rebalance</span>
                <span className="text-[9px] px-1 rounded bg-[#D97706] text-white">18% Util</span>
              </div>
              <div className="text-[10px] text-[#A5A29A] mt-0.5">S004 → S003 Transfer</div>
            </button>

            <button
              onClick={() => navigateTo('ai-intelligence')}
              className="w-full text-left px-2 py-1.5 rounded text-[11px] bg-[#1E1E1E] hover:bg-[#363636] border border-[#3A3A3A] text-[#F3F1EC] transition-colors"
            >
              <div className="font-mono font-bold text-[#F7C83E] flex items-center justify-between">
                <span>Site S003 Demand</span>
                <span className="text-[9px] px-1 rounded bg-[#1565C0] text-white">+133%</span>
              </div>
              <div className="text-[10px] text-[#A5A29A] mt-0.5">High Excavator Forecast</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Telemetry Status */}
      <div className="p-3 border-t border-[#383838] bg-[#1E1E1E]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#D5D2C9]">
            <span className={`w-2 h-2 rounded-full ${isLiveSimulationActive ? 'bg-[#2E7D32] animate-pulse' : 'bg-[#78756E]'}`} />
            <span className="font-mono">{isLiveSimulationActive ? 'Live Telemetry' : 'Telemetry Paused'}</span>
          </div>
          <button
            onClick={toggleLiveSimulation}
            className="text-[10px] px-2 py-0.5 rounded bg-[#333333] hover:bg-[#444444] text-[#D5D2C9] font-mono border border-[#444444]"
          >
            {isLiveSimulationActive ? 'Pause' : 'Resume'}
          </button>
        </div>
        <div className="text-[10px] text-[#78756E] flex justify-between font-mono">
          <span>Assets: {stats.totalAssets} active</span>
          <span>v1.0 Standalone</span>
        </div>
      </div>
    </aside>
  );
};
