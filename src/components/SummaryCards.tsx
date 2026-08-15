import React from "react";
import { CheckCircle2, Clock, AlertCircle, Layers, CheckSquare, Calendar, Filter, Building, Building2 } from "lucide-react";
import { TrackerSummary, FilterState, SiteStat, UnitStat } from "../types";

interface SummaryCardsProps {
  summary: TrackerSummary;
  filters?: FilterState;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, filters }) => {
  const isDateFiltered = filters && filters.dateFilter !== "all";
  const isPriorityFiltered = filters && filters.priority && filters.priority !== "all";
  const isUnitFiltered = filters && filters.unit !== "all";
  const isFloorFiltered = filters && filters.floor !== "all";
  const isTradeFiltered = filters && filters.trade !== "all";
  const isStatusFiltered = filters && filters.status !== "all";

  const getDateFilterLabel = (df?: string) => {
    switch (df) {
      case "today":
        return "Today (Daily)";
      case "this_week":
        return "This Week (7 Days)";
      case "this_month":
        return "This Month (30 Days)";
      case "custom":
        return "Custom Date Range";
      default:
        return df;
    }
  };

  const hasAnyFilter =
    isDateFiltered ||
    isPriorityFiltered ||
    isUnitFiltered ||
    isFloorFiltered ||
    isTradeFiltered ||
    isStatusFiltered;

  const sitesArray: [string, SiteStat][] = summary.siteStats
    ? (Object.entries(summary.siteStats) as [string, SiteStat][])
    : [];

  return (
    <div className="space-y-4 mb-6">
      {/* Active Filter Indicator Badge Bar */}
      {hasAnyFilter && (
        <div className="bg-indigo-50/80 border border-indigo-200/80 p-2.5 px-4 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              KPI Summary Scope:
            </span>
            {isDateFiltered && (
              <span className="bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <Calendar className="w-3 h-3" />
                Date: {getDateFilterLabel(filters?.dateFilter)}
              </span>
            )}
            {isPriorityFiltered && (
              <span className="bg-amber-600 text-white font-bold px-2.5 py-0.5 rounded-md">
                Priority: {filters?.priority}
              </span>
            )}
            {isUnitFiltered && (
              <span className="bg-slate-800 text-white font-medium px-2.5 py-0.5 rounded-md">
                Unit: {filters?.unit}
              </span>
            )}
            {isFloorFiltered && (
              <span className="bg-slate-800 text-white font-medium px-2.5 py-0.5 rounded-md">
                Floor: {filters?.floor}
              </span>
            )}
            {isTradeFiltered && (
              <span className="bg-slate-800 text-white font-medium px-2.5 py-0.5 rounded-md">
                Trade: {filters?.trade}
              </span>
            )}
            {isStatusFiltered && (
              <span className="bg-slate-800 text-white font-medium px-2.5 py-0.5 rounded-md">
                Status: {filters?.status}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 italic">
            KPI cards & progress bars update live with applied filters
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Works */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Works
            </span>
            <b className="text-3xl font-extrabold text-slate-900 block mt-1 tracking-tight">
              {summary.total}
            </b>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Works */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending
            </span>
            <b className="text-3xl font-extrabold text-slate-600 block mt-1 tracking-tight">
              {summary.pending}
            </b>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200/60">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <b className="text-3xl font-extrabold text-amber-600 block mt-1 tracking-tight">
              {summary.inProgress}
            </b>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <b className="text-3xl font-extrabold text-emerald-600 block mt-1 tracking-tight">
              {summary.completed}
            </b>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Overall Completion Progress Bar & Site-by-Site Grouped Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Overall Close-Out Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Overall Site Close-Out Completion Rate
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            {summary.overallPct}% Completed ({summary.completed} of {summary.total})
          </span>
        </div>

        {/* Master Overall Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${summary.overallPct}%` }}
          />
        </div>

        {/* Grouped by Sites Section */}
        {sitesArray.length > 0 ? (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                Close-Out Progress Grouped by Sites
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {sitesArray.length} {sitesArray.length === 1 ? "Site" : "Sites"} Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {sitesArray.map(([siteName, siteStat]) => (
                <div
                  key={siteName}
                  className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 transition-all hover:bg-slate-50"
                >
                  {/* Site Row Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{siteName}</span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          ({siteStat.completed}/{siteStat.total} works completed)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {siteStat.pct}% Completed
                      </span>
                    </div>
                  </div>

                  {/* Site Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${siteStat.pct}%` }}
                    />
                  </div>

                  {/* Units under this specific site */}
                  {siteStat.unitStats && Object.keys(siteStat.unitStats).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                      {(Object.entries(siteStat.unitStats) as [string, UnitStat][]).map(([unit, uStat]) => (
                        <div
                          key={unit}
                          className="bg-white p-2 rounded-lg border border-slate-200/70 flex flex-col justify-between shadow-2xs"
                        >
                          <div className="flex justify-between font-bold text-[11px] text-slate-800">
                            <span>{unit}</span>
                            <span className="text-indigo-600">{uStat.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${uStat.pct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-medium text-slate-400 mt-1">
                            {uStat.completed}/{uStat.total} done
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : summary.unitStats && Object.keys(summary.unitStats).length > 0 ? (
          /* Fallback Unit-by-Unit Status Chips */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-3 border-t border-slate-100 text-xs">
            {Object.entries(summary.unitStats).map(([unit, statsData]) => {
              const stats = statsData as { total: number; completed: number; pct: number };
              return (
                <div
                  key={unit}
                  className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70 flex flex-col justify-between"
                >
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{unit}</span>
                    <span className="text-indigo-600">{stats.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${stats.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 mt-1">
                    {stats.completed}/{stats.total} works done
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};
