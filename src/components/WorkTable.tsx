import React from "react";
import { Trash2, Plus, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { SiteTrackerData, WorkItem, FilterState, WorkStatus, WorkPriority } from "../types";

interface WorkTableProps {
  data: SiteTrackerData;
  filters: FilterState;
  onUpdateItem: (unit: string, floor: string, index: number, field: keyof WorkItem, value: string) => void;
  onRemoveItem: (unit: string, floor: string, index: number) => void;
  onDuplicateItem: (unit: string, floor: string, index: number) => void;
  onAddQuickItem: (unit: string, floor: string) => void;
  onBatchCompleteFloor: (unit: string, floor: string) => void;
}

export const WorkTable: React.FC<WorkTableProps> = ({
  data,
  filters,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  onAddQuickItem,
  onBatchCompleteFloor,
}) => {
  const units = Object.keys(data).filter(
    (u) => filters.unit === "all" || filters.unit === u
  );

  let totalVisibleItems = 0;

  return (
    <div className="space-y-6">
      {units.map((unitName) => {
        const unitData = data[unitName] || {};
        const floors = Object.keys(unitData).filter(
          (f) => filters.floor === "all" || filters.floor === f
        );

        // Compute unit statistics
        let unitTotal = 0;
        let unitCompleted = 0;
        Object.values(unitData).forEach((rawFloorItems) => {
          const items = rawFloorItems as WorkItem[];
          items.forEach((item) => {
            unitTotal++;
            if (item.status === "Completed") unitCompleted++;
          });
        });
        const unitPct = unitTotal > 0 ? Math.round((unitCompleted / unitTotal) * 100) : 0;

        return (
          <div
            key={unitName}
            className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
          >
            {/* Unit Header */}
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-white">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {unitName}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300">
                  {unitCompleted} / {unitTotal} Completed
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-1 sm:w-36">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${unitPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{unitPct}%</span>
                </div>
              </div>
            </div>

            {/* Floors */}
            <div className="divide-y divide-slate-200/80">
              {floors.map((floorName) => {
                const rawItems = unitData[floorName] || [];

                // Filter items by status, trade, and search keyword
                const filteredItems = rawItems.filter((item) => {
                  if (filters.status !== "all" && item.status !== filters.status) return false;
                  if (filters.trade !== "all" && item.trade !== filters.trade) return false;
                  if (filters.search) {
                    const q = filters.search.toLowerCase();
                    const matchArea = item.area.toLowerCase().includes(q);
                    const matchWork = item.work.toLowerCase().includes(q);
                    const matchTrade = item.trade.toLowerCase().includes(q);
                    const matchNotes = (item.notes || "").toLowerCase().includes(q);
                    if (!matchArea && !matchWork && !matchTrade && !matchNotes) return false;
                  }
                  return true;
                });

                totalVisibleItems += filteredItems.length;

                return (
                  <div key={floorName} className="p-4 sm:p-5">
                    {/* Floor Header Bar */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {floorName}
                        <span className="text-xs font-medium text-slate-400">
                          ({filteredItems.length} items)
                        </span>
                      </h3>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onBatchCompleteFloor(unitName, floorName)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Mark all items on this floor as completed"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Mark Floor Complete
                        </button>
                        <button
                          onClick={() => onAddQuickItem(unitName, floorName)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-600" />
                          Add Row
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-slate-200/80 rounded-xl shadow-2xs">
                      <table className="w-full text-left border-collapse min-w-[850px] text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-200">
                            <th className="p-3 w-12 text-center font-semibold">No.</th>
                            <th className="p-3 w-44 font-semibold">Area / Location</th>
                            <th className="p-3 font-semibold">Outstanding Work</th>
                            <th className="p-3 w-36 font-semibold">Trade / Artisan</th>
                            <th className="p-3 w-28 font-semibold">Priority</th>
                            <th className="p-3 w-36 font-semibold">Status</th>
                            <th className="p-3 w-28 text-center font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 bg-white">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-4 text-center text-slate-400 italic bg-slate-50/50"
                              >
                                No matching work items found on this floor.
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item, idx) => {
                              // Find actual index in raw array
                              const realIndex = rawItems.indexOf(item);

                              return (
                                <tr
                                  key={item.id || `${floorName}-${idx}`}
                                  className="hover:bg-indigo-50/20 transition-colors"
                                >
                                  {/* Item Index */}
                                  <td className="p-2.5 text-center text-slate-400 font-medium">
                                    {realIndex + 1}
                                  </td>

                                  {/* Area / Location Input */}
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={item.area}
                                      onChange={(e) =>
                                        onUpdateItem(
                                          unitName,
                                          floorName,
                                          realIndex,
                                          "area",
                                          e.target.value
                                        )
                                      }
                                      className="w-full p-1.5 bg-slate-50/50 border border-slate-200/80 rounded-md focus:border-indigo-500 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                      placeholder="Area..."
                                    />
                                  </td>

                                  {/* Outstanding Work Input */}
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={item.work}
                                      onChange={(e) =>
                                        onUpdateItem(
                                          unitName,
                                          floorName,
                                          realIndex,
                                          "work",
                                          e.target.value
                                        )
                                      }
                                      className="w-full p-1.5 bg-slate-50/50 border border-slate-200/80 rounded-md focus:border-indigo-500 focus:bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                      placeholder="Work description..."
                                    />
                                  </td>

                                  {/* Trade / Artisan Input */}
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={item.trade}
                                      onChange={(e) =>
                                        onUpdateItem(
                                          unitName,
                                          floorName,
                                          realIndex,
                                          "trade",
                                          e.target.value
                                        )
                                      }
                                      className="w-full p-1.5 bg-slate-50/50 border border-slate-200/80 rounded-md focus:border-indigo-500 focus:bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                      placeholder="Trade..."
                                    />
                                  </td>

                                  {/* Priority Dropdown */}
                                  <td className="p-1.5">
                                    <select
                                      value={item.priority || "Medium"}
                                      onChange={(e) =>
                                        onUpdateItem(
                                          unitName,
                                          floorName,
                                          realIndex,
                                          "priority",
                                          e.target.value as WorkPriority
                                        )
                                      }
                                      className={`w-full p-1.5 border rounded-md text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                                        item.priority === "Critical"
                                          ? "text-rose-700 bg-rose-50 border-rose-200"
                                          : item.priority === "High"
                                          ? "text-amber-700 bg-amber-50 border-amber-200"
                                          : item.priority === "Low"
                                          ? "text-slate-600 bg-slate-50 border-slate-200"
                                          : "text-indigo-700 bg-indigo-50 border-indigo-200"
                                      }`}
                                    >
                                      <option value="Low">Low</option>
                                      <option value="Medium">Medium</option>
                                      <option value="High">High</option>
                                      <option value="Critical">Critical</option>
                                    </select>
                                  </td>

                                  {/* Status Selector */}
                                  <td className="p-1.5">
                                    <select
                                      value={item.status}
                                      onChange={(e) =>
                                        onUpdateItem(
                                          unitName,
                                          floorName,
                                          realIndex,
                                          "status",
                                          e.target.value as WorkStatus
                                        )
                                      }
                                      className={`w-full p-1.5 border rounded-md text-xs font-bold focus:outline-none cursor-pointer transition-all ${
                                        item.status === "Completed"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : item.status === "In Progress"
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : "bg-slate-50 text-slate-700 border-slate-200"
                                      }`}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </td>

                                  {/* Actions */}
                                  <td className="p-1.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() =>
                                          onDuplicateItem(unitName, floorName, realIndex)
                                        }
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Duplicate item"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          onRemoveItem(unitName, floorName, realIndex)
                                        }
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                        title="Remove item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {totalVisibleItems === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-semibold text-slate-700 text-lg">No Work Items Found</h3>
          <p className="text-sm text-slate-500">
            Try adjusting your search criteria or filter options to view outstanding works.
          </p>
        </div>
      )}
    </div>
  );
};
