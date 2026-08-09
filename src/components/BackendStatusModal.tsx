import React, { useState, useEffect } from "react";
import { X, Server, Database, Activity, CheckCircle, Code, RefreshCw } from "lucide-react";
import { SiteTrackerData } from "../types";

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SiteTrackerData;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const json = await res.json();
        setHealth(json);
      } else {
        setHealth({ status: "error", code: res.status });
      }
    } catch (e: any) {
      setHealth({ status: "offline", error: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Python Backend & Cloud Database Diagnostics</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Architecture Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-500" /> System Architecture & Runtime Topology
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-mono text-[10px]">FRONTEND</span>
                <span className="font-bold text-slate-800">React 19 + Vite</span>
                <span className="block text-slate-500 text-[11px]">Port 3000 Ingress</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-amber-600 block font-mono text-[10px]">BACKEND SERVICE</span>
                <span className="font-bold text-amber-700">Python 3.10 Server</span>
                <span className="block text-slate-500 text-[11px]">Port 5000 REST API</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-blue-600 block font-mono text-[10px]">CLOUD DATABASE</span>
                <span className="font-bold text-blue-700">Google Cloud Firestore</span>
                <span className="block text-slate-500 text-[11px]">Realtime Cloud Storage</span>
              </div>
            </div>
          </div>

          {/* Python Health Ping */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Code className="w-4 h-4" /> Live Health Check (/api/health)
              </span>
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-slate-400 italic">Pinging Python 3.10 server...</p>
            ) : health ? (
              <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto text-[11px]">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : (
              <p className="text-rose-400">Unable to reach Python backend service.</p>
            )}
          </div>

          {/* Cloud Database Info */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-1">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Firebase Cloud Database Active</span>
            </div>
            <p className="text-xs text-blue-800">
              Project ID: <code className="font-mono font-semibold">qualified-exchanger-4lcgc</code>
            </p>
            <p className="text-xs text-blue-700">
              All outstanding works edits, additions, and status changes automatically sync to both Python server memory & persistent Cloud Firestore.
            </p>
          </div>

          {/* Raw JSON Data Preview */}
          <div className="space-y-1">
            <span className="font-bold text-slate-700">Current Site Storage JSON</span>
            <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 max-h-40 overflow-y-auto font-mono text-[11px] text-slate-700">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
