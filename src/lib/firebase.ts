import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { SitesMap } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const DOCUMENT_ID = "sites_tracker";
const CACHE_KEY = "sites_tracker_cached_data";
const QUEUE_KEY = "sites_tracker_pending_queue";

export interface SyncStatus {
  isOnline: boolean;
  hasPendingSync: boolean;
  isSyncing: boolean;
}

type SyncStatusListener = (status: SyncStatus) => void;
const listeners = new Set<SyncStatusListener>();

let currentStatus: SyncStatus = {
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  hasPendingSync: typeof localStorage !== "undefined" && !!localStorage.getItem(QUEUE_KEY),
  isSyncing: false,
};

function updateStatus(patch: Partial<SyncStatus>) {
  currentStatus = { ...currentStatus, ...patch };
  listeners.forEach((fn) => fn(currentStatus));
}

export function subscribeSyncStatus(listener: SyncStatusListener) {
  listeners.add(listener);
  listener(currentStatus);
  return () => {
    listeners.delete(listener);
  };
}

// Save data to localStorage safely with quota error fallback
export function saveToLocalCache(sitesData: SitesMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    const serialized = JSON.stringify(sitesData);
    localStorage.setItem(CACHE_KEY, serialized);
  } catch (e) {
    console.warn("[LocalCache] Storage write error, attempting stripped backup...", e);
    try {
      const cleansedData = JSON.parse(JSON.stringify(sitesData));
      for (const site of Object.values(cleansedData)) {
        if (typeof site === "object" && site) {
          for (const unit of Object.values(site as any)) {
            if (typeof unit === "object" && unit) {
              for (const items of Object.values(unit as any)) {
                if (Array.isArray(items)) {
                  items.forEach((item: any) => {
                    if (item && item.photo && item.photo.length > 5000) {
                      delete item.photo;
                    }
                  });
                }
              }
            }
          }
        }
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cleansedData));
    } catch (err) {
      console.error("[LocalCache] Critical error saving cache:", err);
    }
  }
}

// Load cached data if available
export function getCachedSitesData(): SitesMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("[OfflineSync] Error reading cache:", e);
  }
  return null;
}

// Merge remote (cloud) and local (cache) maps so user additions are never lost
export function mergeSitesMaps(remote: SitesMap | null | undefined, local: SitesMap | null | undefined): SitesMap {
  if (!remote || Object.keys(remote).length === 0) return local || {};
  if (!local || Object.keys(local).length === 0) return remote || {};

  const merged: SitesMap = { ...remote };

  for (const siteName of Object.keys(local)) {
    if (!merged[siteName]) {
      merged[siteName] = local[siteName];
      continue;
    }

    const remoteSiteData = merged[siteName] || {};
    const localSiteData = local[siteName] || {};
    const mergedSiteData: any = { ...remoteSiteData };

    for (const unitName of Object.keys(localSiteData)) {
      if (unitName === "_plans") continue;

      if (!mergedSiteData[unitName]) {
        mergedSiteData[unitName] = localSiteData[unitName];
        continue;
      }

      const remoteUnit = remoteSiteData[unitName] || {};
      const localUnit = localSiteData[unitName] || {};
      const mergedUnit: any = { ...remoteUnit };

      for (const floorName of Object.keys(localUnit)) {
        if (!mergedUnit[floorName]) {
          mergedUnit[floorName] = localUnit[floorName];
          continue;
        }

        const remoteItems = Array.isArray(remoteUnit[floorName]) ? remoteUnit[floorName] : [];
        const localItems = Array.isArray(localUnit[floorName]) ? localUnit[floorName] : [];

        const itemMap = new Map<string, any>();
        remoteItems.forEach((item: any) => {
          if (!item) return;
          const key = item.id || `${item.area}-${item.work}`;
          itemMap.set(key, item);
        });

        localItems.forEach((item: any) => {
          if (!item) return;
          const key = item.id || `${item.area}-${item.work}`;
          const existing = itemMap.get(key);
          if (!existing) {
            itemMap.set(key, item);
          } else {
            const remoteTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
            const localTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
            if (localTime >= remoteTime) {
              itemMap.set(key, item);
            }
          }
        });

        mergedUnit[floorName] = Array.from(itemMap.values());
      }

      mergedSiteData[unitName] = mergedUnit;
    }

    // Merge _plans
    const remotePlans = remoteSiteData._plans || {};
    const localPlans = localSiteData._plans || {};

    const mergePlanCategory = (remoteList: any[] = [], localList: any[] = []) => {
      const planMap = new Map<string, any>();
      (Array.isArray(remoteList) ? remoteList : []).forEach((p) => {
        if (p) planMap.set(p.id || p.title, p);
      });
      (Array.isArray(localList) ? localList : []).forEach((p) => {
        if (!p) return;
        const key = p.id || p.title;
        const existing = planMap.get(key);
        if (!existing) {
          planMap.set(key, p);
        } else {
          const remoteTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const localTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
          if (localTime >= remoteTime) {
            planMap.set(key, p);
          }
        }
      });
      return Array.from(planMap.values());
    };

    mergedSiteData._plans = {
      issuesAndChallenges: mergePlanCategory(remotePlans.issuesAndChallenges, localPlans.issuesAndChallenges),
      nextDayPlan: mergePlanCategory(remotePlans.nextDayPlan, localPlans.nextDayPlan),
      weeklyPlan: mergePlanCategory(remotePlans.weeklyPlan, localPlans.weeklyPlan),
      monthlyPlan: mergePlanCategory(remotePlans.monthlyPlan, localPlans.monthlyPlan),
    };

    merged[siteName] = mergedSiteData;
  }

  return merged;
}

