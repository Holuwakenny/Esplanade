import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Plus,
  Camera,
  Building,
  Layers,
  Flame,
  AlertTriangle,
  Activity,
  ArrowDown,
  MessageSquare,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  CheckSquare,
  Square,
  MinusSquare,
  Copy,
  Check,
} from "lucide-react";
import { SitesMap, WorkItem, FilterState, WorkStatus, WorkPriority } from "../types";
import { isItemMatchingDateFilter, formatDateDisplay } from "../utils/dateUtils";

// Isolated debounced textarea that prevents global re-renders and memory allocations while typing
export const DebouncedTextarea: React.FC<{
  value?: string;
  onCommit: (val: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}> = React.memo(({ value: initialValue = "", onCommit, className, placeholder, rows = 2, autoFocus }) => {
  const [val, setVal] = useState<string>(initialValue || "");
  const commitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const valRef = useRef<string>(val);
  valRef.current = val;

  useEffect(() => {
    setVal(initialValue || "");
    valRef.current = initialValue || "";
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setVal(nextVal);
    valRef.current = nextVal;
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      onCommit(nextVal);
    }, 350);
  };

  const handleBlur = () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    if (valRef.current !== initialValue) {
      onCommit(valRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
  }, []);

  return (
    <textarea
      rows={rows}
      value={val}
      autoFocus={autoFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
});

// Isolated debounced input for mobile cards that prevents keystroke memory thrashing
export const DebouncedInput: React.FC<{
  value?: string;
  onCommit: (val: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}> = React.memo(({ value: initialValue = "", onCommit, className, placeholder, type = "text", autoFocus }) => {
  const [val, setVal] = useState<string>(initialValue || "");
  const commitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const valRef = useRef<string>(val);
  valRef.current = val;

  useEffect(() => {
    setVal(initialValue || "");
    valRef.current = initialValue || "";
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setVal(nextVal);
    valRef.current = nextVal;
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      onCommit(nextVal);
    }, 350);
  };

  const handleBlur = () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    if (valRef.current !== initialValue) {
      onCommit(valRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
  }, []);

  return (
    <input
      type={type}
      value={val}
      autoFocus={autoFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
});

export interface SelectedItemTarget {
  siteName: string;
  unitName: string;
  floorName: string;
  realIndex: number;
  id?: string;
  itemArea?: string;
  itemWork?: string;
}

interface WorkTableProps {
  sitesData: SitesMap;
  allSitesList?: string[];
  activeSiteName: string;
  filters: FilterState;
  onUpdateItem: (
    siteName: string,
    unit: string,
    floor: string,
    index: number,
    field: keyof WorkItem,
    value: string
  ) => void;
  onMoveItemSite?: (
    fromSite: string,
    toSite: string,
    unit: string,
    floor: string,
    index: number
  ) => void;
  onMoveItemUnit?: (
    siteName: string,
    fromUnit: string,
    toUnit: string,
    floor: string,
    index: number
  ) => void;
  onMoveItemFloor?: (
    siteName: string,
    unit: string,
    fromFloor: string,
    toFloor: string,
    index: number
  ) => void;
  onRemoveItem: (
    siteName: string,
    unit: string,
    floor: string,
    index: number
  ) => void;
  onDuplicateItem?: (
    siteName: string,
    unit: string,
    floor: string,
    index: number
  ) => void;
  onAddQuickItem: (siteName: string, unit: string, floor: string) => void;
  onBatchCompleteFloor?: (siteName: string, unit: string, floor: string) => void;
  onOpenPhotos: (
    siteName: string,
    unit: string,
    floor: string,
    index: number,
    item: WorkItem
  ) => void;
  // Multi-select batch actions
  onBatchUpdateStatus?: (
    targets: Array<{ siteName: string; unitName: string; floorName: string; realIndex: number; id?: string }>,
    newStatus: WorkStatus
  ) => void;
  onBatchUpdatePriority?: (
    targets: Array<{ siteName: string; unitName: string; floorName: string; realIndex: number; id?: string }>,
    newPriority: WorkPriority
  ) => void;
  onBatchDelete?: (
    targets: Array<{ siteName: string; unitName: string; floorName: string; realIndex: number; id?: string }>
  ) => void;
}

interface FlatRow {
  siteName: string;
  unitName: string;
  floorName: string;
  realIndex: number;
  item: WorkItem;
}

const DEFAULT_FLOORS = [
  "Ground Floor",
  "First Floor",
  "Second Floor",
  "Third Floor",
  "Fourth Floor",
  "Fifth Floor",
  "Sixth Floor",
  "Seventh Floor",
  "Eighth Floor",
  "General",
];

const formatDate = (dateStr?: string) => {
  return formatDateDisplay(dateStr);
};

// Priority Badge Component with Color-Coded Icons
export const PriorityBadge: React.FC<{
  priority?: WorkPriority;
  onChange?: (newPriority: WorkPriority) => void;
}> = ({ priority = "Medium", onChange }) => {
  const getPriorityStyle = (p: WorkPriority) => {
    switch (p) {
      case "Critical":
        return {
          bg: "bg-rose-100 text-rose-800 border-rose-300 ring-rose-500/20",
          icon: <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />,
          label: "Critical",
        };
      case "High":
        return {
          bg: "bg-amber-100 text-amber-900 border-amber-300 ring-amber-500/20",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          label: "High",
        };
      case "Medium":
        return {
          bg: "bg-sky-50 text-sky-800 border-sky-200 ring-sky-500/20",
          icon: <Activity className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
          label: "Medium",
        };
      case "Low":
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20",
          icon: <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
          label: "Low",
        };
    }
  };

  const style = getPriorityStyle((priority || "Medium") as WorkPriority);

  if (!onChange) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${style.bg}`}>
        {style.icon}
        <span>{style.label}</span>
      </span>
    );
  }

  return (
    <div className="relative inline-block w-full">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border shadow-2xs ${style.bg}`}>
        {style.icon}
        <select
          value={priority}
          onChange={(e) => onChange(e.target.value as WorkPriority)}
          className="bg-transparent text-current font-bold focus:outline-none cursor-pointer w-full text-xs"
        >
          <option value="Critical" className="bg-white text-rose-700 font-bold">
            🔥 Critical
          </option>
          <option value="High" className="bg-white text-amber-700 font-bold">
            ⚠️ High
          </option>
          <option value="Medium" className="bg-white text-sky-700 font-bold">
            ⚡ Medium
          </option>
          <option value="Low" className="bg-white text-slate-700 font-bold">
            🔽 Low
          </option>
        </select>
      </div>
    </div>
  );
};

export const WorkTable: React.FC<WorkTableProps> = ({
  sitesData,
  allSitesList = [],
  activeSiteName,
  filters,
  onUpdateItem,
  onMoveItemSite,
  onMoveItemUnit,
  onMoveItemFloor,
  onRemoveItem,
  onDuplicateItem,
  onAddQuickItem,
  onBatchCompleteFloor,
  onOpenPhotos,
  onBatchUpdateStatus,
  onBatchUpdatePriority,
  onBatchDelete,
}) => {
  // Track open comment modal/popover row key
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null);

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemTarget>>({});
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const [batchActionNotice, setBatchActionNotice] = useState<string | null>(null);

  const getItemKey = (site: string, unit: string, floor: string, index: number) =>
    `${site}___${unit}___${floor}___${index}`;

  const selectedCount = Object.keys(selectedItems).length;

  const toggleSelectItem = (
    site: string,
    unit: string,
    floor: string,
    index: number,
    id?: string,
    itemArea?: string,
    itemWork?: string
  ) => {
    const key = getItemKey(site, unit, floor, index);
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          siteName: site,
          unitName: unit,
          floorName: floor,
          realIndex: index,
          id,
          itemArea,
          itemWork,
        };
      }
      return next;
    });
  };

  const toggleSelectAllForSite = (siteName: string, rows: FlatRow[]) => {
    if (rows.length === 0) return;
    const siteRowKeys = rows.map((r) => getItemKey(r.siteName, r.unitName, r.floorName, r.realIndex));
    const allSelected = siteRowKeys.every((k) => Boolean(selectedItems[k]));

    setSelectedItems((prev) => {
      const next = { ...prev };
      if (allSelected) {
        siteRowKeys.forEach((k) => delete next[k]);
      } else {
        rows.forEach((r) => {
          const k = getItemKey(r.siteName, r.unitName, r.floorName, r.realIndex);
          next[k] = {
            siteName: r.siteName,
            unitName: r.unitName,
            floorName: r.floorName,
            realIndex: r.realIndex,
            id: r.item.id,
            itemArea: r.item.area,
            itemWork: r.item.work,
          };
        });
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedItems({});
  };

  const handleBatchStatusUpdate = (status: WorkStatus) => {
    const targets = Object.values(selectedItems) as SelectedItemTarget[];
    if (targets.length === 0) return;

    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(targets, status);
    } else {
      targets.forEach((t) => {
        onUpdateItem(t.siteName, t.unitName, t.floorName, t.realIndex, "status", status);
      });
    }
    setBatchActionNotice(`Updated ${targets.length} item(s) to "${status}"`);
    setTimeout(() => setBatchActionNotice(null), 3000);
    handleClearSelection();
  };

  const handleBatchPriorityUpdate = (priority: WorkPriority) => {
    const targets = Object.values(selectedItems) as SelectedItemTarget[];
    if (targets.length === 0) return;

    if (onBatchUpdatePriority) {
      onBatchUpdatePriority(targets, priority);
    } else {
      targets.forEach((t) => {
        onUpdateItem(t.siteName, t.unitName, t.floorName, t.realIndex, "priority", priority);
      });
    }
    setBatchActionNotice(`Updated priority to "${priority}" for ${targets.length} item(s)`);
    setTimeout(() => setBatchActionNotice(null), 3000);
    handleClearSelection();
  };

  const handleBatchDeleteConfirmed = () => {
    const targets = Object.values(selectedItems) as SelectedItemTarget[];
    if (targets.length === 0) {
      setIsConfirmDeleteOpen(false);
      return;
    }

    if (onBatchDelete) {
      onBatchDelete(targets);
    } else {
      const sorted = [...targets].sort((a, b) => b.realIndex - a.realIndex);
      sorted.forEach((t) => {
        onRemoveItem(t.siteName, t.unitName, t.floorName, t.realIndex);
      });
    }

    setBatchActionNotice(`Successfully deleted ${targets.length} item(s)`);
    setTimeout(() => setBatchActionNotice(null), 3000);
    handleClearSelection();
    setIsConfirmDeleteOpen(false);
  };

  // Determine sites to render
  let sitesToRender: string[] = [];
  if (filters.site === "all") {
    sitesToRender = Object.keys(sitesData).sort((a, b) => a.localeCompare(b));
  } else if (sitesData[filters.site]) {
    sitesToRender = [filters.site];
  } else if (sitesData[activeSiteName]) {
    sitesToRender = [activeSiteName];
  } else {
    sitesToRender = Object.keys(sitesData).sort((a, b) => a.localeCompare(b)).slice(0, 1);
  }

  const siteListOptions = allSitesList.length > 0 ? allSitesList : Object.keys(sitesData);

  return (
    <div className="space-y-8">
      {sitesToRender.map((siteName) => {
        const siteData = sitesData[siteName] || {};

        let siteTotal = 0;
        let siteCompleted = 0;

        const flatRows: FlatRow[] = [];

        Object.entries(siteData).forEach(([unitName, unitFloors]) => {
          if (unitName.startsWith("_")) return;
          if (filters.unit !== "all" && filters.unit !== unitName) return;

          Object.entries(unitFloors).forEach(([floorName, items]) => {
            if (filters.floor !== "all" && filters.floor !== floorName) return;

            items.forEach((item, realIndex) => {
              siteTotal++;
              if (item.status === "Completed") siteCompleted++;

              if (filters.status !== "all" && item.status !== filters.status) return;
              if (filters.trade !== "all" && item.trade !== filters.trade) return;
              if (filters.priority && filters.priority !== "all" && (item.priority || "Medium") !== filters.priority) return;

              // Date filtering (strictly enforces daily/weekly/monthly/custom filters)
              if (
                !isItemMatchingDateFilter(
                  item.updatedAt,
                  filters.dateFilter,
                  filters.startDate,
                  filters.endDate
                )
              ) {
                return;
              }

              // Search check
              if (filters.search) {
                const q = filters.search.toLowerCase();
                const matchArea = (item.area || "").toLowerCase().includes(q);
                const matchWork = (item.work || "").toLowerCase().includes(q);
                const matchTrade = (item.trade || "").toLowerCase().includes(q);
                const matchUnit = unitName.toLowerCase().includes(q);
                const matchFloor = floorName.toLowerCase().includes(q);
                const matchNotes = (item.notes || "").toLowerCase().includes(q);
                if (!matchArea && !matchWork && !matchTrade && !matchUnit && !matchFloor && !matchNotes) {
                  return;
                }
              }

              flatRows.push({
                siteName,
                unitName,
                floorName,
                realIndex,
                item,
              });
            });
          });
        });

        const PRIORITY_RANK: Record<string, number> = {
          Critical: 1,
          High: 2,
          Medium: 3,
          Low: 4,
        };
        const STATUS_RANK: Record<string, number> = {
          "In Progress": 1,
          Pending: 2,
          Completed: 3,
        };

        // Sort items by site, priority, trade, status, floor, or date
        flatRows.sort((a, b) => {
          const sortBy = filters.sortBy || "site";
          if (sortBy === "site") {
            const sC = a.siteName.localeCompare(b.siteName);
            if (sC !== 0) return sC;
            const uC = a.unitName.localeCompare(b.unitName);
            if (uC !== 0) return uC;
            const fC = a.floorName.localeCompare(b.floorName);
            if (fC !== 0) return fC;
            return (a.item.area || "").localeCompare(b.item.area || "");
          } else if (sortBy === "priority") {
            const rA = PRIORITY_RANK[a.item.priority || "Medium"] || 3;
            const rB = PRIORITY_RANK[b.item.priority || "Medium"] || 3;
            if (rA !== rB) return rA - rB;
            const sC = a.siteName.localeCompare(b.siteName);
            if (sC !== 0) return sC;
          } else if (sortBy === "trade") {
            const tA = a.item.trade || "";
            const tB = b.item.trade || "";
            if (tA !== tB) return tA.localeCompare(tB);
            const sC = a.siteName.localeCompare(b.siteName);
            if (sC !== 0) return sC;
          } else if (sortBy === "status") {
            const stA = STATUS_RANK[a.item.status] || 2;
            const stB = STATUS_RANK[b.item.status] || 2;
            if (stA !== stB) return stA - stB;
            const sC = a.siteName.localeCompare(b.siteName);
            if (sC !== 0) return sC;
          } else if (sortBy === "date") {
            const dA = a.item.updatedAt ? new Date(a.item.updatedAt).getTime() : 0;
            const dB = b.item.updatedAt ? new Date(b.item.updatedAt).getTime() : 0;
            if (dA !== dB) return dB - dA;
            const sC = a.siteName.localeCompare(b.siteName);
            if (sC !== 0) return sC;
          }
          const sC = a.siteName.localeCompare(b.siteName);
          if (sC !== 0) return sC;
          const uC = a.unitName.localeCompare(b.unitName);
          if (uC !== 0) return uC;
          const fC = a.floorName.localeCompare(b.floorName);
          if (fC !== 0) return fC;
          return (a.item.area || "").localeCompare(b.item.area || "");
        });

        const sitePct = siteTotal > 0 ? Math.round((siteCompleted / siteTotal) * 100) : 0;

        const availableUnits = Array.from(
          new Set([
            ...Object.keys(siteData).filter((u) => !u.startsWith("_")),
            "Unit 1",
            "Unit 2",
            "Unit 3",
            "Unit 4",
            "Unit 5",
            "Unit 6",
          ])
        );

        const defaultUnit =
          filters.unit !== "all"
            ? filters.unit
            : Object.keys(siteData).filter((u) => !u.startsWith("_"))[0] || "Unit 1";
        const defaultFloor =
          filters.floor !== "all" ? filters.floor : "Ground Floor";

        const siteSelectedItems = flatRows.filter((r) =>
          Boolean(selectedItems[getItemKey(r.siteName, r.unitName, r.floorName, r.realIndex)])
        );
        const siteSelectedCount = siteSelectedItems.length;
        const isSiteAllSelected = flatRows.length > 0 && siteSelectedCount === flatRows.length;
        const isSiteSomeSelected = siteSelectedCount > 0 && siteSelectedCount < flatRows.length;

        return (
          <div key={siteName} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Header Bar for Site Category */}
            <div className="bg-slate-900 px-4 sm:px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-lg">
                  <Building className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Site Category: <span className="text-indigo-300">{siteName}</span>
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                      {flatRows.length} Items Listed
                    </span>
                    {siteSelectedCount > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3" />
                        {siteSelectedCount} Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {siteCompleted} of {siteTotal} Total Completed ({sitePct}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-20 sm:w-28 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${sitePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-300">{sitePct}%</span>
                </div>

                {/* Multi-Select Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isMultiSelectMode;
                    setIsMultiSelectMode(nextMode);
                    if (!nextMode && selectedCount > 0) {
                      handleClearSelection();
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-[36px] border ${
                    isMultiSelectMode || siteSelectedCount > 0
                      ? "bg-indigo-600 text-white border-indigo-400 hover:bg-indigo-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                  }`}
                  title="Toggle Multi-Select Mode to batch update or delete items"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{isMultiSelectMode ? "Multi-Select Active" : "Multi-Select"}</span>
                  {siteSelectedCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-indigo-950 font-black text-[10px]">
                      {siteSelectedCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onAddQuickItem(siteName, defaultUnit, defaultFloor)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-[36px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Row</span>
                </button>
              </div>
            </div>

            {/* Site-Level Batch Actions Banner (Shown when items are selected or multi-select is toggled) */}
            {(siteSelectedCount > 0 || isMultiSelectMode) && (
              <div className="bg-indigo-50/95 border-b border-indigo-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span>
                      <strong>{siteSelectedCount}</strong> of {flatRows.length} items selected in <em>{siteName}</em>
                    </span>
                  </span>
                  <span className="text-slate-300 hidden sm:inline">|</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectAllForSite(siteName, flatRows)}
                    className="text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer text-xs"
                  >
                    {isSiteAllSelected ? "Deselect All Visible in Site" : "Select All Visible in Site"}
                  </button>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-slate-500 hover:text-slate-800 underline cursor-pointer text-xs"
                    >
                      Clear All ({selectedCount})
                    </button>
                  )}
                </div>

                {siteSelectedCount > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-600">Quick Batch:</span>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusUpdate("Completed")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Mark all selected items in this site as Completed"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Completed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusUpdate("In Progress")}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Mark all selected items in this site as In Progress"
                    >
                      <Clock className="w-3 h-3" />
                      <span>In Progress</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchStatusUpdate("Pending")}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Mark all selected items in this site as Pending"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>Pending</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Delete all selected items"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete ({siteSelectedCount})</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DESKTOP TABLE VIEW (md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px] text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-2.5 w-14 text-center border-r border-slate-200/80 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSiteAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSiteSomeSelected;
                          }}
                          onChange={() => toggleSelectAllForSite(siteName, flatRows)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          title={isSiteAllSelected ? "Deselect all rows in this site" : "Select all rows in this site"}
                        />
                        <span className="text-[10px] text-slate-600 font-bold">#</span>
                      </div>
                    </th>
                    <th className="p-3 w-40 border-r border-slate-200/80 whitespace-nowrap">Area / Location</th>
                    <th className="p-3 border-r border-slate-200/80 min-w-[240px] whitespace-nowrap">Outstanding Work & Comments</th>
                    <th className="p-3 w-32 border-r border-slate-200/80 whitespace-nowrap">Trade</th>
                    <th className="p-3 w-28 border-r border-slate-200/80 whitespace-nowrap">Unit</th>
                    <th className="p-3 w-32 border-r border-slate-200/80 whitespace-nowrap">Floor</th>
                    <th className="p-3 w-32 border-r border-slate-200/80 whitespace-nowrap">Priority</th>
                    <th className="p-3 w-32 border-r border-slate-200/80 whitespace-nowrap">Status</th>
                    <th className="p-3 w-24 border-r border-slate-200/80 whitespace-nowrap">Date</th>
                    <th className="p-3 w-28 border-r border-slate-200/80 whitespace-nowrap">Site</th>
                    <th className="p-3 w-28 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {flatRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500 bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <Layers className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">No work items found</p>
                          <p className="text-xs text-slate-400">
                            No items match the current filter selection for {siteName}.
                          </p>
                          <button
                            onClick={() => onAddQuickItem(siteName, defaultUnit, defaultFloor)}
                            className="mt-2 text-xs font-semibold px-3 py-1.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add First Row to {siteName}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    flatRows.map((flat, idx) => {
                      const { siteName: currentSite, unitName, floorName, realIndex, item } = flat;
                      const floorOptions = Array.from(new Set([...DEFAULT_FLOORS, floorName]));
                      const rowKey = `${currentSite}-${unitName}-${floorName}-${realIndex}`;
                      const isEditingNote = editingNoteKey === rowKey;

                      const itemKey = getItemKey(currentSite, unitName, floorName, realIndex);
                      const isRowSelected = Boolean(selectedItems[itemKey]);

                      return (
                        <tr
                          key={item.id || rowKey}
                          className={`${
                            isRowSelected
                              ? "bg-indigo-50/80 border-l-4 border-l-indigo-600 shadow-inner"
                              : "hover:bg-indigo-50/20"
                          } transition-colors group align-top`}
                        >
                          {/* 1. Selection Checkbox + No. */}
                          <td className="p-2.5 text-center text-slate-500 font-semibold border-r border-slate-100">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isRowSelected}
                                onChange={() =>
                                  toggleSelectItem(
                                    currentSite,
                                    unitName,
                                    floorName,
                                    realIndex,
                                    item.id,
                                    item.area,
                                    item.work
                                  )
                                }
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                title="Select item for batch actions"
                              />
                              <span className="text-[11px] font-medium text-slate-600">{idx + 1}</span>
                            </div>
                          </td>

                          {/* 2. Area / Location */}
                          <td className="p-1.5 border-r border-slate-100 whitespace-normal break-words">
                            <DebouncedTextarea
                              rows={2}
                              value={item.area}
                              onCommit={(val) =>
                                onUpdateItem(
                                  currentSite,
                                  unitName,
                                  floorName,
                                  realIndex,
                                  "area",
                                  val
                                )
                              }
                              className="w-full p-1.5 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-400 rounded text-slate-800 focus:outline-none transition-all font-semibold text-xs whitespace-pre-wrap break-words resize-y"
                              placeholder="Area / Location..."
                            />
                          </td>

                          {/* 3. Outstanding Work & Redesigned Comments/Notes */}
                          <td className="p-1.5 border-r border-slate-100 space-y-2 whitespace-normal break-words">
                            <DebouncedTextarea
                              rows={2}
                              value={item.work}
                              onCommit={(val) =>
                                onUpdateItem(
                                  currentSite,
                                  unitName,
                                  floorName,
                                  realIndex,
                                  "work",
                                  val
                                )
                              }
                              className="w-full p-1.5 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-400 rounded text-slate-900 font-medium focus:outline-none transition-all text-xs whitespace-pre-wrap break-words resize-y"
                              placeholder="Outstanding work description..."
                            />

                            {/* Comment / Note Preview Box */}
                            {item.notes && !isEditingNote && (
                              <div className="p-2 bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/90 rounded-lg text-amber-950 text-xs shadow-2xs space-y-1 group/note transition-all">
                                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 border-b border-amber-200/60 pb-1">
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                    Site Note / Comment
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteKey(rowKey)}
                                    className="text-amber-800 hover:text-amber-950 underline font-semibold cursor-pointer text-[10px]"
                                  >
                                    Edit Note
                                  </button>
                                </div>
                                <p className="whitespace-pre-wrap break-words text-slate-800 font-normal leading-relaxed text-xs">
                                  "{item.notes}"
                                </p>
                              </div>
                            )}

                            {/* Comment / Note Full Expanded Editor */}
                            {isEditingNote && (
                              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-300 shadow-xs space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                  <span className="flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4 text-amber-700 shrink-0" />
                                    Add / Edit Site Comment
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteKey(null)}
                                    className="text-slate-500 hover:text-slate-800 p-0.5 rounded cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <DebouncedTextarea
                                  rows={3}
                                  value={item.notes || ""}
                                  autoFocus
                                  onCommit={(val) =>
                                    onUpdateItem(
                                      currentSite,
                                      unitName,
                                      floorName,
                                      realIndex,
                                      "notes",
                                      val
                                    )
                                  }
                                  placeholder="Type artisan notes, instructions, or inspection observations..."
                                  className="w-full bg-white text-xs p-2 border border-amber-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 whitespace-pre-wrap break-words font-sans"
                                />
                                <div className="flex items-center justify-between pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateItem(currentSite, unitName, floorName, realIndex, "notes", "");
                                      setEditingNoteKey(null);
                                    }}
                                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline cursor-pointer"
                                  >
                                    Clear Note
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteKey(null)}
                                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md transition-colors cursor-pointer"
                                  >
                                    Save Note
                                  </button>
                                </div>
                              </div>
                            )}

                            {!item.notes && !isEditingNote && (
                              <button
                                type="button"
                                onClick={() => setEditingNoteKey(rowKey)}
                                className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>+ Add Comment</span>
                              </button>
                            )}
                          </td>

                          {/* 4. Trade / Artisan */}
                          <td className="p-1.5 border-r border-slate-100 whitespace-normal break-words">
                            <DebouncedTextarea
                              rows={2}
                              value={item.trade}
                              onCommit={(val) =>
                                onUpdateItem(
                                  currentSite,
                                  unitName,
                                  floorName,
                                  realIndex,
                                  "trade",
                                  val
                                )
                              }
                              className="w-full p-1.5 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-400 rounded text-slate-700 focus:outline-none transition-all font-medium text-xs whitespace-pre-wrap break-words resize-y"
                              placeholder="Trade..."
                            />
                          </td>

                          {/* 5. Unit */}
                          <td className="p-1.5 border-r border-slate-100">
                            <select
                              value={unitName}
                              onChange={(e) =>
                                onMoveItemUnit &&
                                onMoveItemUnit(
                                  currentSite,
                                  unitName,
                                  e.target.value,
                                  floorName,
                                  realIndex
                                )
                              }
                              className="w-full p-1 border rounded text-xs font-semibold bg-slate-50 hover:bg-white text-slate-800 border-slate-200 focus:outline-none focus:border-indigo-400 cursor-pointer transition-all"
                            >
                              {availableUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 6. Floor */}
                          <td className="p-1.5 border-r border-slate-100">
                            <select
                              value={floorName}
                              onChange={(e) =>
                                onMoveItemFloor &&
                                onMoveItemFloor(
                                  currentSite,
                                  unitName,
                                  floorName,
                                  e.target.value,
                                  realIndex
                                )
                              }
                              className="w-full p-1 border rounded text-xs font-semibold bg-slate-50 hover:bg-white text-slate-800 border-slate-200 focus:outline-none focus:border-indigo-400 cursor-pointer transition-all"
                            >
                              {floorOptions.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 7. Priority Badge Selector */}
                          <td className="p-1.5 border-r border-slate-100">
                            <PriorityBadge
                              priority={item.priority || "Medium"}
                              onChange={(newP) =>
                                onUpdateItem(
                                  currentSite,
                                  unitName,
                                  floorName,
                                  realIndex,
                                  "priority",
                                  newP
                                )
                              }
                            />
                          </td>

                          {/* 8. Status */}
                          <td className="p-1.5 border-r border-slate-100">
                            <select
                              value={item.status}
                              onChange={(e) =>
                                onUpdateItem(
                                  currentSite,
                                  unitName,
                                  floorName,
                                  realIndex,
                                  "status",
                                  e.target.value as WorkStatus
                                )
                              }
                              className={`w-full p-1.5 border rounded text-xs font-bold focus:outline-none cursor-pointer transition-all ${
                                item.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : item.status === "In Progress"
                                  ? "bg-amber-50 text-amber-900 border-amber-300"
                                  : "bg-slate-100 text-slate-800 border-slate-300"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>

                          {/* 9. Date */}
                          <td className="p-2 border-r border-slate-100 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                            {formatDate(item.updatedAt)}
                          </td>

                          {/* 10. Site */}
                          <td className="p-1.5 border-r border-slate-100">
                            <select
                              value={currentSite}
                              onChange={(e) =>
                                onMoveItemSite &&
                                onMoveItemSite(
                                  currentSite,
                                  e.target.value,
                                  unitName,
                                  floorName,
                                  realIndex
                                )
                              }
                              className="w-full p-1 border rounded text-[11px] font-semibold bg-slate-50 hover:bg-white text-slate-800 border-slate-200 focus:outline-none cursor-pointer transition-all"
                            >
                              {siteListOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 11. Action Buttons */}
                          <td className="p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Comments trigger */}
                              <button
                                onClick={() =>
                                  setEditingNoteKey(isEditingNote ? null : rowKey)
                                }
                                className={`p-1.5 rounded text-xs border transition-all cursor-pointer ${
                                  item.notes
                                    ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                                    : "text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                                title="Add/Edit Comments & Notes"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Camera trigger */}
                              <button
                                onClick={() =>
                                  onOpenPhotos(
                                    currentSite,
                                    unitName,
                                    floorName,
                                    realIndex,
                                    item
                                  )
                                }
                                className={`p-1.5 rounded text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                                  item.photos && item.photos.length > 0
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"
                                    : "text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                                title="Snap / Attach Photos"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                {item.photos && item.photos.length > 0 && (
                                  <span className="text-[10px]">{item.photos.length}</span>
                                )}
                              </button>

                              {/* Duplicate trigger */}
                              {onDuplicateItem && (
                                <button
                                  onClick={() =>
                                    onDuplicateItem(currentSite, unitName, floorName, realIndex)
                                  }
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-200 transition-colors cursor-pointer"
                                  title="Duplicate row"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete trigger */}
                              <button
                                onClick={() =>
                                  onRemoveItem(currentSite, unitName, floorName, realIndex)
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                title="Remove row"
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

            {/* MOBILE CARD VIEW (sm and below) */}
            <div className="block md:hidden p-3 space-y-3 bg-slate-50/60">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {flatRows.length} Items Listed
                  </span>
                  {siteSelectedCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                      {siteSelectedCount} Selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAllForSite(siteName, flatRows)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer active:bg-slate-100"
                    title={isSiteAllSelected ? "Deselect all rows in this site" : "Select all rows in this site"}
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isSiteAllSelected ? "Deselect" : "Select All"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddQuickItem(siteName, defaultUnit, defaultFloor)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>

              {flatRows.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-700">No work items found</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting filters or adding a row.</p>
                </div>
              ) : (
                flatRows.map((flat, idx) => {
                  const { siteName: currentSite, unitName, floorName, realIndex, item } = flat;
                  const rowKey = `m-${currentSite}-${unitName}-${floorName}-${realIndex}`;
                  const isEditingNote = editingNoteKey === rowKey;
                  const floorOptions = Array.from(new Set([...DEFAULT_FLOORS, floorName]));

                  const itemKey = getItemKey(currentSite, unitName, floorName, realIndex);
                  const isRowSelected = Boolean(selectedItems[itemKey]);

                  return (
                    <div
                      key={item.id || rowKey}
                      className={`bg-white rounded-xl border ${
                        isRowSelected
                          ? "border-indigo-400 ring-2 ring-indigo-400/40 bg-indigo-50/20"
                          : "border-slate-200"
                      } shadow-2xs p-3.5 space-y-3 transition-all`}
                    >
                      {/* Top Bar: Checkbox, Item #, Priority Badge, Status Dropdown */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() =>
                              toggleSelectItem(
                                currentSite,
                                unitName,
                                floorName,
                                realIndex,
                                item.id,
                                item.area,
                                item.work
                              )
                            }
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            title="Select item for batch actions"
                          />
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            #{idx + 1}
                          </span>
                          <PriorityBadge
                            priority={item.priority || "Medium"}
                            onChange={(newP) =>
                              onUpdateItem(
                                currentSite,
                                unitName,
                                floorName,
                                realIndex,
                                "priority",
                                newP
                              )
                            }
                          />
                        </div>

                        {/* Status selector */}
                        <select
                          value={item.status}
                          onChange={(e) =>
                            onUpdateItem(
                              currentSite,
                              unitName,
                              floorName,
                              realIndex,
                              "status",
                              e.target.value as WorkStatus
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                            item.status === "Completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : item.status === "In Progress"
                              ? "bg-amber-50 text-amber-900 border-amber-300"
                              : "bg-slate-100 text-slate-800 border-slate-300"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      {/* Card Inputs: Area & Work */}
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400">Area / Location</label>
                            {item.area ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateItem(
                                    currentSite,
                                    unitName,
                                    floorName,
                                    realIndex,
                                    "area",
                                    ""
                                  )
                                }
                                className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                Clear
                              </button>
                            ) : null}
                          </div>
                          <DebouncedInput
                            type="text"
                            value={item.area}
                            onCommit={(val) =>
                              onUpdateItem(
                                currentSite,
                                unitName,
                                floorName,
                                realIndex,
                                "area",
                                val
                              )
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:font-normal placeholder:text-slate-400"
                            placeholder="Type area (e.g. Master Bedroom, Kitchen...)"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400">Outstanding Work</label>
                            {item.work ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateItem(
                                    currentSite,
                                    unitName,
                                    floorName,
                                    realIndex,
                                    "work",
                                    ""
                                  )
                                }
                                className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                Clear
                              </button>
                            ) : null}
                          </div>
                          <DebouncedTextarea
                            rows={2}
                            value={item.work}
                            onCommit={(val) =>
                              onUpdateItem(
                                currentSite,
                                unitName,
                                floorName,
                                realIndex,
                                "work",
                                val
                              )
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                            placeholder="Type work description..."
                          />
                        </div>
                      </div>

                      {/* Unit, Floor & Trade Row */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Unit</label>
                          <select
                            value={unitName}
                            onChange={(e) =>
                              onMoveItemUnit &&
                              onMoveItemUnit(
                                currentSite,
                                unitName,
                                e.target.value,
                                floorName,
                                realIndex
                              )
                            }
                            className="w-full p-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
                          >
                            {availableUnits.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Floor</label>
                          <select
                            value={floorName}
                            onChange={(e) =>
                              onMoveItemFloor &&
                              onMoveItemFloor(
                                currentSite,
                                unitName,
                                floorName,
                                e.target.value,
                                realIndex
                              )
                            }
                            className="w-full p-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
                          >
                            {floorOptions.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Trade</label>
                          <DebouncedInput
                            type="text"
                            value={item.trade}
                            onCommit={(val) =>
                              onUpdateItem(
                                currentSite,
                                unitName,
                                floorName,
                                realIndex,
                                "trade",
                                val
                              )
                            }
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                          />
                        </div>
                      </div>

                      {/* Comments / Notes */}
                      <div>
                        {item.notes && !isEditingNote ? (
                          <div
                            onClick={() => setEditingNoteKey(rowKey)}
                            className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900 flex items-center justify-between cursor-pointer"
                          >
                            <span className="italic flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              "{item.notes}"
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold underline">Edit</span>
                          </div>
                        ) : isEditingNote ? (
                          <div className="bg-amber-50 p-2 rounded-lg border border-amber-300 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                              <span>Comments / Notes:</span>
                              <button onClick={() => setEditingNoteKey(null)} className="p-0.5">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <DebouncedInput
                              type="text"
                              value={item.notes || ""}
                              autoFocus
                              onCommit={(val) =>
                                onUpdateItem(
                                  currentSite,
                                  unitName,
                                  floorName,
                                  realIndex,
                                  "notes",
                                  val
                                )
                              }
                              placeholder="Type comment or note..."
                              className="w-full p-1.5 bg-white border border-amber-200 rounded text-xs"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingNoteKey(rowKey)}
                            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 py-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>+ Add Comment / Note</span>
                          </button>
                        )}
                      </div>

                      {/* Bottom Mobile Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() =>
                            onOpenPhotos(
                              currentSite,
                              unitName,
                              floorName,
                              realIndex,
                              item
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                            item.photos && item.photos.length > 0
                              ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <Camera className="w-4 h-4 text-indigo-600" />
                          <span>Photos ({item.photos?.length || 0})</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {onDuplicateItem && (
                            <button
                              onClick={() =>
                                onDuplicateItem(currentSite, unitName, floorName, realIndex)
                              }
                              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="Duplicate row"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              onRemoveItem(currentSite, unitName, floorName, realIndex)
                            }
                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      {/* Quick Action Toast */}
      {batchActionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{batchActionNotice}</span>
        </div>
      )}

      {/* Floating Sticky Batch Actions Toolbar Dock (Shown when 1 or more items are selected) */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[94%] sm:w-auto bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/90 shadow-2xl rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between sm:justify-center gap-2.5 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              {selectedCount}
            </span>
            <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
              {selectedCount} Selected
            </span>
          </div>

          {/* Status Batch Update Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 hidden lg:inline">Status:</span>
            <button
              type="button"
              onClick={() => handleBatchStatusUpdate("Completed")}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Mark all selected items as Completed"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Completed</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchStatusUpdate("In Progress")}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Mark all selected items as In Progress"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchStatusUpdate("Pending")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Mark all selected items as Pending"
            >
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Pending</span>
            </button>
          </div>

          {/* Priority Batch Selector */}
          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBatchPriorityUpdate(e.target.value as WorkPriority);
                  e.target.value = "";
                }
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
              title="Batch update priority for selected items"
            >
              <option value="" disabled>Set Priority...</option>
              <option value="Critical">🔥 Critical</option>
              <option value="High">⚠️ High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">🔽 Low</option>
            </select>
          </div>

          {/* Batch Delete Action Button */}
          <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Delete all selected items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedCount})</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Batch Deletion
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete <strong className="text-rose-600">{selectedCount}</strong> selected work item{selectedCount > 1 ? "s" : ""}?
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 divide-y divide-slate-200/60">
              {(Object.values(selectedItems) as SelectedItemTarget[]).slice(0, 8).map((item, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                    {item.itemArea || item.itemWork || `Row #${item.realIndex + 1}`}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {item.siteName} · {item.unitName}
                  </span>
                </div>
              ))}
              {selectedCount > 8 && (
                <p className="text-[11px] text-slate-400 font-medium pt-1 text-center">
                  ...and {selectedCount - 8} more item{selectedCount - 8 > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-500">
              This action cannot be undone. Associated artisan notes, comments, and attached photos for these selected items will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchDeleteConfirmed}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {selectedCount} Item{selectedCount > 1 ? "s" : ""}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
