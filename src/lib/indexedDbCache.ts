/**
 * IndexedDB Persistent Storage for Esplanade 6 Works Tracker
 * Guarantees zero data loss for heavy photos and multi-site state.
 * IndexedDB has gigabytes of storage capacity, eliminating localStorage 5MB quota errors.
 */

import { SitesMap } from "../types";

const DB_NAME = "Esplanade6_SiteTracker_DB";
const DB_VERSION = 1;
const STORE_SITES = "sites_data";
const STORE_PHOTOS = "photos_cache";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SITES)) {
        db.createObjectStore(STORE_SITES, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: "photoId" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save complete multi-site state to IndexedDB
 */
export async function saveSitesToIndexedDB(sitesMap: SitesMap): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SITES, "readwrite");
    const store = tx.objectStore(STORE_SITES);
    store.put({
      key: "current_sites_state",
      data: sitesMap,
      updatedAt: new Date().toISOString(),
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Error saving sites data:", err);
  }
}

/**
 * Load complete multi-site state from IndexedDB
 */
export async function loadSitesFromIndexedDB(): Promise<SitesMap | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SITES, "readonly");
    const store = tx.objectStore(STORE_SITES);
    const request = store.get("current_sites_state");

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve(request.result.data as SitesMap);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn("[IndexedDB] Error loading sites data:", err);
    return null;
  }
}

/**
 * Save an individual photo permanently by unique ID
 */
export async function savePhotoToIndexedDB(photoId: string, base64Data: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PHOTOS, "readwrite");
    const store = tx.objectStore(STORE_PHOTOS);
    store.put({ photoId, data: base64Data, savedAt: new Date().toISOString() });
  } catch (err) {
    console.warn("[IndexedDB] Error caching photo:", err);
  }
}

/**
 * Load photo from IndexedDB
 */
export async function getPhotoFromIndexedDB(photoId: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PHOTOS, "readonly");
    const store = tx.objectStore(STORE_PHOTOS);
    const request = store.get(photoId);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}
