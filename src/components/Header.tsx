import React from "react";
import { Building2, Building, RefreshCw, ChevronDown, WifiOff, CheckCircle2, ListChecks, Sparkles, TrendingUp, Smartphone } from "lucide-react";
import { SyncStatus } from "../lib/firebase";
import { GmhLogo } from "./GmhLogo";

interface HeaderProps {
  currentSite: string;
  allSites: string[];
  isSyncing: boolean;
  syncStatus?: SyncStatus;
  mainViewTab?: "works" | "plans" | "pace";
  pendingPlansCount?: number;
  totalWorksCount?: number;
  onSelectViewTab?: (tab: "works" | "plans" | "pace") => void;
  onSelectSite: (siteName: string) => void;
  onOpenManageSites: () => void;
  onManualSync: () => void;
  onOpenMobileInstall?: () => void;
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
  onOpenMobileInstall,
}) => {
  const isOnline = syncStatus ? syncStatus.isOnline : true;
  const hasPending = syncStatus ? syncStatus.hasPendingSync : false;

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20 transition-all border-b border-slate-800">
      {/* Top Brand Bar */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800/80">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          {/* Brand & Active Site Selector */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <GmhLogo className="h-9 sm:h-10 w-16 sm:w-20 border border-[#D4AF37]/60 hidden xs:inline-block shrink-0 shadow-sm" />
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0 xs:hidden">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Site Selector Dropdown */}
                <div className="relative inline-flex items-center group max-w-full">
                  <select
                    value={currentSite}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW_SITE") {
                        onOpenManageSites();
                      } else {
                        onSelectSite(e.target.value);
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700/80 text-white font-bold text-sm sm:text-2xl pr-7 sm:pr-8 pl-2.5 sm:pl-3 py-1 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-colors max-w-[160px] xs:max-w-[220px] sm:max-w-none truncate"
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
                  <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 absolute right-2 pointer-events-none group-hover:text-white transition-colors" />
                </div>

                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 whitespace-nowrap hidden xs:inline-block">
                  Close-Out Tracker
                </span>

                {/* Real-time Connection Status */}
                {!isOnline ? (
                  <span
                    className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-2xs whitespace-nowrap"
                    title="Offline mode active. Your updates are saved locally and will auto-sync when online."
                  >
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span>Offline</span>
                  </span>
                ) : hasPending ? (
                  <span
                    className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1 whitespace-nowrap"
                    title="Flushing offline queue to Firestore..."
                  >
                    <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                ) : (
                  <span
                    className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 whitespace-nowrap"
                    title="Connected & Synced with Firestore"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="hidden sm:inline">Online & Synced</span>
                    <span className="sm:hidden">Online</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                Outstanding Works · Issues & Challenges · Daily, Weekly & Monthly Plans
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs w-full md:w-auto justify-end">
            {onOpenMobileInstall && (
              <button
                onClick={onOpenMobileInstall}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer font-bold shadow-xs hover:border-emerald-400 min-h-[38px] sm:min-h-[42px]"
                title="Add to Phone / Install Mobile App Shortcut"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Add to Phone</span>
                <span className="sm:hidden">App</span>
              </button>
            )}

            <button
              onClick={onOpenManageSites}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer font-medium min-h-[38px] sm:min-h-[42px]"
              title="Add or Manage Construction Sites"
            >
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Sites ({allSites.length})</span>
            </button>

            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs min-h-[38px] sm:min-h-[42px]"
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
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-2 sm:px-6 py-1.5 sm:py-2">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onSelectViewTab("works")}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer min-h-[40px] ${
                  mainViewTab === "works"
                    ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <ListChecks className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300 shrink-0" />
                <span className="hidden sm:inline">1. Outstanding Works</span>
                <span className="sm:hidden">1. Works</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-900 text-indigo-200 text-[10px] sm:text-[11px] font-black">
                  {totalWorksCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectViewTab("plans")}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer min-h-[40px] ${
                  mainViewTab === "plans"
                    ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300/60"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">2. Action Plans & Issues</span>
                <span className="sm:hidden">2. Plans</span>
                {pendingPlansCount > 0 ? (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] sm:text-[11px]">
                    {pendingPlansCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => onSelectViewTab("pace")}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer min-h-[40px] ${
                  mainViewTab === "pace"
                    ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                <span className="hidden sm:inline">3. Progression Pace</span>
                <span className="sm:hidden">3. Pace</span>
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

