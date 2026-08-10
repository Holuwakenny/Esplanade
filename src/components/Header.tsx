import React from "react";
import { Building2, Building, RefreshCw, ChevronDown, WifiOff, CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import { SyncStatus } from "../lib/firebase";

interface HeaderProps {
  currentSite: string;
  allSites: string[];
  isSyncing: boolean;
  syncStatus?: SyncStatus;
  mainViewTab?: "works" | "plans";
  pendingPlansCount?: number;
  totalWorksCount?: number;
  onSelectViewTab?: (tab: "works" | "plans") => void;
  onSelectSite: (siteName: string) => void;
  onOpenManageSites: () => void;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSite,
  allSites,
  isSyncing,
  syncStatus,
  mainViewTab = "works",
  pendingPlansCount = 0,
  totalWorksCount = 0,
  onSelectViewTab,
  onSelectSite,
  onOpenManageSites,
  onManualSync,
}) => {
  const isOnline = syncStatus ? syncStatus.isOnline : true;
  const hasPending = syncStatus ? syncStatus.hasPendingSync : false;

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20 transition-all border-b border-slate-800">
      {/* Top Brand Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800/80">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Brand & Active Site Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Site Selector Dropdown */}
                <div className="relative inline-flex items-center group">
                  <select
                    value={currentSite}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW_SITE") {
                        onOpenManageSites();
                      } else {
                        onSelectSite(e.target.value);
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700/80 text-white font-bold text-base sm:text-2xl pr-8 pl-3 py-1 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-colors max-w-[220px] sm:max-w-none truncate"
                  >
                    <option value="all" className="bg-slate-900 text-indigo-300 font-bold text-base">
                      All Sites (All Active Projects)
                    </option>
                    {allSites.map((site) => (
                      <option key={site} value={site} className="bg-slate-900 text-white font-normal text-base">
                        {site}
                      </option>
                    ))}
                    <option value="ADD_NEW_SITE" className="bg-slate-900 text-indigo-400 font-semibold text-base">
                      + Add / Manage Sites...
                    </option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-2.5 pointer-events-none group-hover:text-white transition-colors" />
                </div>

                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Close-Out Tracker
                </span>

                {/* Real-time Connection Status */}
                {!isOnline ? (
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-2xs"
                    title="Offline mode active. Your updates are saved locally and will auto-sync when online."
                  >
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Offline (Queued)</span>
                  </span>
                ) : hasPending ? (
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5"
                    title="Flushing offline queue to Firestore..."
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                    <span>Syncing Queue...</span>
                  </span>
                ) : (
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                    title="Connected & Synced with Firestore"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Online & Synced</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Outstanding Works · Issues & Challenges · Daily, Weekly & Monthly Plans
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs self-end md:self-auto">
            <button
              onClick={onOpenManageSites}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer font-medium"
              title="Add or Manage Construction Sites"
            >
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Sites ({allSites.length})</span>
            </button>

            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Synchronize works data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs Sub-Bar */}
      {onSelectViewTab && (
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 sm:px-6 py-2">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onSelectViewTab("works")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mainViewTab === "works"
                    ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <ListChecks className="w-4 h-4 text-indigo-300" />
                <span>1. Outstanding Works</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-indigo-200 text-[11px] font-black">
                  {totalWorksCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectViewTab("plans")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mainViewTab === "plans"
                    ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300/60"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>2. Action Plans & Issues</span>
                <span className="hidden md:inline text-[10px] text-amber-200/80 font-normal">
                  (Issues · Daily · Weekly · Monthly)
                </span>
                {pendingPlansCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[11px]">
                    {pendingPlansCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span>Current Site: <strong className="text-white">{currentSite}</strong></span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

