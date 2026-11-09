import React, { useState, useRef, useEffect } from "react";
import {
  Building2,
  Building,
  RefreshCw,
  ChevronDown,
  WifiOff,
  CheckCircle2,
  ListChecks,
  Sparkles,
  TrendingUp,
  Smartphone,
  Camera,
  Check,
  X,
  Search,
  PlusCircle,
} from "lucide-react";
import { SyncStatus } from "../lib/firebase";
import { GmhLogo } from "./GmhLogo";

interface HeaderProps {
  currentSite: string;
  selectedSites?: string[];
  allSites: string[];
  isSyncing: boolean;
  syncStatus?: SyncStatus;
  mainViewTab?: "works" | "plans" | "pace" | "photos";
  pendingPlansCount?: number;
  totalWorksCount?: number;
  totalPhotosCount?: number;
  onSelectViewTab?: (tab: "works" | "plans" | "pace" | "photos") => void;
  onSelectSite: (siteName: string) => void;
  onSelectSites?: (sites: string[]) => void;
  onOpenManageSites: () => void;
  onManualSync: () => void;
  onOpenMobileInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSite,
  selectedSites = [],
  allSites,
  isSyncing,
  syncStatus,
  mainViewTab = "works",
  pendingPlansCount = 0,
  totalWorksCount = 0,
  totalPhotosCount = 0,
  onSelectViewTab,
  onSelectSite,
  onSelectSites,
  onOpenManageSites,
  onManualSync,
  onOpenMobileInstall,
}) => {
  const isOnline = syncStatus ? syncStatus.isOnline : true;
  const hasPending = syncStatus ? syncStatus.hasPendingSync : false;

  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [siteSearchQuery, setSiteSearchQuery] = useState("");
  const siteDropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target as Node)) {
        setIsSiteDropdownOpen(false);
      }
    };
    if (isSiteDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSiteDropdownOpen]);

  // Determine current active multi-selected sites
  const isAllSitesExplicit = Boolean(selectedSites && selectedSites.length === allSites.length);
  const isAllSitesImplicit = (!selectedSites || selectedSites.length === 0) && (currentSite === "all" || !allSites.includes(currentSite));
  const isAllSites = isAllSitesExplicit || isAllSitesImplicit;

  // Active sites list for checkboxes
  const activeSelectedSites =
    selectedSites && selectedSites.length > 0 && !isAllSitesExplicit
      ? selectedSites
      : currentSite !== "all" && allSites.includes(currentSite) && !isAllSitesImplicit
      ? [currentSite]
      : allSites;

  const handleToggleSite = (siteName: string) => {
    let next: string[];
    // If all sites were active and user taps a specific site, narrow to just that site
    if (isAllSites && allSites.length > 1) {
      next = [siteName];
    } else if (activeSelectedSites.includes(siteName)) {
      next = activeSelectedSites.filter((s) => s !== siteName);
      if (next.length === 0) {
        next = []; // If all unchecked, revert to showing all sites
      }
    } else {
      next = [...activeSelectedSites, siteName];
      if (next.length === allSites.length) {
        next = []; // Normalized to all sites
      }
    }

    if (onSelectSites) {
      onSelectSites(next);
    } else if (onSelectSite) {
      onSelectSite(next.length === 1 ? next[0] : "all");
    }
  };

  const handleSelectAllSites = () => {
    if (onSelectSites) {
      onSelectSites([]);
    } else if (onSelectSite) {
      onSelectSite("all");
    }
  };

  const handleClearSites = () => {
    if (onSelectSites) {
      onSelectSites([]);
    } else if (onSelectSite) {
      onSelectSite("all");
    }
  };

  const filteredSites = siteSearchQuery.trim()
    ? allSites.filter((s) => s.toLowerCase().includes(siteSearchQuery.toLowerCase().trim()))
    : allSites;

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
                {/* Multi-Select Top Site Filter */}
                <div className="relative inline-flex items-center max-w-full" ref={siteDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSiteDropdownOpen((prev) => !prev)}
                    className="bg-slate-800 hover:bg-slate-700/90 text-white font-bold text-sm sm:text-lg md:text-xl pr-8 pl-3 py-1 sm:py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60 cursor-pointer transition-all max-w-[210px] xs:max-w-[280px] sm:max-w-none truncate flex items-center gap-2 group shadow-sm text-left"
                    title="Filter by one or multiple construction sites"
                  >
                    <span className="truncate">
                      {isAllSites
                        ? `All Sites (${allSites.length} Projects)`
                        : activeSelectedSites.length === 1
                        ? activeSelectedSites[0]
                        : `${activeSelectedSites.length} Sites Selected`}
                    </span>

                    {activeSelectedSites.length > 1 && !isAllSites && (
                      <span className="text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 shrink-0">
                        {activeSelectedSites.length}
                      </span>
                    )}

                    <ChevronDown
                      className={`w-4 sm:w-5 h-4 sm:h-5 text-slate-400 absolute right-2 pointer-events-none transition-transform duration-200 group-hover:text-white ${
                        isSiteDropdownOpen ? "rotate-180 text-[#D4AF37]" : ""
                      }`}
                    />
                  </button>

                  {/* Multi-Select Dropdown Popover */}
                  {isSiteDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-24px)] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* Header with Quick Actions */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs gap-2">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px]">
                            Multi-Filter Sites ({activeSelectedSites.length === 0 ? allSites.length : activeSelectedSites.length}/{allSites.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={handleSelectAllSites}
                            className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer transition-colors"
                          >
                            Select All
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={handleClearSites}
                            className="text-slate-400 hover:text-rose-400 font-semibold cursor-pointer transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Quick Search if more than 3 sites */}
                      {allSites.length > 3 && (
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            value={siteSearchQuery}
                            onChange={(e) => setSiteSearchQuery(e.target.value)}
                            placeholder="Search sites..."
                            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                            autoFocus
                          />
                          {siteSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setSiteSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Sites Checklist */}
                      <div className="max-h-60 overflow-y-auto overscroll-contain space-y-1 pr-1 custom-scrollbar">
                        {/* 1. All Sites (All Active Projects) Option */}
                        <div
                          onClick={handleSelectAllSites}
                          className={`flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer select-none transition-colors border border-slate-800 mb-1.5 min-h-[42px] ${
                            isAllSites
                              ? "bg-indigo-950/70 text-indigo-200 font-bold border-indigo-500/40"
                              : "text-slate-300 hover:bg-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                                isAllSites
                                  ? "bg-[#D4AF37] border-[#D4AF37] text-slate-950 font-black"
                                  : "border-slate-600 bg-slate-800"
                              }`}
                            >
                              {isAllSites && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">All Sites (All Active Projects)</span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            {allSites.length}
                          </span>
                        </div>

                        {/* 2. Individual Sites with Checkboxes */}
                        {filteredSites.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-500 italic">
                            No matching sites found
                          </div>
                        ) : (
                          filteredSites.map((site) => {
                            const isChecked = activeSelectedSites.includes(site);
                            return (
                              <div
                                key={site}
                                onClick={() => handleToggleSite(site)}
                                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs sm:text-sm cursor-pointer select-none transition-colors min-h-[40px] ${
                                  isChecked
                                    ? "bg-slate-800 text-white font-bold border-l-2 border-[#D4AF37]"
                                    : "text-slate-300 hover:bg-slate-800/60"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                                      isChecked
                                        ? "bg-[#D4AF37] border-[#D4AF37] text-slate-950 font-black"
                                        : "border-slate-600 bg-slate-800"
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="truncate">{site}</span>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* 3. + Add / Manage Sites... Action */}
                        <div className="pt-1.5 mt-1 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSiteDropdownOpen(false);
                              onOpenManageSites();
                            }}
                            className="w-full text-left py-2 px-2.5 rounded-xl text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/80 flex items-center gap-2 font-semibold cursor-pointer transition-colors active:bg-slate-700 min-h-[42px]"
                          >
                            <PlusCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>+ Add / Manage Sites...</span>
                          </button>
                        </div>
                      </div>

                      {/* Footer Actions: Done */}
                      <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate">
                          {isAllSites
                            ? "Showing all active projects"
                            : `${activeSelectedSites.length} of ${allSites.length} selected`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSiteDropdownOpen(false)}
                          className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-slate-950 text-xs font-black rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          Apply & Done
                        </button>
                      </div>
                    </div>
                  )}
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

              <button
                type="button"
                onClick={() => onSelectViewTab("photos")}
                className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer min-h-[40px] ${
                  mainViewTab === "photos"
                    ? "bg-[#D4AF37] text-slate-950 shadow-md ring-2 ring-[#D4AF37]/50"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
                title="View works and tasks with pictures on-screen without printing"
              >
                <Camera className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${mainViewTab === "photos" ? "text-slate-950" : "text-[#D4AF37]"}`} />
                <span className="hidden sm:inline">4. Works with Pictures</span>
                <span className="sm:hidden">4. Pictures</span>
                {totalPhotosCount > 0 && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black ${
                    mainViewTab === "photos" ? "bg-slate-900 text-[#D4AF37]" : "bg-[#D4AF37]/20 text-[#D4AF37]"
                  }`}>
                    {totalPhotosCount}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span>
                Site Scope:{" "}
                <strong className="text-white">
                  {isAllSites
                    ? "All Sites"
                    : activeSelectedSites.length === 1
                    ? activeSelectedSites[0]
                    : `${activeSelectedSites.length} Sites (${activeSelectedSites.join(", ")})`}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

