import React from "react";
import { CheckCircle2, Clock, AlertCircle, Layers, CheckSquare } from "lucide-react";
import { TrackerSummary } from "../types";

interface SummaryCardsProps {
  summary: TrackerSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="space-y-4 mb-6">
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

      {/* Overall Completion Progress Bar & Unit Quick Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
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

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/50">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${summary.overallPct}%` }}
          />
        </div>

        {/* Unit-by-Unit Status Chips */}
        {summary.unitStats && Object.keys(summary.unitStats).length > 0 && (
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
        )}
      </div>
    </div>
  );
};
