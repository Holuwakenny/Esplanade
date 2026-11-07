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
  Camera,
  Flame,
  AlertTriangle,
  Activity,
  ArrowDown,
  Clock,
} from "lucide-react";
import { FilterState, DateFilterType } from "../types";
import { MultiSelectDropdown, MultiSelectOption } from "./MultiSelectDropdown";
import { getActiveFilterCount } from "../utils/filterUtils";

interface ToolbarProps {
  filters: FilterState;
  onFilterChange: (field: keyof FilterState, value: any) => void;
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
  onOpenPicturesView?: () => void;
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
  onOpenPicturesView,
  onExportCsv,
  onPrint,
  onReset,
}) => {
  // Count active filters
  const activeFiltersCount = getActiveFilterCount(filters);

  const handleResetFilters = () => {
    onFilterChange("site", "all");
    onFilterChange("sites", []);
    onFilterChange("sortBy", "site");
    onFilterChange("dateFilter", "all");
    onFilterChange("unit", "all");
    onFilterChange("units", []);
    onFilterChange("floor", "all");
    onFilterChange("floors", []);
    onFilterChange("priority", "all");
    onFilterChange("priorities", []);
    onFilterChange("status", "all");
    onFilterChange("statuses", []);
    onFilterChange("trade", "all");
    onFilterChange("trades", []);
    onFilterChange("search", "");
  };

  // Prepare options for multi-select dropdowns
  const siteOptions: MultiSelectOption[] = sitesList.map((s) => ({
    value: s,
    label: s,
  }));

  const unitOptions: MultiSelectOption[] = units.map((u) => ({
    value: u,
    label: u,
  }));

  const floorOptions: MultiSelectOption[] = floors.map((f) => ({
    value: f,
    label: f,
  }));

  const priorityOptions: MultiSelectOption[] = [
    {
      value: "Critical",
      label: "Critical",
      badge: <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">🔥 Critical</span>,
    },
    {
      value: "High",
      label: "High",
      badge: <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">⚠️ High</span>,
    },
    {
      value: "Medium",
      label: "Medium",
      badge: <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">⚡ Medium</span>,
    },
    {
      value: "Low",
      label: "Low",
      badge: <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">🔽 Low</span>,
    },
  ];

  const statusOptions: MultiSelectOption[] = [
    {
      value: "Pending",
      label: "Pending",
      badge: <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Pending</span>,
    },
    {
      value: "In Progress",
      label: "In Progress",
      badge: <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">In Progress</span>,
    },
    {
      value: "Completed",
      label: "Completed",
      badge: <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Completed</span>,
    },
  ];

  const tradeOptions: MultiSelectOption[] = trades.map((t) => ({
    value: t,
    label: t,
  }));

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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
              Multi-Select Enabled
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
          {/* 1. Site / Category (Multi-Select) */}
          <div className="col-span-2 sm:col-span-1">
            <MultiSelectDropdown
              label="Site / Category"
              icon={<Building className="w-3 h-3 text-indigo-600 shrink-0" />}
              options={siteOptions}
              selectedValues={
                filters.sites && filters.sites.length > 0
                  ? filters.sites
                  : filters.site !== "all"
                  ? [filters.site]
                  : []
              }
              onChange={(vals) => {
                onFilterChange("sites", vals);
                if (vals.length === 1) onFilterChange("site", vals[0]);
                else if (vals.length === 0) onFilterChange("site", "all");
              }}
              allLabel="All Sites & Categories"
              variant="primary"
            />
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

          {/* 4. Unit (Multi-Select) */}
          <div>
            <MultiSelectDropdown
              label="Unit"
              icon={<Building2 className="w-3 h-3 text-slate-500 shrink-0" />}
              options={unitOptions}
              selectedValues={
                filters.units && filters.units.length > 0
                  ? filters.units
                  : filters.unit !== "all"
                  ? [filters.unit]
                  : []
              }
              onChange={(vals) => {
                onFilterChange("units", vals);
                if (vals.length === 1) onFilterChange("unit", vals[0]);
                else if (vals.length === 0) onFilterChange("unit", "all");
              }}
              allLabel="All Units"
            />
          </div>

          {/* 5. Floor (Multi-Select) */}
          <div>
            <MultiSelectDropdown
              label="Floor"
              icon={<Layers className="w-3 h-3 text-slate-500 shrink-0" />}
              options={floorOptions}
              selectedValues={
                filters.floors && filters.floors.length > 0
                  ? filters.floors
                  : filters.floor !== "all"
                  ? [filters.floor]
                  : []
              }
              onChange={(vals) => {
                onFilterChange("floors", vals);
                if (vals.length === 1) onFilterChange("floor", vals[0]);
                else if (vals.length === 0) onFilterChange("floor", "all");
              }}
              allLabel="All Floors"
            />
          </div>

          {/* 6. Priority (Multi-Select) */}
          <div>
            <MultiSelectDropdown
              label="Priority"
              icon={<AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />}
              options={priorityOptions}
              selectedValues={
                filters.priorities && filters.priorities.length > 0
                  ? filters.priorities
                  : filters.priority && filters.priority !== "all"
                  ? [filters.priority]
                  : []
              }
              onChange={(vals) => {
                onFilterChange("priorities", vals);
                if (vals.length === 1) onFilterChange("priority", vals[0]);
                else if (vals.length === 0) onFilterChange("priority", "all");
              }}
              allLabel="All Priorities"
            />
          </div>

          {/* 7. Status (Multi-Select) */}
          <div>
            <MultiSelectDropdown
              label="Status"
              icon={<CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
              options={statusOptions}
              selectedValues={
                filters.statuses && filters.statuses.length > 0
                  ? filters.statuses
                  : filters.status !== "all"
                  ? [filters.status]
                  : []
              }
              onChange={(vals) => {
                onFilterChange("statuses", vals);
                if (vals.length === 1) onFilterChange("status", vals[0]);
                else if (vals.length === 0) onFilterChange("status", "all");
              }}
              allLabel="All Statuses"
            />
          </div>

          {/* 8. Trade / Artisan (Multi-Select) */}
          <div>
            <MultiSelectDropdown
              label="Trade / Artisan"
              icon={<PieChart className="w-3 h-3 text-slate-500 shrink-0" />}
              options={tradeOptions}
              selectedValues={
                filters.trades && filters.trades.length > 0
                  ? filters.trades
                  : filters.trade !== "all"
                  ? [filters.trade]
                  : []
              }
              onChange={(vals) => {
                onFilterChange("trades", vals);
                if (vals.length === 1) onFilterChange("trade", vals[0]);
                else if (vals.length === 0) onFilterChange("trade", "all");
              }}
              allLabel="All Trades"
            />
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

          {/* Works with Pictures View Button */}
          {onOpenPicturesView && (
            <button
              onClick={onOpenPicturesView}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#071D49] hover:bg-slate-900 active:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ring-1 ring-[#D4AF37]/60 shrink-0 min-h-[42px]"
              title="View all works and tasks with pictures and inspection photos on-screen"
            >
              <Camera className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[#D4AF37]">Works with Pictures</span>
            </button>
          )}

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
