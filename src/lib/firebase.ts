import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  writeBatch,
  getDocs,
  DocumentData,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { SitesMap, WorkItem, SiteTrackerData } from "../types";
import { saveSitesToIndexedDB, loadSitesFromIndexedDB } from "./indexedDbCache";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const DOCUMENT_ID = "sites_tracker";
const SITES_COLLECTION = "sites_data";
const CACHE_KEY = "sites_tracker_cached_data";
const QUEUE_KEY = "sites_tracker_pending_queue";

// Cross-tab and cross-window sync channel
const syncChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("esplanade_sites_sync")
    : null;

export interface SyncStatus {
  isOnline: boolean;
  hasPendingSync: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string;
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

// Sanitize site name to safe Firestore document ID
export function encodeSiteDocId(siteName: string): string {
  return encodeURIComponent(siteName.trim().replace(/\//g, "_")).replace(/%/g, "_");
}

// Create lightweight metadata copy without deep JSON cloning
function createLightweightStorageCopy(sitesData: SitesMap): SitesMap {
  const result: SitesMap = {};
  for (const [siteKey, siteVal] of Object.entries(sitesData)) {
    if (!siteVal || typeof siteVal !== "object") continue;
    const siteObj: any = {};
    for (const [unitKey, unitVal] of Object.entries(siteVal)) {
      if (unitKey === "_plans") {
        siteObj[unitKey] = unitVal;
        continue;
      }
      if (!unitVal || typeof unitVal !== "object") continue;
      const unitObj: any = {};
      for (const [floorKey, items] of Object.entries(unitVal as any)) {
        if (!Array.isArray(items)) continue;
        unitObj[floorKey] = items.map((item: any) => {
          if (item && Array.isArray(item.photos) && item.photos.length > 0) {
            // Keep at most 2 preview photos for lightweight cloud index
            return { ...item, photos: item.photos.slice(0, 2) };
          }
          return item;
        });
      }
      siteObj[unitKey] = unitObj;
    }
    result[siteKey] = siteObj;
  }
  return result;
}

// Ensure payload fits within Firestore's 1MB document limit
export function prepareFirestorePayload(sitesData: SitesMap): string {
  try {
    const raw = JSON.stringify(sitesData);
    if (raw.length < 800000) {
      return raw;
    }
    console.info("[Firestore] Document exceeds 800KB. Optimizing payload for cloud index...");
    const lightweight = createLightweightStorageCopy(sitesData);
    return JSON.stringify(lightweight);
  } catch (err) {
    console.warn("[Firestore] Error preparing payload, using lightweight fallback:", err);
    return JSON.stringify(createLightweightStorageCopy(sitesData));
  }
}

// Debounced timer for IndexedDB and LocalStorage to prevent memory thrashing
let localSaveTimer: NodeJS.Timeout | null = null;
let pendingSitesData: SitesMap | null = null;

function executeLocalSave(sitesData: SitesMap) {
  // 1. Always save complete unstripped state (including all photos) into IndexedDB
  saveSitesToIndexedDB(sitesData).catch((err) =>
    console.warn("[IndexedDB] Save warning:", err)
  );

  // 2. Also save to localStorage
  if (typeof localStorage === "undefined") return;
  try {
    const serialized = JSON.stringify(sitesData);
    localStorage.setItem(CACHE_KEY, serialized);
  } catch (e) {
    console.warn("[LocalCache] LocalStorage quota exceeded, storing lightweight copy...", e);
    try {
      const cleansedData = createLightweightStorageCopy(sitesData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cleansedData));
    } catch (err) {
      console.error("[LocalCache] Critical error writing fallback localStorage:", err);
    }
  }
}

// Save data to localStorage and IndexedDB with resilient fallback and debouncing
export function saveToLocalCache(sitesData: SitesMap, immediate: boolean = false): void {
  pendingSitesData = sitesData;
  if (immediate) {
    if (localSaveTimer) {
      clearTimeout(localSaveTimer);
      localSaveTimer = null;
    }
    executeLocalSave(sitesData);
    return;
  }

  if (localSaveTimer) return;
  localSaveTimer = setTimeout(() => {
    localSaveTimer = null;
    if (pendingSitesData) {
      executeLocalSave(pendingSitesData);
    }
  }, 250);
}

// Load cached data from IndexedDB or LocalStorage
export async function getCachedSitesDataAsync(): Promise<SitesMap | null> {
  const idbData = await loadSitesFromIndexedDB();
  if (idbData && Object.keys(idbData).length > 0) {
    return idbData;
  }
  return getCachedSitesData();
}

// Synchronous cached data getter for initial render
export function getCachedSitesData(): SitesMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("[OfflineSync] Error reading cache:", e);
  }
  return null;
}

// Helper: merge photo arrays without duplicates
function mergePhotos(remotePhotos?: string[], localPhotos?: string[]): string[] {
  const r = Array.isArray(remotePhotos) ? remotePhotos : [];
  const l = Array.isArray(localPhotos) ? localPhotos : [];
  if (r.length === 0) return l;
  if (l.length === 0) return r;

  const seen = new Set<string>();
  const result: string[] = [];
  // Prioritize remote first, then append any unique local photos
  for (const p of r) {
    if (p && !seen.has(p)) {
      seen.add(p);
      result.push(p);
    }
  }
  for (const p of l) {
    if (p && !seen.has(p)) {
      seen.add(p);
      result.push(p);
    }
  }
  return result;
}

