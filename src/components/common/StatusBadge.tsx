import React from 'react';

interface StatusBadgeProps {
  status: 'Available' | 'Rented' | 'Maintenance' | 'Overdue' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-medium'
  }[size];

  switch (status) {
    case 'Available':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded border border-[#2E7D32]/30 bg-[#EBF5ED] text-[#2E7D32] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
          Available
        </span>
      );
    case 'Rented':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded border border-[#1565C0]/30 bg-[#E3F2FD] text-[#1565C0] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#1565C0]" />
          Rented / Active
        </span>
      );
    case 'Maintenance':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded border border-[#D97706]/30 bg-[#FEF3C7] text-[#D97706] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          Maintenance
        </span>
      );
    case 'Overdue':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded border border-[#C62828]/40 bg-[#FEE2E2] text-[#C62828] font-semibold ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C62828] animate-pulse" />
          Overdue
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded border border-[#242424]/20 bg-[#F7F2E6] text-[#242424] ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#78756E]" />
          {status}
        </span>
      );
  }
};

export const RiskBadge: React.FC<{ risk: 'Low' | 'Medium' | 'High' | 'Critical' | string }> = ({ risk }) => {
  switch (risk) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-[#FEE2E2] px-2 py-0.5 text-xs font-semibold text-[#C62828] border border-[#C62828]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C62828]" />
          Critical Risk
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-[#FFF1F2] px-2 py-0.5 text-xs font-medium text-[#BE123C] border border-[#BE123C]/30">
          High Risk
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#B45309] border border-[#B45309]/30">
          Medium
        </span>
      );
    case 'Low':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-[#F7F2E6] px-2 py-0.5 text-xs font-medium text-[#55534E] border border-[#242424]/15">
          Low
        </span>
      );
  }
};
