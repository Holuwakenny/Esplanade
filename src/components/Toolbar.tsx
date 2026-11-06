import React from "react";
import {
  Plus,
  Printer,
  RotateCcw,
  Download,
  PieChart,
  Search,
  Filter,
  Building2,
  Calendar,
  FileText,
  Building,
  FolderPlus,
  FileDown,
  AlertCircle,
  Sparkles,
  Database,
  ArrowUpDown,
  Smartphone,
  X,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { FilterState, DateFilterType } from "../types";

interface ToolbarProps {
  filters: FilterState;
  onFilterChange: (field: keyof FilterState, value: string) => void;
  sitesList: string[];
  units: string[];
  floors: string[];
  trades: string[];
  onAddWork: () => void;
  onOpenManageSites: () => void;
  onOpenManageUnits: () => void;
  onOpenTradeAnalytics: () => void;
  onOpenReports: () => void;
  onOpenExecutiveSummary?: () => void;
  onOpenStorageOptions?: () => void;
  onOpenPdfExport?: () => void;
  onOpenMobileInstall?: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  filters,
  onFilterChange,
  sitesList,
  units,
  floors,
  trades,
  onAddWork,
  onOpenManageSites,
  onOpenManageUnits,
  onOpenTradeAnalytics,
  onOpenReports,
  onOpenExecutiveSummary,
  onOpenStorageOptions,
  onOpenPdfExport,
  onOpenMobileInstall,
  onExportCsv,
  onPrint,
  onReset,
}) => {
  // Count active filters
  const activeFiltersCount = [
    filters.site !== "all",
    filters.sortBy && filters.sortBy !== "site",
    filters.dateFilter !== "all",
    filters.unit !== "all",
    filters.floor !== "all",
    filters.priority && filters.priority !== "all",
    filters.status !== "all",
    filters.trade !== "all",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    onFilterChange("site", "all");
    onFilterChange("sortBy", "site");
    onFilterChange("dateFilter", "all");
    onFilterChange("unit", "all");
    onFilterChange("floor", "all");
    onFilterChange("priority", "all");
    onFilterChange("status", "all");
    onFilterChange("trade", "all");
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-xs mb-6 space-y-4">
      {/* SECTION 1: THE 8 FILTERS ROW (POSITIONED PROMINENTLY ABOVE CLOSE-OUT PROGRESS) */}
      <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 sm:p-4 space-y-3">
        {/* Filter Section Header Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              Scope & Filter Criteria
            </span>
            {activeFiltersCount > 0 ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                {activeFiltersCount} active
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                (Showing all project records)
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* The 8 Filters Grid: 2 columns on mobile, 4 on tablet, 8 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
          {/* 1. Site / Category */}
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label className="font-bold text-indigo-950 flex items-center gap-1 text-[11px] truncate">
              <Building className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>Site / Category</span>
            </label>
            <select
              value={filters.site}
              onChange={(e) => onFilterChange("site", e.target.value)}
              className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-slate-900 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px] cursor-pointer"
            >
              <option value="all">All Sites & Categories</option>
              {sitesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Sort Items By */}
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label className="font-bold text-indigo-950 flex items-center gap-1 text-[11px] truncate">
              <ArrowUpDown className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>Sort Items By</span>
            </label>
            <select
              value={filters.sortBy || "site"}
              onChange={(e) => onFilterChange("sortBy", e.target.value)}
              className="w-full p-2 bg-indigo-50/70 border border-indigo-300 rounded-lg text-slate-900 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs min-h-[42px] cursor-pointer"
            >
              <option value="site">🏗️ Site & Location (A→Z)</option>
              <option value="priority">⚡ Priority (High → Low)</option>
              <option value="floor">🏢 Floor & Area</option>
              <option value="trade">🛠️ Trade / Artisan</option>
              <option value="status">📊 Status (Active first)</option>
              <option value="date">📅 Date Updated (Recent)</option>
            </select>
          </div>

          {/* 3. Date Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-600 flex items-center gap-1 text-[11px] truncate">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Date Filter</span>
            </label>
            <select
              value={filters.dateFilter}
              onChange={(e) => onFilterChange("dateFilter", e.target.value as DateFilterType)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px] cursor-pointer"
            >
              <option value="all">All Dates / Lifetime</option>
              <option value="today">Today (Daily Report)</option>
              <option value="this_week">This Week (7 Days)</option>
              <option value="this_month">This Month (30 Days)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* 4. Unit */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-600 flex items-center gap-1 text-[11px] truncate">
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Unit</span>
            </label>
            <select
              value={filters.unit}
              onChange={(e) => onFilterChange("unit", e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px] cursor-pointer"
            >
              <option value="all">All Units</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Floor */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-600 flex items-center gap-1 text-[11px] truncate">
              <Layers className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Floor</span>
            </label>
            <select
              value={filters.floor}
              onChange={(e) => onFilterChange("floor", e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px] cursor-pointer"
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Priority */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-600 flex items-center gap-1 text-[11px] truncate">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Priority</span>
            </label>
            <select
              value={filters.priority || "all"}
              onChange={(e) => onFilterChange("priority", e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">🔥 Critical</option>
              <option value="High">⚠️ High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">🔽 Low</option>
            </select>
          </div>

          {/* 7. Status */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-600 flex items-center gap-1 text-[11px] truncate">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Status</span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange("status", e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* 8. Trade / Artisan */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-600 flex items-center gap-1 text-[11px] truncate">
              <PieChart className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Trade / Artisan</span>
            </label>
            <select
              value={filters.trade}
              onChange={(e) => onFilterChange("trade", e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px] cursor-pointer"
            >
              <option value="all">All Trades</option>
              {trades.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker when "custom" is selected */}
        {filters.dateFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-200/80 text-xs bg-white p-2.5 rounded-lg">
            <span className="font-bold text-slate-700">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">From:</span>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => onFilterChange("startDate", e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md bg-white text-slate-800 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">To:</span>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => onFilterChange("endDate", e.target.value)}
                className="p-1.5 border border-slate-300 rounded-md bg-white text-slate-800 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: SEARCH & ACTION CONTROLS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search work description, area, trade, or notes..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50/90 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all min-h-[42px]"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons: Horizontally scrollable on mobile for thumb ergonomics, wrapped on desktop */}
        <div className="overflow-x-auto no-scrollbar flex items-center gap-2 pb-1 lg:pb-0 lg:flex-wrap">
          {/* Add Work (Primary CTA) */}
          <button
            onClick={onAddWork}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Work</span>
          </button>

          {/* 5-Point Executive Word Summary */}
          {onOpenExecutiveSummary && (
            <button
              onClick={onOpenExecutiveSummary}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-950 hover:bg-slate-900 active:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ring-1 ring-indigo-400/40 shrink-0 min-h-[42px]"
              title="Generate comprehensive 5-Question Word (.docx / .doc) Summary with Photos"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>5-Point Word Summary</span>
            </button>
          )}

          {/* PDF Export */}
          {onOpenPdfExport && (
            <button
              onClick={onOpenPdfExport}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0 min-h-[42px]"
              title="Save all site work and picture captions to PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Save to PDF</span>
            </button>
          )}

          {/* Reports */}
          <button
            onClick={onOpenReports}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-200/80 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
            title="Generate & print Daily or Weekly site progress reports"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Daily/Weekly Reports</span>
          </button>

          {/* Manage Sites */}
          <button
            onClick={onOpenManageSites}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-200/80 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
            title="Switch sites, manage projects, or create templates like Esplanade 6 or EGC3"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Sites ({sitesList.length})</span>
          </button>

          {/* Units */}
          <button
            onClick={onOpenManageUnits}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
            title="List, manage, or create new building units"
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Units ({units.length})</span>
          </button>

          {/* Trades */}
          <button
            onClick={onOpenTradeAnalytics}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
          >
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Trades</span>
          </button>

          {/* Mobile App */}
          {onOpenMobileInstall && (
            <button
              onClick={onOpenMobileInstall}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold border border-emerald-300 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
              title="Add mobile shortcut to home screen or install PWA"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Mobile App</span>
            </button>
          )}

          {/* Storage */}
          {onOpenStorageOptions && (
            <button
              onClick={onOpenStorageOptions}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
              title="View free storage & database options guide"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Storage</span>
            </button>
          )}

          {/* CSV Export */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>

          {/* Print */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs shrink-0 min-h-[42px]"
            title="Printer-friendly view"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-xl text-xs sm:text-sm font-medium border border-rose-200/80 transition-all cursor-pointer shrink-0 min-h-[42px]"
            title="Reset dataset"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
