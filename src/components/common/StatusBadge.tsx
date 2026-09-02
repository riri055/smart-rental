import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-medium',
  }[size];

  const palette: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    Active: { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', dot: 'bg-[#1565C0]', label: 'Active' },
    Rented: { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', dot: 'bg-[#1565C0]', label: 'Rented / Active' },
    Available: { bg: 'bg-[#EBF5ED]', text: 'text-[#2E7D32]', dot: 'bg-[#2E7D32]', label: 'Available' },
    Idle: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', dot: 'bg-[#D97706]', label: 'Idle' },
    Maintenance: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', dot: 'bg-[#D97706]', label: 'Maintenance' },
    Overdue: { bg: 'bg-[#FEE2E2]', text: 'text-[#C62828]', dot: 'bg-[#C62828]', label: 'Overdue' },
    Extended: { bg: 'bg-[#FEF6DC]', text: 'text-[#B45309]', dot: 'bg-[#F7C83E]', label: 'Extended' },
    Completed: { bg: 'bg-[#EBF5ED]', text: 'text-[#2E7D32]', dot: 'bg-[#2E7D32]', label: 'Completed' },
    Unknown: { bg: 'bg-[#F7F2E6]', text: 'text-[#55534E]', dot: 'bg-[#78756E]', label: 'Unknown' },
  };

  const config = palette[status] ?? {
    bg: 'bg-[#F7F2E6]',
    text: 'text-[#242424]',
    dot: 'bg-[#78756E]',
    label: status,
  };

  const pulse = status === 'Overdue';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-[#242424]/15 ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
};