// Flush pending offline updates to Firestore
export async function flushOfflineQueue(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) return false;
  const pending = localStorage.getItem(QUEUE_KEY);
  if (!pending) return true;

  updateStatus({ isSyncing: true });

  try {
    const parsedData = JSON.parse(pending) as SitesMap;
    const docRef = doc(db, "trackers", DOCUMENT_ID);
    await setDoc(docRef, {
      updatedAt: new Date().toISOString(),
      sites: JSON.stringify(parsedData),
    }, { merge: true });

    localStorage.removeItem(QUEUE_KEY);
    updateStatus({ hasPendingSync: false, isSyncing: false, isOnline: true });
    console.log("[OfflineSync] Flushed offline queue successfully to Firestore");
    return true;
  } catch (err) {
    console.warn("[OfflineSync] Failed to flush queue to Firestore:", err);
    updateStatus({ isSyncing: false });
    return false;
  }
}

// Sync multi-site data to Firestore Cloud Database with offline queue fallback
export async function syncToFirestore(sitesData: SitesMap): Promise<boolean> {
  // Always cache locally first
  saveToLocalCache(sitesData);

  // Check connectivity
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.log("[OfflineSync] Device is offline. Queueing update to local storage...");
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(sitesData));
      updateStatus({ isOnline: false, hasPendingSync: true });
    } catch (e) {
      console.warn("[OfflineSync] Failed to queue offline update:", e);
    }
    return false;
  }

  // Attempt online sync
  try {
    updateStatus({ isSyncing: true });
    const docRef = doc(db, "trackers", DOCUMENT_ID);
    await setDoc(docRef, {
      updatedAt: new Date().toISOString(),
      sites: JSON.stringify(sitesData),
    }, { merge: true });

    // Clear queue if present
    localStorage.removeItem(QUEUE_KEY);
    updateStatus({ isOnline: true, hasPendingSync: false, isSyncing: false });
    console.log("[Firestore] Successfully synced multi-site data to cloud database");
    return true;
  } catch (error) {
    console.warn("[Firestore] Sync failed, queueing locally for retry:", error);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(sitesData));
      updateStatus({ hasPendingSync: true, isSyncing: false });
    } catch (e) {
      console.warn("[OfflineSync] Queue error after sync failure:", e);
    }
    return false;
  }
}

// Subscribe to real-time updates from Firestore
export function subscribeToFirestore(onSitesUpdate: (sites: SitesMap) => void) {
  try {
    const docRef = doc(db, "trackers", DOCUMENT_ID);
    return onSnapshot(docRef, (docSnap) => {
      // Ignore local pending writes echo because local state is already updated locally
      if (docSnap.metadata.hasPendingWrites) {
        return;
      }
      if (docSnap.exists()) {
        const payload = docSnap.data();
        if (payload && payload.sites) {
          try {
            const remote = JSON.parse(payload.sites) as SitesMap;
            const local = getCachedSitesData();
            const merged = mergeSitesMaps(remote, local);
            saveToLocalCache(merged);
            onSitesUpdate(merged);
          } catch (e) {
            console.error("Failed to parse Firestore snapshot sites data", e);
          }
        }
      }
    }, (err) => {
      console.warn("[Firestore] Subscription warning:", err);
    });
  } catch (e) {
    console.warn("[Firestore] Subscription init error:", e);
    return () => {};
  }
}

// Set up window network listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[OfflineSync] Network back online. Attempting auto-sync...");
    updateStatus({ isOnline: true });
    flushOfflineQueue();
  });

  window.addEventListener("offline", () => {
    console.log("[OfflineSync] Network went offline.");
    updateStatus({ isOnline: false });
  });
}
