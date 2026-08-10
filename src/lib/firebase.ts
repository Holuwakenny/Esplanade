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
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(sitesData));
  } catch (e) {
    console.warn("[OfflineSync] Local storage write error:", e);
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
            const parsed = JSON.parse(payload.sites) as SitesMap;
            // Update cache as well
            localStorage.setItem(CACHE_KEY, payload.sites);
            onSitesUpdate(parsed);
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
