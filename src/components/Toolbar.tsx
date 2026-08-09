import React from "react";
import { Plus, Printer, RotateCcw, Download, PieChart, Search, Filter, Building2 } from "lucide-react";
import { FilterState } from "../types";

interface ToolbarProps {
  filters: FilterState;
  onFilterChange: (field: keyof FilterState, value: string) => void;
  units: string[];
  floors: string[];
  trades: string[];
  onAddWork: () => void;
  onOpenManageUnits: () => void;
  onOpenTradeAnalytics: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  filters,
  onFilterChange,
  units,
  floors,
  trades,
  onAddWork,
  onOpenManageUnits,
  onOpenTradeAnalytics,
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

          <button
            onClick={onOpenManageUnits}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="List, manage, or create new building units"
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Units List ({units.length})</span>
          </button>

          <button
            onClick={onOpenTradeAnalytics}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Trade Breakdown</span>
          </button>

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
            title="Reset to default seed dataset"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
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
    </div>
  );
};
