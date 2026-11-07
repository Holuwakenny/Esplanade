import React, { useState, useMemo, useEffect } from "react";
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Activity,
  ArrowDown,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  Plus,
  Filter,
  Grid,
  Columns,
  Layers,
  Sparkles,
  Building2,
  Search,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
} from "lucide-react";
import {
  SitesMap,
  FilterState,
  WorkItem,
  WorkStatus,
  WorkPriority,
} from "../types";
import { isItemMatchingFilters } from "../utils/filterUtils";
import { formatDateDisplay } from "../utils/dateUtils";
import { GmhLogo } from "./GmhLogo";

interface VisualWorkItem {
  siteName: string;
  unitName: string;
  floorName: string;
  realIndex: number;
  item: WorkItem;
}

interface WorksWithPicturesViewProps {
  sitesData: SitesMap;
  allSitesList: string[];
  activeSiteName: string;
  filters: FilterState;
  onUpdateItem: (
    siteName: string,
    unit: string,
    floor: string,
    index: number,
    field: keyof WorkItem,
    value: any
  ) => void;
  onOpenPhotos: (
    siteName: string,
    unit: string,
    floor: string,
    index: number,
    item: WorkItem
  ) => void;
  onOpenPrintReport?: () => void;
}

export const WorksWithPicturesView: React.FC<WorksWithPicturesViewProps> = ({
  sitesData,
  allSitesList,
  activeSiteName,
  filters,
  onUpdateItem,
  onOpenPhotos,
  onOpenPrintReport,
}) => {
  // Filter mode: "photos_only" (default) or "all_items"
  const [showMode, setShowMode] = useState<"photos_only" | "all_items">("photos_only");
  const [layoutMode, setLayoutMode] = useState<"cards" | "presentation" | "compact">("cards");
  const [localSearch, setLocalSearch] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(18);

  // Fullscreen Lightbox State
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    currentIndex: number;
    caption: {
      site: string;
      unit: string;
      floor: string;
      area: string;
      work: string;
      trade: string;
      status: string;
      date?: string;
    };
  } | null>(null);

  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [lightboxRotation, setLightboxRotation] = useState<number>(0);

  // Reset page size on filter or search change to keep DOM small & fast
  useEffect(() => {
    setPageSize(18);
  }, [filters, showMode, localSearch]);

  // Collect all matching items
  const allFilteredItems = useMemo<VisualWorkItem[]>(() => {
    const results: VisualWorkItem[] = [];

    // Determine sites to scan
    const sitesToScan =
      filters.sites && filters.sites.length > 0
        ? filters.sites
        : filters.site !== "all"
        ? [filters.site]
        : Object.keys(sitesData).sort((a, b) => a.localeCompare(b));

    sitesToScan.forEach((siteName) => {
      const siteUnits = sitesData[siteName] || {};
      Object.entries(siteUnits).forEach(([unitName, unitFloors]) => {
        if (unitName.startsWith("_")) return;

        const floorMap = (unitFloors || {}) as Record<string, WorkItem[]>;
        Object.entries(floorMap).forEach(([floorName, items]) => {
          if (!Array.isArray(items)) return;
          items.forEach((item, realIndex) => {
            if (!isItemMatchingFilters(item, siteName, unitName, floorName, filters)) {
              return;
            }

            // Local search within this view
            if (localSearch.trim()) {
              const q = localSearch.trim().toLowerCase();
              const matchArea = (item.area || "").toLowerCase().includes(q);
              const matchWork = (item.work || "").toLowerCase().includes(q);
              const matchTrade = (item.trade || "").toLowerCase().includes(q);
              const matchNotes = (item.notes || "").toLowerCase().includes(q);
              if (!matchArea && !matchWork && !matchTrade && !matchNotes) {
                return;
              }
            }

            // Photos filter check
            const hasPhotos = item.photos && item.photos.length > 0;
            if (showMode === "photos_only" && !hasPhotos) {
              return;
            }

            results.push({
              siteName,
              unitName,
              floorName,
              realIndex,
              item,
            });
          });
        });
      });
    });

    // Apply sorting
    const sortBy = filters.sortBy || "site";
    results.sort((a, b) => {
      if (sortBy === "priority") {
        const rank: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
        return (rank[a.item.priority || "Medium"] || 99) - (rank[b.item.priority || "Medium"] || 99);
      }
      if (sortBy === "status") {
        const rank: Record<string, number> = { "In Progress": 1, Pending: 2, Completed: 3 };
        return (rank[a.item.status] || 99) - (rank[b.item.status] || 99);
      }
      if (sortBy === "trade") {
        return (a.item.trade || "").localeCompare(b.item.trade || "");
      }
      if (sortBy === "floor") {
        return (a.floorName || "").localeCompare(b.floorName || "");
      }
      if (sortBy === "date") {
        return (b.item.updatedAt || "").localeCompare(a.item.updatedAt || "");
      }
      // Default: site & unit
      return a.siteName.localeCompare(b.siteName) || a.unitName.localeCompare(b.unitName);
    });

    return results;
  }, [sitesData, filters, showMode, localSearch]);

  // Fast slice of visible items for high-performance 60fps rendering
  const visibleItems = useMemo(() => {
    return allFilteredItems.slice(0, pageSize);
  }, [allFilteredItems, pageSize]);

  // Overall photo metrics
  const photoMetrics = useMemo(() => {
    let totalItems = 0;
    let itemsWithPhotos = 0;
    let totalPhotos = 0;
    let completedWithPhotos = 0;

    Object.entries(sitesData).forEach(([siteName, units]) => {
      Object.entries(units).forEach(([unitName, floors]) => {
        if (unitName.startsWith("_")) return;
        const floorMap = (floors || {}) as Record<string, WorkItem[]>;
        Object.entries(floorMap).forEach(([_, items]) => {
          if (!Array.isArray(items)) return;
          items.forEach((item) => {
            totalItems++;
            if (item.photos && item.photos.length > 0) {
              itemsWithPhotos++;
              totalPhotos += item.photos.length;
              if (item.status === "Completed") {
                completedWithPhotos++;
              }
            }
          });
        });
      });
    });

    return { totalItems, itemsWithPhotos, totalPhotos, completedWithPhotos };
  }, [sitesData]);

  // Open Lightbox
  const handleOpenLightbox = (
    images: string[],
    initialIndex: number,
    vw: VisualWorkItem
  ) => {
    setLightboxData({
      images,
      currentIndex: initialIndex,
      caption: {
        site: vw.siteName,
        unit: vw.unitName,
        floor: vw.floorName,
        area: vw.item.area,
        work: vw.item.work,
        trade: vw.item.trade,
        status: vw.item.status,
        date: vw.item.updatedAt,
      },
    });
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

  const handleNextPhoto = () => {
    if (!lightboxData) return;
    setLightboxData((prev) =>
      prev
        ? {
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length,
          }
        : null
    );
    setLightboxZoom(1);
  };

  const handlePrevPhoto = () => {
    if (!lightboxData) return;
    setLightboxData((prev) =>
      prev
        ? {
            ...prev,
            currentIndex:
              (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
          }
        : null
    );
    setLightboxZoom(1);
  };

  const handleDownloadActivePhoto = () => {
    if (!lightboxData) return;
    const currentImg = lightboxData.images[lightboxData.currentIndex];
    const link = document.createElement("a");
    link.href = currentImg;
    link.download = `SitePhoto_${lightboxData.caption.unit}_${lightboxData.caption.area.replace(/\s+/g, "_")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper status color
  const getStatusBadge = (status: WorkStatus) => {
    switch (status) {
      case "Completed":
        return {
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case "In Progress":
        return {
          bg: "bg-amber-100 text-amber-900 border-amber-300",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
        };
      case "Pending":
      default:
        return {
          bg: "bg-rose-100 text-rose-800 border-rose-300",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
        };
    }
  };

  // Helper priority color
  const getPriorityStyle = (priority: WorkPriority = "Medium") => {
    switch (priority) {
      case "Critical":
        return {
          bg: "bg-rose-600 text-white border-rose-700",
          icon: <Flame className="w-3.5 h-3.5 text-rose-200 animate-pulse" />,
        };
      case "High":
        return {
          bg: "bg-amber-500 text-slate-950 border-amber-600 font-extrabold",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-950" />,
        };
      case "Medium":
        return {
          bg: "bg-sky-100 text-sky-800 border-sky-300",
          icon: <Activity className="w-3.5 h-3.5 text-sky-600" />,
        };
      case "Low":
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-300",
          icon: <ArrowDown className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-slate-950 via-[#071D49] to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-black tracking-wide uppercase">
                Interactive Visual Report
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Live In-App Photo Gallery & Inspection Deck
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Works & Tasks with Pictures</span>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {allFilteredItems.length} items
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Inspect site progress directly on-screen with high-resolution photos, bold captions, trade badges, and direct status updates without having to print or export.
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total Photos
              </div>
              <div className="text-lg font-black text-[#D4AF37]">
                {photoMetrics.totalPhotos}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Items w/ Photos
              </div>
              <div className="text-lg font-black text-sky-400">
                {photoMetrics.itemsWithPhotos}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Photo Close-Out
              </div>
              <div className="text-lg font-black text-emerald-400">
                {photoMetrics.itemsWithPhotos > 0
                  ? Math.round((photoMetrics.completedWithPhotos / photoMetrics.itemsWithPhotos) * 100)
                  : 0}
                %
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Completed
              </div>
              <div className="text-lg font-black text-white">
                {photoMetrics.completedWithPhotos}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: View Switcher, Filter Toggle, Local Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Toggle Mode: Only Items with Photos vs All Items */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setShowMode("photos_only")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              showMode === "photos_only"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Items with Pictures ({photoMetrics.itemsWithPhotos})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMode("all_items")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              showMode === "all_items"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>All Works ({photoMetrics.totalItems})</span>
          </button>
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-xs min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search photo captions, area..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Layout Mode Toggles */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setLayoutMode("cards")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                layoutMode === "cards"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Inspection Cards Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("presentation")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                layoutMode === "presentation"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Presentation Showcase Mode (Large Photos)"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Direct Print Report Button */}
          {onOpenPrintReport && (
            <button
              type="button"
              onClick={onOpenPrintReport}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Generate printable PDF/Paper report"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Items View: Cards or Presentation */}
      {allFilteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {showMode === "photos_only"
                ? "No Works with Pictures in Current Filter"
                : "No Works Found"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {showMode === "photos_only"
                ? "There are no photos attached to the items matching your current filters yet. You can switch to 'All Works' above to add photos to any work item directly."
                : "Try adjusting your filter criteria or search query above to see more items."}
            </p>
          </div>
          {showMode === "photos_only" && (
            <button
              type="button"
              onClick={() => setShowMode("all_items")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Show All Works & Add Pictures
            </button>
          )}
        </div>
      ) : layoutMode === "presentation" ? (
        /* Presentation / Showcase Mode: 1 or 2 Columns with Large High-Def Pictures */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleItems.map((vw) => {
            const photos = vw.item.photos || [];
            const hasPhotos = photos.length > 0;
            const statusStyle = getStatusBadge(vw.item.status);
            const priorityStyle = getPriorityStyle(vw.item.priority);

            return (
              <div
                key={`${vw.siteName}-${vw.unitName}-${vw.floorName}-${vw.realIndex}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Visual Picture Area */}
                <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden group">
                  {hasPhotos ? (
                    <>
                      <img
                        src={photos[0]}
                        alt={vw.item.work}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => handleOpenLightbox(photos, 0, vw)}
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-xs font-black tracking-wide border border-white/20">
                          {photos.length} Photo{photos.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLightbox(photos, 0, vw)}
                        className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Inspect Fullscreen</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400 font-semibold">
                        No photos attached yet
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenPhotos(
                            vw.siteName,
                            vw.unitName,
                            vw.floorName,
                            vw.realIndex,
                            vw.item
                          )
                        }
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Photo</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Multiple Photos Thumbnails strip */}
                {photos.length > 1 && (
                  <div className="flex items-center gap-2 p-2 bg-slate-100 overflow-x-auto border-b border-slate-200">
                    {photos.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleOpenLightbox(photos, pIdx, vw)}
                        className="w-14 h-14 rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-600 shrink-0 cursor-pointer transition-all"
                      >
                        <img src={p} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPhotos(
                          vw.siteName,
                          vw.unitName,
                          vw.floorName,
                          vw.realIndex,
                          vw.item
                        )
                      }
                      className="w-14 h-14 rounded-lg bg-white border border-dashed border-indigo-300 hover:border-indigo-600 text-indigo-600 flex flex-col items-center justify-center shrink-0 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                )}

                {/* Content & Bold Captions */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Location Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[11px]">
                        {vw.siteName}
                      </span>
                      <span>·</span>
                      <span className="text-slate-800 font-bold">{vw.unitName}</span>
                      <span>·</span>
                      <span>{vw.floorName}</span>
                    </div>

                    {/* Bold Caption Title & Area */}
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-snug">
                        {vw.item.work}
                      </h4>
                      <p className="text-xs font-bold text-indigo-700 mt-0.5">
                        📍 Area / Room: {vw.item.area || "General Area"}
                      </p>
                    </div>

                    {/* Notes if any */}
                    {vw.item.notes && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 italic">
                        "{vw.item.notes}"
                      </div>
                    )}
                  </div>

                  {/* Badges and Interactive Quick Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Trade Badge */}
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-[11px]">
                        🛠️ {vw.item.trade || "Unassigned"}
                      </span>

                      {/* Priority */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border ${priorityStyle.bg}`}
                      >
                        {priorityStyle.icon}
                        <span>{vw.item.priority || "Medium"}</span>
                      </span>

                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: WorkStatus =
                            vw.item.status === "Pending"
                              ? "In Progress"
                              : vw.item.status === "In Progress"
                              ? "Completed"
                              : "Pending";
                          onUpdateItem(
                            vw.siteName,
                            vw.unitName,
                            vw.floorName,
                            vw.realIndex,
                            "status",
                            nextStatus
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-black border text-xs cursor-pointer shadow-2xs hover:brightness-95 transition-all ${statusStyle.bg}`}
                        title="Click to toggle status"
                      >
                        {statusStyle.icon}
                        <span>{vw.item.status}</span>
                      </button>
                    </div>

                    {/* Manage Photos Trigger */}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPhotos(
                          vw.siteName,
                          vw.unitName,
                          vw.floorName,
                          vw.realIndex,
                          vw.item
                        )
                      }
                      className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{hasPhotos ? "Manage Photos" : "Add Photo"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Cards Grid Mode: 2-3 Columns for Easy Scanning */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {visibleItems.map((vw) => {
            const photos = vw.item.photos || [];
            const hasPhotos = photos.length > 0;
            const statusStyle = getStatusBadge(vw.item.status);
            const priorityStyle = getPriorityStyle(vw.item.priority);

            return (
              <div
                key={`${vw.siteName}-${vw.unitName}-${vw.floorName}-${vw.realIndex}`}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Photo Banner */}
                <div className="relative bg-slate-900 aspect-[4/3] flex items-center justify-center overflow-hidden group">
                  {hasPhotos ? (
                    <>
                      <img
                        src={photos[0]}
                        alt={vw.item.work}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => handleOpenLightbox(photos, 0, vw)}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white text-[11px] font-black border border-white/20">
                          {photos.length} Photo{photos.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLightbox(photos, 0, vw)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Click to zoom / inspect"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400 font-semibold">No pictures attached</p>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenPhotos(
                            vw.siteName,
                            vw.unitName,
                            vw.floorName,
                            vw.realIndex,
                            vw.item
                          )
                        }
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-md cursor-pointer inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Photo</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Multiple Photos Strip */}
                {photos.length > 1 && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 overflow-x-auto border-b border-slate-100">
                    {photos.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleOpenLightbox(photos, pIdx, vw)}
                        className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 hover:border-indigo-600 shrink-0 cursor-pointer"
                      >
                        <img src={p} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPhotos(
                          vw.siteName,
                          vw.unitName,
                          vw.floorName,
                          vw.realIndex,
                          vw.item
                        )
                      }
                      className="w-10 h-10 rounded-md bg-white border border-dashed border-indigo-300 text-indigo-600 flex items-center justify-center shrink-0 cursor-pointer text-xs"
                      title="Add more photos"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Details & Captions */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1.5">
                    {/* Location Tag */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold truncate">
                      <span className="font-bold text-slate-800">{vw.siteName}</span>
                      <span>·</span>
                      <span>{vw.unitName}</span>
                      <span>·</span>
                      <span>{vw.floorName}</span>
                    </div>

                    {/* Bold Caption */}
                    <h4 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {vw.item.work}
                    </h4>

                    {/* Area */}
                    <div className="text-xs font-bold text-indigo-700">
                      📍 {vw.item.area || "General Area"}
                    </div>

                    {/* Notes if any */}
                    {vw.item.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2 italic border border-slate-100">
                        "{vw.item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Interactive Status & Priority Row */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[90px]">
                        {vw.item.trade}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 ${priorityStyle.bg}`}
                      >
                        {priorityStyle.icon}
                        <span>{vw.item.priority || "Medium"}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus: WorkStatus =
                          vw.item.status === "Pending"
                            ? "In Progress"
                            : vw.item.status === "In Progress"
                            ? "Completed"
                            : "Pending";
                        onUpdateItem(
                          vw.siteName,
                          vw.unitName,
                          vw.floorName,
                          vw.realIndex,
                          "status",
                          nextStatus
                        );
                      }}
                      className={`text-[11px] font-black px-2 py-0.5 rounded-md border inline-flex items-center gap-1 cursor-pointer transition-all ${statusStyle.bg}`}
                      title="Click to toggle status"
                    >
                      {statusStyle.icon}
                      <span>{vw.item.status}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* High-Performance Load More / Pagination (Prevents lag when rendering hundreds of photos) */}
      {allFilteredItems.length > visibleItems.length && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 pb-4">
          <button
            type="button"
            onClick={() => setPageSize((prev) => prev + 18)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Load Next 18 Works with Photos</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black">
              Showing {visibleItems.length} of {allFilteredItems.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPageSize(allFilteredItems.length)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Show All ({allFilteredItems.length})
          </button>
        </div>
      )}

      {/* 4. Fullscreen Zoom & Pan Lightbox Modal */}
      {lightboxData && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-150">
          {/* Top Lightbox Controls Bar */}
          <div className="flex items-center justify-between gap-3 text-white border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">
                Photo {lightboxData.currentIndex + 1} of {lightboxData.images.length}
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="text-xs font-extrabold text-[#D4AF37] hidden sm:inline truncate max-w-sm">
                {lightboxData.caption.site} · {lightboxData.caption.unit} · {lightboxData.caption.area}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom In / Out */}
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.25, 3))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.25, 0.75))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {/* Rotate */}
              <button
                type="button"
                onClick={() => setLightboxRotation((prev) => (prev + 90) % 360)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              {/* Download */}
              <button
                type="button"
                onClick={handleDownloadActivePhoto}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Download Photo"
              >
                <Download className="w-4 h-4" />
              </button>
              {/* Close */}
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer ml-2"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Image Canvas with Prev / Next */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-3">
            {lightboxData.images.length > 1 && (
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 cursor-pointer shadow-lg transition-transform active:scale-95"
                title="Previous photo"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            <div className="w-full h-full flex items-center justify-center p-2">
              <img
                src={lightboxData.images[lightboxData.currentIndex]}
                alt=""
                decoding="async"
                style={{
                  transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                  transition: "transform 0.2s ease-out",
                }}
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
              />
            </div>

            {lightboxData.images.length > 1 && (
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 cursor-pointer shadow-lg transition-transform active:scale-95"
                title="Next photo"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Bottom Captions & Details Bar */}
          <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3 sm:p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-400">
                {lightboxData.caption.site} · {lightboxData.caption.unit} · {lightboxData.caption.floor} · {lightboxData.caption.area}
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                {lightboxData.caption.work}
              </h4>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold">
                🛠️ {lightboxData.caption.trade}
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                Status: {lightboxData.caption.status}
              </span>
              {lightboxData.caption.date && (
                <span className="text-slate-400 text-[11px]">
                  Updated: {formatDateDisplay(lightboxData.caption.date)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
