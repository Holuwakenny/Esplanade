import React from "react";
import { Building2, Server, Database, Activity, RefreshCw } from "lucide-react";

interface HeaderProps {
  backendConnected: boolean;
  cloudSynced: boolean;
  isSyncing: boolean;
  onOpenBackendInfo: () => void;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendConnected,
  cloudSynced,
  isSyncing,
  onOpenBackendInfo,
  onManualSync,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20 px-6 py-4 transition-all border-b border-slate-800">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                ESPLANADE 6
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Close-Out Tracker
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Outstanding Works Tracker · Unit → Floor → Area → Work → Trade → Status
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Python Backend Badge */}
          <button
            onClick={onOpenBackendInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Click for Python Backend System Diagnostics"
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">Python 3.10</span>
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
          </button>

          {/* Cloud Firestore Database Badge */}
          <button
            onClick={onOpenBackendInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Cloud Firestore Database Connection"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Firestore Database</span>
            <span
              className={`w-2 h-2 rounded-full ${
                cloudSynced ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </button>

          {/* Sync Trigger */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>

          {/* Diagnostics Button */}
          <button
            onClick={onOpenBackendInfo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="View Architecture Details"
          >
            <Activity className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
