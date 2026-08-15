import React from "react";
import { Plus, Printer, RotateCcw, Download, PieChart, Search, Filter, Building2, Calendar, FileText, Building, FolderPlus, FileDown, AlertCircle, Sparkles, Database, ArrowUpDown } from "lucide-react";
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
  onExportCsv,
  onPrint,
  onReset,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs mb-6 space-y-4">
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search area, work description, trade, or notes..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAddWork}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Work</span>
          </button>

          {onOpenExecutiveSummary && (
            <button
              onClick={onOpenExecutiveSummary}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg text-sm font-bold shadow-xs transition-all cursor-pointer ring-1 ring-indigo-400/40"
              title="Generate comprehensive 5-Question Word (.docx / .doc) Summary with Photos"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>5-Point Word Summary</span>
            </button>
          )}

          {onOpenPdfExport && (
            <button
              onClick={onOpenPdfExport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
              title="Save all site work and picture captions to PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Save to PDF</span>
            </button>
          )}

          <button
            onClick={onOpenReports}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-200/80 transition-all cursor-pointer shadow-2xs"
            title="Generate & print Daily or Weekly site progress reports"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Daily / Weekly Reports</span>
          </button>

          <button
            onClick={onOpenManageSites}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-indigo-200/80 transition-all cursor-pointer shadow-2xs"
            title="Switch sites, manage projects, or create templates like Esplanade 6 or EGC3"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Sites ({sitesList.length})</span>
          </button>

          <button
            onClick={onOpenManageUnits}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="List, manage, or create new building units"
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Units ({units.length})</span>
          </button>

          <button
            onClick={onOpenTradeAnalytics}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Trades</span>
          </button>

          {onOpenStorageOptions && (
            <button
              onClick={onOpenStorageOptions}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
              title="View free storage & database options guide"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Storage</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="Printer-friendly view"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-lg text-sm font-medium border border-rose-200/80 transition-all cursor-pointer"
            title="Reset dataset"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-3 border-t border-slate-100 text-xs">
        {/* Site / Category Filter */}
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label className="font-bold text-indigo-900 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-indigo-600" /> Site / Category
          </label>
          <select
            value={filters.site}
            onChange={(e) => onFilterChange("site", e.target.value)}
            className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-lg text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Sites & Categories</option>
            {sitesList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Selector */}
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label className="font-bold text-indigo-900 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" /> Sort Items By
          </label>
          <select
            value={filters.sortBy || "site"}
            onChange={(e) => onFilterChange("sortBy", e.target.value)}
            className="p-2 bg-indigo-50/90 border border-indigo-300 rounded-lg text-slate-900 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          >
            <option value="site">🏗️ Site & Location (A→Z)</option>
            <option value="priority">⚡ Priority (High → Low)</option>
            <option value="floor">🏢 Floor & Area</option>
            <option value="trade">🛠️ Trade / Artisan</option>
            <option value="status">📊 Status (Active first)</option>
            <option value="date">📅 Date Updated (Recent)</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label className="font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-600" /> Date Filter
          </label>
          <select
            value={filters.dateFilter}
            onChange={(e) => onFilterChange("dateFilter", e.target.value as DateFilterType)}
            className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Dates / Lifetime</option>
            <option value="today">Today (Daily Report)</option>
            <option value="this_week">This Week (7 Days)</option>
            <option value="this_month">This Month (30 Days)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Unit Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Unit
          </label>
          <select
            value={filters.unit}
            onChange={(e) => onFilterChange("unit", e.target.value)}
            className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Units</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Floor Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Floor
          </label>
          <select
            value={filters.floor}
            onChange={(e) => onFilterChange("floor", e.target.value)}
            className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" /> Priority
          </label>
          <select
            value={filters.priority || "all"}
            onChange={(e) => onFilterChange("priority", e.target.value)}
            className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">🔥 Critical</option>
            <option value="High">⚠️ High</option>
            <option value="Medium">⚡ Medium</option>
            <option value="Low">🔽 Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Trade Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Trade / Artisan
          </label>
          <select
            value={filters.trade}
            onChange={(e) => onFilterChange("trade", e.target.value)}
            className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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

      {/* Custom Date Inputs if Custom selected */}
      {filters.dateFilter === "custom" && (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">From:</span>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
              className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">To:</span>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
              className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};