// Merge remote (cloud) and local (cache) maps so user additions and photos are never lost
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
            const combinedPhotos = mergePhotos(existing.photos, item.photos);

            if (localTime > remoteTime) {
              itemMap.set(key, { ...item, photos: combinedPhotos });
            } else {
              itemMap.set(key, { ...existing, photos: combinedPhotos });
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
    const nowIso = new Date().toISOString();

    // 1. Sync per-site documents
    for (const [siteName, siteData] of Object.entries(parsedData)) {
      if (!siteName || !siteData) continue;
      const siteDocRef = doc(db, SITES_COLLECTION, encodeSiteDocId(siteName));
      await setDoc(siteDocRef, {
        siteName,
        updatedAt: nowIso,
        data: JSON.stringify(siteData),
      }, { merge: true });
    }

    // 2. Sync global tracker document
    const docRef = doc(db, "trackers", DOCUMENT_ID);
    await setDoc(docRef, {
      updatedAt: nowIso,
      sites: prepareFirestorePayload(parsedData),
      siteNames: Object.keys(parsedData),
    }, { merge: true });

    localStorage.removeItem(QUEUE_KEY);
    updateStatus({ hasPendingSync: false, isSyncing: false, isOnline: true, lastSyncedAt: nowIso });
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

  // Broadcast to other open tabs on this device immediately
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: "LOCAL_UPDATE", data: sitesData });
    } catch (e) {
      // Ignore broadcast errors
    }
  }

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
    const nowIso = new Date().toISOString();

    // 1. Save each site in its own document in sites_data collection
    // This completely bypasses Firestore's 1MB single-document constraint!
    for (const [siteName, siteData] of Object.entries(sitesData)) {
      if (!siteName || !siteData) continue;
      try {
        const siteDocRef = doc(db, SITES_COLLECTION, encodeSiteDocId(siteName));
        await setDoc(
          siteDocRef,
          {
            siteName,
            updatedAt: nowIso,
            data: JSON.stringify(siteData),
          },
          { merge: true }
        );
      } catch (siteErr) {
        console.warn(`[Firestore] Error syncing site "${siteName}":`, siteErr);
      }
    }

    // 2. Also update root index document for backward compatibility
    try {
      const docRef = doc(db, "trackers", DOCUMENT_ID);
      await setDoc(
        docRef,
        {
          updatedAt: nowIso,
          sites: prepareFirestorePayload(sitesData),
          siteNames: Object.keys(sitesData),
        },
        { merge: true }
      );
    } catch (rootErr) {
      console.warn("[Firestore] Root index sync warning:", rootErr);
    }

    // Clear queue if present
    localStorage.removeItem(QUEUE_KEY);
    updateStatus({ isOnline: true, hasPendingSync: false, isSyncing: false, lastSyncedAt: nowIso });
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

// Subscribe to real-time updates from Firestore across all devices
export function subscribeToFirestore(onSitesUpdate: (sites: SitesMap) => void) {
  const unsubscribers: (() => void)[] = [];

  // Listen for broadcast messages from other tabs
  if (syncChannel) {
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data && event.data.type === "LOCAL_UPDATE" && event.data.data) {
        onSitesUpdate(event.data.data);
      }
    };
    syncChannel.addEventListener("message", handleBroadcast);
    unsubscribers.push(() => {
      syncChannel.removeEventListener("message", handleBroadcast);
    });
  }

  try {
    // 1. Primary real-time listener: Listen to the entire sites_data collection
    // Whenever mobile or desktop adds/modifies any site, this fires immediately!
    const sitesColRef = collection(db, SITES_COLLECTION);
    const unsubCol = onSnapshot(
      sitesColRef,
      (querySnapshot) => {
        if (querySnapshot.metadata.hasPendingWrites) {
          return;
        }

        if (!querySnapshot.empty) {
          const remoteMap: SitesMap = {};
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.siteName && data.data) {
              try {
                const parsedSiteData = JSON.parse(data.data);
                remoteMap[data.siteName] = parsedSiteData;
              } catch (e) {
                console.warn(`[Firestore] Failed to parse site data for ${data.siteName}:`, e);
              }
            }
          });

          if (Object.keys(remoteMap).length > 0) {
            saveToLocalCache(remoteMap);
            onSitesUpdate(remoteMap);
            updateStatus({ isOnline: true, hasPendingSync: false });
          }
        }
      },
      (err) => {
        console.warn("[Firestore] sites_data collection subscription warning:", err);
      }
    );
    unsubscribers.push(unsubCol);

    // 2. Secondary fallback listener: Listen to trackers/sites_tracker for legacy compatibility
    const docRef = doc(db, "trackers", DOCUMENT_ID);
    const unsubDoc = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }
        if (docSnap.exists()) {
          const payload = docSnap.data();
          if (payload && payload.sites) {
            try {
              const remote = JSON.parse(payload.sites) as SitesMap;
              if (remote && typeof remote === "object" && Object.keys(remote).length > 0) {
                saveToLocalCache(remote);
                onSitesUpdate(remote);
              }
            } catch (e) {
              console.warn("Failed to parse Firestore snapshot sites data", e);
            }
          }
        }
      },
      (err) => {
        console.warn("[Firestore] Document subscription warning:", err);
      }
    );
    unsubscribers.push(unsubDoc);
  } catch (e) {
    console.warn("[Firestore] Subscription init error:", e);
  }

  return () => {
    unsubscribers.forEach((fn) => fn());
  };
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
