import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { SiteTrackerData } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const DOCUMENT_ID = "esplanade6_tracker";

// Sync data to Firestore Cloud Database
export async function syncToFirestore(data: SiteTrackerData) {
  try {
    const docRef = doc(db, "trackers", DOCUMENT_ID);
    await setDoc(docRef, {
      siteName: "ESPLANADE 6",
      updatedAt: new Date().toISOString(),
      data: JSON.stringify(data),
    }, { merge: true });
    console.log("[Firestore] Successfully synced data to cloud database");
    return true;
  } catch (error) {
    console.warn("[Firestore] Cloud sync error:", error);
    return false;
  }
}

// Subscribe to real-time updates from Firestore Cloud Database
export function subscribeToFirestore(onDataUpdate: (data: SiteTrackerData) => void) {
  try {
    const docRef = doc(db, "trackers", DOCUMENT_ID);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const payload = docSnap.data();
        if (payload && payload.data) {
          try {
            const parsed = JSON.parse(payload.data) as SiteTrackerData;
            onDataUpdate(parsed);
          } catch (e) {
            console.error("Failed to parse Firestore snapshot data", e);
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
