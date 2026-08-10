import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { SummaryCards } from "./components/SummaryCards";
import { Toolbar } from "./components/Toolbar";
import { WorkTable } from "./components/WorkTable";
import { AddWorkModal } from "./components/AddWorkModal";
import { TradeAnalyticsModal } from "./components/TradeAnalyticsModal";
import { ManageUnitsModal } from "./components/ManageUnitsModal";
import { ManageSitesModal } from "./components/ManageSitesModal";
import { ReportsModal } from "./components/ReportsModal";
import { PhotoModal } from "./components/PhotoModal";
import { PdfExportModal } from "./components/PdfExportModal";
import { syncToFirestore, subscribeToFirestore, subscribeSyncStatus, SyncStatus } from "./lib/firebase";
import { createEsplanade6Template, createEGC3Template } from "./utils/siteTemplates";
import {
  SiteTrackerData,
  SitesMap,
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

const DEFAULT_SITE_TEMPLATE: SiteTrackerData = {
  "Unit 1": {
    "Ground Floor": [],
    "First Floor": [],
    "Second Floor": [],
    "Third Floor": [],
    "General / All Floors": [],
  },
  "Unit 2": {
    "Ground Floor": [],
    "First Floor": [],
    "Second Floor": [],
    "Third Floor": [],
    "General / All Floors": [],
  },
};

export default function App() {
  const [sitesData, setSitesData] = useState<SitesMap>({});
  const [currentSite, setCurrentSite] = useState<string>("Esplanade 6");
  const [summary, setSummary] = useState<TrackerSummary>(DEFAULT_SUMMARY);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    hasPendingSync: false,
    isSyncing: false,
  });

  // Ref to always track current site in async calls and subscription handlers
  const currentSiteRef = useRef(currentSite);
  useEffect(() => {
    currentSiteRef.current = currentSite;
  }, [currentSite]);

  // Track timestamp of last local edit to protect user input from stale remote snapshots
  const lastLocalUpdateRef = useRef<number>(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageUnitsModalOpen, setIsManageUnitsModalOpen] = useState(false);
  const [isManageSitesModalOpen, setIsManageSitesModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activePhotoItem, setActivePhotoItem] = useState<{
    siteName: string;
    unit: string;
    floor: string;
    index: number;
    item: WorkItem;
  } | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    site: "all",
    unit: "all",
    floor: "all",
    status: "all",
    trade: "all",
    priority: "all",
    search: "",
    dateFilter: "all",
  });

  // Calculate summary dynamically reflecting current active site, map, and filters
  const computeSummary = useCallback(
    (allSitesMap: SitesMap, currentSiteName: string, currentFilters: FilterState): TrackerSummary => {
      let total = 0;
      let pending = 0;
      let inProgress = 0;
      let completed = 0;
      const tradeCounts: { [trade: string]: number } = {};
      const unitStats: { [unit: string]: { total: number; completed: number; pct: number } } = {};

      const siteKeysToInspect =
        currentFilters.site === "all"
          ? Object.keys(allSitesMap)
          : [
              currentFilters.site && allSitesMap[currentFilters.site]
                ? currentFilters.site
                : currentSiteName,
            ];

      siteKeysToInspect.forEach((siteKey) => {
        const siteData = allSitesMap[siteKey] || {};
        Object.entries(siteData).forEach(([unitName, unit]) => {
          if (currentFilters.unit !== "all" && currentFilters.unit !== unitName) return;

          if (!unitStats[unitName]) {
            unitStats[unitName] = { total: 0, completed: 0, pct: 0 };
          }

          Object.entries(unit).forEach(([floorName, items]) => {
            if (currentFilters.floor !== "all" && currentFilters.floor !== floorName) return;

            items.forEach((item) => {
              if (currentFilters.status !== "all" && item.status !== currentFilters.status) return;
              if (currentFilters.trade !== "all" && item.trade !== currentFilters.trade) return;

              if (currentFilters.search) {
                const q = currentFilters.search.toLowerCase();
                const matchArea = (item.area || "").toLowerCase().includes(q);
                const matchWork = (item.work || "").toLowerCase().includes(q);
                const matchTrade = (item.trade || "").toLowerCase().includes(q);
                const matchNotes = (item.notes || "").toLowerCase().includes(q);
                if (!matchArea && !matchWork && !matchTrade && !matchNotes) return;
              }

              total++;
              unitStats[unitName].total++;

              if (item.status === "Pending") pending++;
              else if (item.status === "In Progress") inProgress++;
              else if (item.status === "Completed") {
                completed++;
                unitStats[unitName].completed++;
              }

              const trade = item.trade || "Unassigned";
              tradeCounts[trade] = (tradeCounts[trade] || 0) + 1;
            });
          });
        });
      });

      Object.keys(unitStats).forEach((u) => {
        const st = unitStats[u];
        st.pct = st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0;
      });

      const overallPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, pending, inProgress, completed, overallPct, tradeCounts, unitStats };
    },
    []
  );

  // Active site data getter
  const activeData: SiteTrackerData = sitesData[currentSite] || {};

  const pendingSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persist all sites data
  const persistAllSites = useCallback(
    (newSitesMap: SitesMap, targetSite?: string, debounceMs: number = 0) => {
      lastLocalUpdateRef.current = Date.now();
      const siteToUse = targetSite || currentSiteRef.current;
      setSitesData(newSitesMap);
      setSummary(computeSummary(newSitesMap, siteToUse, filters));

      if (pendingSyncTimerRef.current) {
        clearTimeout(pendingSyncTimerRef.current);
        pendingSyncTimerRef.current = null;
      }

      const executeSync = async () => {
        setIsSyncing(true);
        try {
          await fetch("/api/sync-firestore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: newSitesMap[siteToUse] || {} }),
          });
        } catch (e) {
          console.warn("[App] Sync warning:", e);
        }

        try {
          await syncToFirestore(newSitesMap);
        } catch (e) {
          console.warn("[App] Firestore sync warning:", e);
        } finally {
          setIsSyncing(false);
        }
      };

      if (debounceMs > 0) {
        pendingSyncTimerRef.current = setTimeout(executeSync, debounceMs);
      } else {
        executeSync();
      }
    },
    [computeSummary, filters]
  );

  // Persist current active site data update
  const persistActiveSiteData = useCallback(
    (newSiteData: SiteTrackerData) => {
      const activeSite = currentSiteRef.current;
      const newSitesMap: SitesMap = {
        ...sitesData,
        [activeSite]: newSiteData,
      };
      persistAllSites(newSitesMap, activeSite);
    },
    [sitesData, persistAllSites]
  );

  // Fetch initial dataset
  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/works");
      if (res.ok) {
        const json = await res.json();
        const esplanadeData = json.data || createEsplanade6Template();
        const initialMap: SitesMap = {
          "Esplanade 6": esplanadeData,
          "EGC3": createEGC3Template(),
        };
        setSitesData((prev) => {
          if (Object.keys(prev).length === 0) return initialMap;
          // Ensure EGC3 exists if missing
          if (!prev["EGC3"]) {
            return { ...prev, "EGC3": createEGC3Template() };
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn("[App] Failed to fetch initial data:", e);
      setSitesData((prev) =>
        Object.keys(prev).length > 0
          ? prev
          : {
              "Esplanade 6": createEsplanade6Template(),
              "EGC3": createEGC3Template(),
            }
      );
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial load & real-time Firestore subscription (runs ONCE on mount)
  useEffect(() => {
    fetchData();

    const unsubscribeData = subscribeToFirestore((cloudSites) => {
      // Protect local user typing/edits from being overwritten by real-time cloud snapshots
      if (Date.now() - lastLocalUpdateRef.current < 3500) {
        return;
      }
      if (cloudSites && Object.keys(cloudSites).length > 0) {
        setSitesData(cloudSites);
      }
    });

    const unsubscribeStatus = subscribeSyncStatus((st) => {
      setSyncStatus(st);
    });

    return () => {
      if (unsubscribeData) unsubscribeData();
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, [fetchData]);

  // Update summary when active site, sitesData, or filters change
  useEffect(() => {
    setSummary(computeSummary(sitesData, currentSite, filters));
  }, [currentSite, sitesData, filters, computeSummary]);

  // Manual cloud sync handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncToFirestore(sitesData);
    } catch (e) {
      console.warn("[App] Manual sync warning:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Handle site selection
  const handleSelectSite = (siteName: string) => {
    if (siteName === "all" || sitesData[siteName]) {
      setCurrentSite(siteName);
      setFilters((prev) => ({ ...prev, site: siteName, unit: "all", floor: "all" }));
    }
  };

  // Add new site
  const handleAddSite = (siteName: string, initialData?: SiteTrackerData) => {
    const trimmed = siteName.trim();
    if (!trimmed) return;
    const template = initialData || createEsplanade6Template();
    const newMap: SitesMap = {
      ...sitesData,
      [trimmed]: JSON.parse(JSON.stringify(template)),
    };
    setCurrentSite(trimmed);
    setFilters((prev) => ({ ...prev, site: trimmed, unit: "all", floor: "all" }));
    persistAllSites(newMap, trimmed);
  };

  // Rename site
  const handleRenameSite = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    const newMap: SitesMap = { ...sitesData };
    if (newMap[oldName]) {
      newMap[trimmed] = newMap[oldName];
      delete newMap[oldName];
      let active = currentSiteRef.current;
      if (currentSiteRef.current === oldName) {
        active = trimmed;
        setCurrentSite(trimmed);
      }
      persistAllSites(newMap, active);
    }
  };

  // Delete site
  const handleDeleteSite = (siteName: string) => {
    const siteKeys = Object.keys(sitesData);
    if (siteKeys.length <= 1) return;
    const newMap: SitesMap = { ...sitesData };
    delete newMap[siteName];

    let nextSite = currentSiteRef.current;
    if (currentSiteRef.current === siteName) {
      nextSite = Object.keys(newMap)[0];
      setCurrentSite(nextSite);
    }
    persistAllSites(newMap, nextSite);
  };

  // Move item between sites
  const handleMoveItemSite = (
    fromSite: string,
    toSite: string,
    unit: string,
    floor: string,
    index: number
  ) => {
    if (fromSite === toSite) return;
    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (
      newSitesMap[fromSite] &&
      newSitesMap[fromSite][unit] &&
      newSitesMap[fromSite][unit][floor] &&
      newSitesMap[fromSite][unit][floor][index]
    ) {
      const [item] = newSitesMap[fromSite][unit][floor].splice(index, 1);
      if (!newSitesMap[toSite]) newSitesMap[toSite] = {};
      if (!newSitesMap[toSite][unit]) newSitesMap[toSite][unit] = {};
      if (!newSitesMap[toSite][unit][floor]) newSitesMap[toSite][unit][floor] = [];

      newSitesMap[toSite][unit][floor].push(item);
      persistAllSites(newSitesMap, toSite);
    }
  };

  // Move item between units
  const handleMoveItemUnit = (
    siteName: string,
    fromUnit: string,
    toUnit: string,
    floor: string,
    index: number
  ) => {
    if (fromUnit === toUnit) return;
    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (
      newSitesMap[siteName] &&
      newSitesMap[siteName][fromUnit] &&
      newSitesMap[siteName][fromUnit][floor] &&
      newSitesMap[siteName][fromUnit][floor][index]
    ) {
      const [item] = newSitesMap[siteName][fromUnit][floor].splice(index, 1);
      if (!newSitesMap[siteName][toUnit]) newSitesMap[siteName][toUnit] = {};
      if (!newSitesMap[siteName][toUnit][floor]) newSitesMap[siteName][toUnit][floor] = [];
      newSitesMap[siteName][toUnit][floor].push(item);
      persistAllSites(newSitesMap, siteName);
    }
  };

  // Move item between floors
  const handleMoveItemFloor = (
    siteName: string,
    unit: string,
    fromFloor: string,
    toFloor: string,
    index: number
  ) => {
    if (fromFloor === toFloor) return;
    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (
      newSitesMap[siteName] &&
      newSitesMap[siteName][unit] &&
      newSitesMap[siteName][unit][fromFloor] &&
      newSitesMap[siteName][unit][fromFloor][index]
    ) {
      const [item] = newSitesMap[siteName][unit][fromFloor].splice(index, 1);
      if (!newSitesMap[siteName][unit][toFloor]) newSitesMap[siteName][unit][toFloor] = [];
      newSitesMap[siteName][unit][toFloor].push(item);
      persistAllSites(newSitesMap, siteName);
    }
  };

  // Filter change handler
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "site") {
        if (value === "all") {
          setCurrentSite("all");
        } else if (sitesData[value]) {
          setCurrentSite(value);
        }
      }
      return updated;
    });
  };

  // Add work item to specific site
  const handleAddWork = (
    siteName: string,
    unit: string,
    floor: string,
    area: string,
    work: string,
    trade: string,
    status: WorkStatus,
    priority: WorkPriority,
    notes: string
  ) => {
    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (!newSitesMap[siteName]) newSitesMap[siteName] = {};
    if (!newSitesMap[siteName][unit]) newSitesMap[siteName][unit] = {};
    if (!newSitesMap[siteName][unit][floor]) newSitesMap[siteName][unit][floor] = [];

    const newItem: WorkItem = {
      id: `item-${Date.now()}`,
      area,
      work,
      trade,
      status,
      priority,
      notes,
      updatedAt: new Date().toISOString(),
    };

    newSitesMap[siteName][unit][floor].push(newItem);
    persistAllSites(newSitesMap, siteName);
  };

  // Quick add blank/template row
  const handleAddQuickItem = (siteName: string, unit: string, floor: string) => {
    const targetUnit = filters.unit !== "all" ? filters.unit : unit;
    const targetFloor = filters.floor !== "all" ? filters.floor : floor;
    const targetTrade = filters.trade !== "all" ? filters.trade : "General";

    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (!newSitesMap[siteName]) newSitesMap[siteName] = {};
    if (!newSitesMap[siteName][targetUnit]) newSitesMap[siteName][targetUnit] = {};
    if (!newSitesMap[siteName][targetUnit][targetFloor]) newSitesMap[siteName][targetUnit][targetFloor] = [];

    // Place at the top (unshift) so newly added row is immediately visible without scrolling
    newSitesMap[siteName][targetUnit][targetFloor].unshift({
      id: `quick-${Date.now()}`,
      area: "",
      work: "",
      trade: targetTrade,
      status: "Pending",
      priority: "Medium",
      updatedAt: new Date().toISOString(),
    });

    persistAllSites(newSitesMap, siteName);
  };

  // Update item field
  const handleUpdateItem = (
    siteName: string,
    unit: string,
    floor: string,
    index: number,
    field: keyof WorkItem,
    value: string
  ) => {
    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (
      newSitesMap[siteName] &&
      newSitesMap[siteName][unit] &&
      newSitesMap[siteName][unit][floor] &&
      newSitesMap[siteName][unit][floor][index]
    ) {
      (newSitesMap[siteName][unit][floor][index] as any)[field] = value;
      newSitesMap[siteName][unit][floor][index].updatedAt = new Date().toISOString();
      persistAllSites(newSitesMap, siteName, 500);
    }
  };

  // Remove item
  const handleRemoveItem = (
    siteName: string,
    unit: string,
    floor: string,
    index: number
  ) => {
    if (confirm("Are you sure you want to remove this work item?")) {
      const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
      if (
        newSitesMap[siteName] &&
        newSitesMap[siteName][unit] &&
        newSitesMap[siteName][unit][floor]
      ) {
        newSitesMap[siteName][unit][floor].splice(index, 1);
        persistAllSites(newSitesMap, siteName);
      }
    }
  };

  // Duplicate item
  const handleDuplicateItem = (
    siteName: string,
    unit: string,
    floor: string,
    index: number
  ) => {
    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (
      newSitesMap[siteName] &&
      newSitesMap[siteName][unit] &&
      newSitesMap[siteName][unit][floor] &&
      newSitesMap[siteName][unit][floor][index]
    ) {
      const existing = newSitesMap[siteName][unit][floor][index];
      const dup: WorkItem = {
        ...existing,
        id: `dup-${Date.now()}`,
        area: `${existing.area} (Copy)`,
        updatedAt: new Date().toISOString(),
      };
      newSitesMap[siteName][unit][floor].splice(index + 1, 0, dup);
      persistAllSites(newSitesMap, siteName);
    }
  };

  // Batch complete floor
  const handleBatchCompleteFloor = (siteName: string, unit: string, floor: string) => {
    if (confirm(`Mark all items on ${siteName} - ${unit} - ${floor} as Completed?`)) {
      const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
      if (
        newSitesMap[siteName] &&
        newSitesMap[siteName][unit] &&
        newSitesMap[siteName][unit][floor]
      ) {
        newSitesMap[siteName][unit][floor].forEach((item) => {
          item.status = "Completed";
          item.updatedAt = new Date().toISOString();
        });
        persistAllSites(newSitesMap, siteName);
      }
    }
  };

  // Open Photos modal for an item
  const handleOpenPhotos = (
    siteName: string,
    unit: string,
    floor: string,
    index: number,
    item: WorkItem
  ) => {
    setActivePhotoItem({ siteName, unit, floor, index, item });
  };

  // Update Photos array for an item
  const handleUpdatePhotos = (
    siteName: string,
    unit: string,
    floor: string,
    index: number,
    photos: string[]
  ) => {
    const newSitesMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
    if (
      newSitesMap[siteName] &&
      newSitesMap[siteName][unit] &&
      newSitesMap[siteName][unit][floor] &&
      newSitesMap[siteName][unit][floor][index]
    ) {
      newSitesMap[siteName][unit][floor][index].photos = photos;
      newSitesMap[siteName][unit][floor][index].updatedAt = new Date().toISOString();
      persistAllSites(newSitesMap, siteName);

      setActivePhotoItem((prev) =>
        prev ? { ...prev, item: { ...prev.item, photos } } : null
      );
    }
  };

  // Add new building unit in active site
  const handleAddUnit = (unitName: string, floors: string[]) => {
    const newData = JSON.parse(JSON.stringify(activeData)) as SiteTrackerData;
    if (!newData[unitName]) {
      newData[unitName] = {};
      floors.forEach((f) => {
        newData[unitName][f] = [];
      });
      persistActiveSiteData(newData);
    }
  };

  // Rename building unit in active site
  const handleRenameUnit = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const newData = JSON.parse(JSON.stringify(activeData)) as SiteTrackerData;
    if (newData[oldName]) {
      newData[newName] = newData[oldName];
      delete newData[oldName];
      if (filters.unit === oldName) {
        setFilters((prev) => ({ ...prev, unit: newName }));
      }
      persistActiveSiteData(newData);
    }
  };

  // Delete building unit in active site
  const handleDeleteUnit = (unitName: string) => {
    const newData = JSON.parse(JSON.stringify(activeData)) as SiteTrackerData;
    if (newData[unitName]) {
      delete newData[unitName];
      if (filters.unit === unitName) {
        setFilters((prev) => ({ ...prev, unit: "all" }));
      }
      persistActiveSiteData(newData);
    }
  };

  // Reset to initial seed state
  const handleReset = async () => {
    if (confirm(`Reset "${currentSite}" works tracker to default state?`)) {
      try {
        const res = await fetch("/api/seed", { method: "POST" });
        if (res.ok) {
          const json = await res.json();
          persistActiveSiteData(json.data);
        }
      } catch (e) {
        console.error("Failed to reset dataset:", e);
      }
    }
  };

  // Client-side CSV export for active site
  const handleExportCsv = () => {
    const csvLines = ["Site,Unit,Floor,Area,Outstanding Work,Trade,Status,Priority,Notes"];
    Object.entries(activeData).forEach(([unit, floors]) => {
      Object.entries(floors).forEach(([floor, items]) => {
        items.forEach((item) => {
          const area = (item.area || "").replace(/"/g, '""');
          const work = (item.work || "").replace(/"/g, '""');
          const trade = (item.trade || "").replace(/"/g, '""');
          const status = item.status || "Pending";
          const priority = item.priority || "Medium";
          const notes = (item.notes || "").replace(/"/g, '""');
          csvLines.push(
            `"${currentSite}","${unit}","${floor}","${area}","${work}","${trade}","${status}","${priority}","${notes}"`
          );
        });
      });
    });

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${currentSite.toLowerCase().replace(/\s+/g, "_")}_outstanding_works.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Extract list of all units, floors, trades for active or all filtered sites
  const allSitesList = Object.keys(sitesData).length > 0 ? Object.keys(sitesData) : [currentSite];

  const sitesToInspect =
    filters.site === "all"
      ? Object.values(sitesData)
      : [sitesData[filters.site] || sitesData[currentSite] || {}];

  const unitsSet = new Set<string>();
  sitesToInspect.forEach((sData) => {
    if (sData) Object.keys(sData).forEach((u) => unitsSet.add(u));
  });
  const unitsList = Array.from(unitsSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const floorsSet = new Set<string>();
  sitesToInspect.forEach((sData) => {
    if (sData) {
      Object.values(sData).forEach((unitFloors) => {
        Object.keys(unitFloors).forEach((fl) => {
          if (fl) floorsSet.add(fl);
        });
      });
    }
  });

  const STANDARD_FLOOR_ORDER = [
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

  const floorsList = Array.from(floorsSet).sort((a, b) => {
    const idxA = STANDARD_FLOOR_ORDER.indexOf(a);
    const idxB = STANDARD_FLOOR_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const tradesSet = new Set<string>();
  sitesToInspect.forEach((sData) => {
    if (sData) {
      Object.values(sData).forEach((unit) => {
        Object.values(unit).forEach((items) => {
          items.forEach((item) => {
            if (item.trade) tradesSet.add(item.trade);
          });
        });
      });
    }
  });
  const tradesList = Array.from(tradesSet).sort();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Brand & Site Header */}
      <Header
        currentSite={currentSite}
        allSites={allSitesList}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        onSelectSite={handleSelectSite}
        onOpenManageSites={() => setIsManageSitesModalOpen(true)}
        onManualSync={handleManualSync}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Cards & Overall Progress */}
        <SummaryCards summary={summary} />

        {/* Filters Toolbar & Actions */}
        <Toolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          sitesList={allSitesList}
          units={unitsList}
          floors={floorsList}
          trades={tradesList}
          onAddWork={() => setIsAddModalOpen(true)}
          onOpenManageSites={() => setIsManageSitesModalOpen(true)}
          onOpenManageUnits={() => setIsManageUnitsModalOpen(true)}
          onOpenTradeAnalytics={() => setIsTradeModalOpen(true)}
          onOpenReports={() => setIsReportsModalOpen(true)}
          onOpenPdfExport={() => setIsPdfModalOpen(true)}
          onExportCsv={handleExportCsv}
          onPrint={handlePrint}
          onReset={handleReset}
        />

        {/* Site Works Table View */}
        <WorkTable
          sitesData={sitesData}
          allSitesList={allSitesList}
          activeSiteName={currentSite}
          filters={filters}
          onUpdateItem={handleUpdateItem}
          onMoveItemSite={handleMoveItemSite}
          onMoveItemUnit={handleMoveItemUnit}
          onMoveItemFloor={handleMoveItemFloor}
          onRemoveItem={handleRemoveItem}
          onDuplicateItem={handleDuplicateItem}
          onAddQuickItem={handleAddQuickItem}
          onBatchCompleteFloor={handleBatchCompleteFloor}
          onOpenPhotos={handleOpenPhotos}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-center py-6 text-xs text-slate-500 mt-12 print:hidden">
        <p className="font-semibold text-slate-700">
          {currentSite.toUpperCase()} · Site Coordination & Outstanding Works Close-Out Tracker
        </p>
      </footer>

      {/* Modals */}
      <ManageSitesModal
        isOpen={isManageSitesModalOpen}
        onClose={() => setIsManageSitesModalOpen(false)}
        sites={sitesData}
        currentSite={currentSite}
        onSelectSite={handleSelectSite}
        onAddSite={handleAddSite}
        onRenameSite={handleRenameSite}
        onDeleteSite={handleDeleteSite}
      />

      <ManageUnitsModal
        isOpen={isManageUnitsModalOpen}
        onClose={() => setIsManageUnitsModalOpen(false)}
        data={activeData}
        onAddUnit={handleAddUnit}
        onRenameUnit={handleRenameUnit}
        onDeleteUnit={handleDeleteUnit}
        onSelectUnitFilter={(u) => handleFilterChange("unit", u)}
      />

      <AddWorkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sites={sitesData}
        currentSite={currentSite}
        trades={tradesList}
        onAdd={handleAddWork}
      />

      <TradeAnalyticsModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        data={activeData}
        onSelectTradeFilter={(t) => handleFilterChange("trade", t)}
      />

      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        sites={sitesData}
        currentSite={currentSite}
      />

      <PhotoModal
        isOpen={!!activePhotoItem}
        onClose={() => setActivePhotoItem(null)}
        workItem={activePhotoItem}
        onUpdatePhotos={handleUpdatePhotos}
      />

      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        sitesData={sitesData}
        activeSiteName={currentSite}
        filters={filters}
      />
    </div>
  );
}

