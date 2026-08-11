import React, { useEffect } from "react";
import { Cloud, CheckCircle2, X, WifiOff, RefreshCw } from "lucide-react";

interface ToastNotificationProps {
  message: string;
  type?: "success" | "info" | "error";
  onClose: () => void;
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = "success",
  onClose,
  duration = 3500,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-md w-[92vw] sm:w-auto">
      <div className="bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          {type === "success" && (
            <div className="p-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
          )}
          {type === "info" && (
            <div className="p-1.5 bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-xl shrink-0">
              <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            </div>
          )}
          {type === "error" && (
            <div className="p-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-slate-100 font-semibold tracking-tight">{message}</span>
            <span className="text-[10px] text-slate-400 font-normal">Firestore Real-time Cloud Sync</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer ml-2"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
