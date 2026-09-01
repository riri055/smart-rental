import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFleet();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-[#242424]';
        let icon = <Info className="w-4 h-4 text-[#1565C0] shrink-0" />;
        let bgAccent = 'border-l-4 border-l-[#1565C0]';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />;
          bgAccent = 'border-l-4 border-l-[#2E7D32]';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />;
          bgAccent = 'border-l-4 border-l-[#F7C83E]';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-4 h-4 text-[#C62828] shrink-0" />;
          bgAccent = 'border-l-4 border-l-[#C62828]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 bg-[#FFFDF7] p-3.5 rounded-md border ${borderColor} ${bgAccent} shadow-[3px_3px_0px_rgba(36,36,36,0.15)] animate-in slide-in-from-right duration-200`}
          >
            <div className="flex items-center gap-2.5 text-xs text-[#242424]">
              {icon}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#78756E] hover:text-[#242424] p-1 rounded hover:bg-[#F7F2E6] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
