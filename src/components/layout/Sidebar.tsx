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
  QrCode,
} from 'lucide-react';

interface NavItem {
  screen: ScreenType;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'red' | 'default';
}

export const Sidebar: React.FC = () => {
  const { currentScreen, navigateTo, stats } = useFleet();

  const operationalItems: NavItem[] = [
    {
      screen: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      screen: 'assets',
      label: 'Assets',
      icon: <Boxes className="w-4 h-4" />,
      badge: stats.totalAssets,
    },
    {
      screen: 'fleet-tracker',
      label: 'Fleet Tracker',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      screen: 'asset-details',
      label: 'Asset Details',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      screen: 'check-in-out',
      label: 'Check In / Out',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      screen: 'qr-scan',
      label: 'Scan QR',
      icon: <QrCode className="w-4 h-4" />,
    },
  ];

  const insightItems: NavItem[] = [
    {
      screen: 'usage-logs',
      label: 'Usage Logs',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      screen: 'alerts',
      label: 'Alerts',
      icon: <AlertOctagon className="w-4 h-4" />,
      badge: stats.openAlertsCount,
      badgeVariant: 'red',
    },
    {
      screen: 'ai-intelligence',
      label: 'AI Intelligence',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  const renderItem = (item: NavItem) => {
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
          <span className={isActive ? 'text-[#242424]' : 'text-[#A5A29A]'}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </div>

        {item.badge !== undefined && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              isActive
                ? 'bg-[#242424] text-[#FFFDF7]'
                : item.badgeVariant === 'red'
                  ? 'bg-[#C62828] text-[#FFFDF7]'
                  : 'bg-[#383838] text-[#D5D2C9]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-64 shrink-0 bg-[#242424] text-[#FFFDF7] flex flex-col justify-between border-r border-[#242424] min-h-screen select-none">
      <div>
        <div className="p-5 border-b border-[#383838]">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigateTo('dashboard')}
          >
            <div className="w-9 h-9 rounded bg-[#F7C83E] flex items-center justify-center text-[#242424] font-black text-[10px] font-mono border border-[#FFFDF7]/20 shadow-sm leading-none">
              CAT
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-[15px] text-[#FFFDF7] font-mono leading-none">
                <span className="text-[#F7C83E]">CAT</span> RentalAI
              </div>
              <div className="text-[10px] text-[#A5A29A] tracking-wider uppercase font-mono mt-1">
                Fleet Operations
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-4 space-y-5">
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#8E8B83] px-3 mb-2 tracking-wider">
              Fleet Operations
            </div>
            <nav className="space-y-1">{operationalItems.map(renderItem)}</nav>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#8E8B83] px-3 mb-2 tracking-wider">
              Insights &amp; Records
            </div>
            <nav className="space-y-1">{insightItems.map(renderItem)}</nav>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#383838] bg-[#1E1E1E]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#D5D2C9]">
            <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
            <span className="font-mono">Backend Connected</span>
          </div>
        </div>
        <div className="text-[10px] text-[#78756E] flex justify-between font-mono">
          <span>Assets: {stats.totalAssets} tracked</span>
          <span>Demo data</span>
        </div>
      </div>
    </aside>
  );
};
