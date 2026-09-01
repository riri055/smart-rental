import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeVariant?: 'mustard' | 'green' | 'orange' | 'red' | 'default';
  icon?: React.ReactNode;
  onClick?: () => void;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  badgeText,
  badgeVariant = 'default',
  icon,
  onClick,
  highlight = false
}) => {
  const badgeStyles = {
    mustard: 'bg-[#F7C83E] text-[#242424] font-semibold',
    green: 'bg-[#EBF5ED] text-[#2E7D32] border border-[#2E7D32]/30',
    orange: 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30',
    red: 'bg-[#FEE2E2] text-[#C62828] border border-[#C62828]/30 font-semibold',
    default: 'bg-[#F7F2E6] text-[#55534E] border border-[#242424]/15'
  }[badgeVariant];

  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg border p-4.5 transition-all bg-[#FFFDF7] ${
        highlight
          ? 'border-[#242424] ring-2 ring-[#F7C83E]/70 shadow-sm'
          : 'border-[#242424]/20 hover:border-[#242424]/40'
      } ${onClick ? 'cursor-pointer hover:bg-[#FAF7EE]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#78756E]">{title}</div>
        {icon && <div className="text-[#242424]/70 p-1 rounded bg-[#F7F2E6] border border-[#242424]/10">{icon}</div>}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2.5">
        <div className="font-mono text-3xl font-bold tracking-tight text-[#242424]">{value}</div>
        {badgeText && (
          <span className={`text-[11px] px-2 py-0.5 rounded ${badgeStyles}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtext && <div className="mt-2 text-xs text-[#78756E] line-clamp-1">{subtext}</div>}
    </div>
  );
};
