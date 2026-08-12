import React from "react";
import { X, PieChart, Wrench, CheckCircle2, Clock } from "lucide-react";
import { SiteTrackerData, FilterState } from "../types";

interface TradeAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SiteTrackerData;
  filters?: FilterState;
  onSelectTradeFilter: (trade: string) => void;
}

export const TradeAnalyticsModal: React.FC<TradeAnalyticsModalProps> = ({
  isOpen,
  onClose,
  data,
  filters,
  onSelectTradeFilter,
}) => {
  if (!isOpen) return null;

  // Aggregate by Trade
  const tradeStats: {
    [trade: string]: { total: number; pending: number; inProgress: number; completed: number };
  } = {};

  let grandTotal = 0;

  Object.values(data).forEach((unit) => {
    Object.values(unit).forEach((items) => {
      items.forEach((item) => {
        // Apply date filter if present
        if (filters && filters.dateFilter && filters.dateFilter !== "all") {
          const dateStr = item.updatedAt;
          if (dateStr) {
            const itemDate = new Date(dateStr);
            if (!isNaN(itemDate.getTime())) {
              const now = new Date();
              if (filters.dateFilter === "today") {
                const isSameDay =
                  itemDate.getFullYear() === now.getFullYear() &&
                  itemDate.getMonth() === now.getMonth() &&
                  itemDate.getDate() === now.getDate();
                if (!isSameDay) return;
              } else if (filters.dateFilter === "this_week") {
                const diffMs = now.getTime() - itemDate.getTime();
                const diffDays = diffMs / (1000 * 3600 * 24);
                if (diffDays < 0 || diffDays > 7) return;
              } else if (filters.dateFilter === "this_month") {
                const isSameMonth =
                  itemDate.getFullYear() === now.getFullYear() &&
                  itemDate.getMonth() === now.getMonth();
                if (!isSameMonth) return;
              } else if (filters.dateFilter === "custom") {
                if (filters.startDate) {
                  const start = new Date(filters.startDate);
                  start.setHours(0, 0, 0, 0);
                  if (itemDate < start) return;
                }
                if (filters.endDate) {
                  const end = new Date(filters.endDate);
                  end.setHours(23, 59, 59, 999);
                  if (itemDate > end) return;
                }
              }
            }
          }
        }

        grandTotal++;
        const trade = item.trade || "Unassigned";
        if (!tradeStats[trade]) {
          tradeStats[trade] = { total: 0, pending: 0, inProgress: 0, completed: 0 };
        }
        tradeStats[trade].total += 1;
        if (item.status === "Pending") tradeStats[trade].pending += 1;
        else if (item.status === "In Progress") tradeStats[trade].inProgress += 1;
        else if (item.status === "Completed") tradeStats[trade].completed += 1;
      });
    });
  });

  const sortedTrades = Object.entries(tradeStats).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in duration-150 max-h-[85vh] flex flex-col">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Trade & Artisan Close-Out Breakdown</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600">
            Workload distribution across trades for Esplanade 6 ({grandTotal} total items). Click a trade card to filter the site table.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedTrades.map(([tradeName, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

              return (
                <div
                  key={tradeName}
                  onClick={() => {
                    onSelectTradeFilter(tradeName);
                    onClose();
                  }}
                  className="bg-slate-50/80 hover:bg-indigo-50/30 p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer space-y-2 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-800 group-hover:text-indigo-700">
                      <Wrench className="w-4 h-4 text-indigo-600" />
                      <span>{tradeName}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                      {stats.total} tasks
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" /> {stats.pending} pending
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {stats.completed} done
                      </span>
                    </div>
                    <span className="font-bold text-slate-800">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
