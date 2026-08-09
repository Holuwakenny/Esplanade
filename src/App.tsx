import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { SummaryCards } from "./components/SummaryCards";
import { Toolbar } from "./components/Toolbar";
import { WorkTable } from "./components/WorkTable";
import { AddWorkModal } from "./components/AddWorkModal";
import { TradeAnalyticsModal } from "./components/TradeAnalyticsModal";
import { BackendStatusModal } from "./components/BackendStatusModal";
import { syncToFirestore, subscribeToFirestore } from "./lib/firebase";
import {
  SiteTrackerData,
  TrackerSummary,
  FilterState,
  WorkItem,
  WorkStatus,
  WorkPriority,
} from "./types";

const DEFAULT_SUMMARY: TrackerSummary = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  overallPct: 0,
  tradeCounts: {},
  unitStats: {},
};

export default function App() {
  const [data, setData] = useState<SiteTrackerData>({});
  const [summary, setSummary] = useState<TrackerSummary>(DEFAULT_SUMMARY);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [cloudSynced, setCloudSynced] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    unit: "all",
    floor: "all",
    status: "all",
    trade: "all",
    priority: "all",
    search: "",
  });

  // Calculate local summary from data
  const computeSummary = useCallback((currentData: SiteTrackerData): TrackerSummary => {
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    const tradeCounts: { [trade: string]: number } = {};
    const unitStats: { [unit: string]: { total: number; completed: number; pct: number } } = {};

    Object.entries(currentData).forEach(([unitName, unit]) => {
      let uTotal = 0;
      let uCompleted = 0;
      Object.values(unit).forEach((items) => {
        items.forEach((item) => {
          total++;
          uTotal++;
          if (item.status === "Pending") pending++;
          else if (item.status === "In Progress") inProgress++;
          else if (item.status === "Completed") {
            completed++;
            uCompleted++;
          }

          const trade = item.trade || "Unassigned";
          tradeCounts[trade] = (tradeCounts[trade] || 0) + 1;
        });
      });

      const pct = uTotal > 0 ? Math.round((uCompleted / uTotal) * 100) : 0;
      unitStats[unitName] = { total: uTotal, completed: uCompleted, pct };
    });

    const overallPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, inProgress, completed, overallPct, tradeCounts, unitStats };
  }, []);

  // Sync data to both Python backend & Cloud Firestore
  const persistData = useCallback(
    async (newData: SiteTrackerData) => {
      setData(newData);
      setSummary(computeSummary(newData));
      setIsSyncing(true);

      try {
        // 1. Post to Python Backend
        const res = await fetch("/api/sync-firestore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: newData }),
        });
        if (res.ok) setBackendConnected(true);
      } catch (e) {
        console.warn("[App] Python backend sync warning:", e);
        setBackendConnected(false);
      }

      try {
        // 2. Post to Cloud Firestore
        const ok = await syncToFirestore(newData);
        setCloudSynced(ok);
      } catch (e) {
        console.warn("[App] Firestore sync warning:", e);
        setCloudSynced(false);
      } finally {
        setIsSyncing(false);
      }
    },
    [computeSummary]
  );

  // Fetch initial dataset from Python backend
  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/works");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          setSummary(computeSummary(json.data));
          setBackendConnected(true);
        }
      } else {
        setBackendConnected(false);
      }
    } catch (e) {
      console.warn("[App] Failed to fetch from Python backend:", e);
      setBackendConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [computeSummary]);

  // Initial load & real-time Firestore subscription
  useEffect(() => {
    fetchData();

    // Subscribe to Firestore changes for multi-user collaboration
    const unsubscribe = subscribeToFirestore((cloudData) => {
      if (cloudData && Object.keys(cloudData).length > 0) {
        setData(cloudData);
        setSummary(computeSummary(cloudData));
        setCloudSynced(true);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchData, computeSummary]);

  // Filter change handler
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Add work item
  const handleAddWork = (
    unit: string,
    floor: string,
    area: string,
    work: string,
    trade: string,
    status: WorkStatus,
    priority: WorkPriority,
    notes: string
  ) => {
    const newData = JSON.parse(JSON.stringify(data)) as SiteTrackerData;
    if (!newData[unit]) newData[unit] = {};
    if (!newData[unit][floor]) newData[unit][floor] = [];

    const newItem: WorkItem = {
      id: `item-${Date.now()}`,
      area,
      work,
      trade,
      status,
      priority,
      notes,
    };

    newData[unit][floor].push(newItem);
    persistData(newData);
  };

  // Quick add blank/template row
  const handleAddQuickItem = (unit: string, floor: string) => {
    const newData = JSON.parse(JSON.stringify(data)) as SiteTrackerData;
    if (!newData[unit]) newData[unit] = {};
    if (!newData[unit][floor]) newData[unit][floor] = [];

    newData[unit][floor].push({
      id: `quick-${Date.now()}`,
      area: "New Area",
      work: "Outstanding work item description...",
      trade: "General",
      status: "Pending",
      priority: "Medium",
    });

    persistData(newData);
  };

  // Update item field
  const handleUpdateItem = (
    unit: string,
    floor: string,
    index: number,
    field: keyof WorkItem,
    value: string
  ) => {
    const newData = JSON.parse(JSON.stringify(data)) as SiteTrackerData;
    if (newData[unit] && newData[unit][floor] && newData[unit][floor][index]) {
      (newData[unit][floor][index] as any)[field] = value;
      persistData(newData);
    }
  };

  // Remove item
  const handleRemoveItem = (unit: string, floor: string, index: number) => {
    if (confirm("Are you sure you want to remove this work item?")) {
      const newData = JSON.parse(JSON.stringify(data)) as SiteTrackerData;
      if (newData[unit] && newData[unit][floor]) {
        newData[unit][floor].splice(index, 1);
        persistData(newData);
      }
    }
  };

  // Duplicate item
  const handleDuplicateItem = (unit: string, floor: string, index: number) => {
    const newData = JSON.parse(JSON.stringify(data)) as SiteTrackerData;
    if (newData[unit] && newData[unit][floor] && newData[unit][floor][index]) {
      const existing = newData[unit][floor][index];
      const dup: WorkItem = {
        ...existing,
        id: `dup-${Date.now()}`,
        area: `${existing.area} (Copy)`,
      };
      newData[unit][floor].splice(index + 1, 0, dup);
      persistData(newData);
    }
  };

  // Batch complete floor
  const handleBatchCompleteFloor = (unit: string, floor: string) => {
    if (confirm(`Mark all items on ${unit} - ${floor} as Completed?`)) {
      const newData = JSON.parse(JSON.stringify(data)) as SiteTrackerData;
      if (newData[unit] && newData[unit][floor]) {
        newData[unit][floor].forEach((item) => {
          item.status = "Completed";
        });
        persistData(newData);
      }
    }
  };

  // Reset to initial seed state
  const handleReset = async () => {
    if (confirm("Reset the Esplanade 6 works tracker to the original site closeout list?")) {
      try {
        const res = await fetch("/api/seed", { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
          setSummary(computeSummary(json.data));
          syncToFirestore(json.data);
        }
      } catch (e) {
        console.error("Failed to reset dataset:", e);
      }
    }
  };

  // Download CSV
  const handleExportCsv = () => {
    window.open("/api/export/csv", "_blank");
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Extract list of all units, floors, trades
  const unitsList = Object.keys(data);
  const floorsList = [
    "Ground Floor",
    "First Floor",
    "Second Floor",
    "Third Floor",
    "General / All Floors",
  ];

  const tradesSet = new Set<string>();
  Object.values(data).forEach((unit) => {
    Object.values(unit).forEach((items) => {
      items.forEach((item) => {
        if (item.trade) tradesSet.add(item.trade);
      });
    });
  });
  const tradesList = Array.from(tradesSet).sort();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Brand Header */}
      <Header
        backendConnected={backendConnected}
        cloudSynced={cloudSynced}
        isSyncing={isSyncing}
        onOpenBackendInfo={() => setIsBackendModalOpen(true)}
        onManualSync={fetchData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Cards & Overall Progress */}
        <SummaryCards summary={summary} />

        {/* Filters Toolbar & Actions */}
        <Toolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          units={unitsList}
          floors={floorsList}
          trades={tradesList}
          onAddWork={() => setIsAddModalOpen(true)}
          onOpenTradeAnalytics={() => setIsTradeModalOpen(true)}
          onExportCsv={handleExportCsv}
          onPrint={handlePrint}
          onReset={handleReset}
        />

        {/* Site Works Table View */}
        <WorkTable
          data={data}
          filters={filters}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          onDuplicateItem={handleDuplicateItem}
          onAddQuickItem={handleAddQuickItem}
          onBatchCompleteFloor={handleBatchCompleteFloor}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-center py-6 text-xs text-slate-500 mt-12 print:hidden">
        <p className="font-medium text-slate-700">
          ESPLANADE 6 · Site Coordination & Close-Out Outstanding Works Tracker
        </p>
        <p className="text-slate-400 mt-1">
          Powered by Python 3.10 Backend Service & Google Cloud Firestore Database
        </p>
      </footer>

      {/* Modals */}
      <AddWorkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        units={unitsList}
        floors={floorsList}
        trades={tradesList}
        onAdd={handleAddWork}
      />

      <TradeAnalyticsModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        data={data}
        onSelectTradeFilter={(t) => handleFilterChange("trade", t)}
      />

      <BackendStatusModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        data={data}
      />
    </div>
  );
}
