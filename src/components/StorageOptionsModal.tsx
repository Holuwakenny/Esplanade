import React from "react";
import { X, Database, Cloud, HardDrive, ShieldCheck, Zap, ExternalLink, Check, Info } from "lucide-react";

interface StorageOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageOptionsModal: React.FC<StorageOptionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Best Free Storage & Database Options</h3>
              <p className="text-xs text-slate-300">
                Comparison of top zero-cost storage solutions for site works and progress photos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Current Active Storage Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">
                Active in this Application: Dual Hybrid Persistence Engine
              </h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Your data is automatically backed up in real-time to <strong>Google Cloud Firebase Firestore</strong> + <strong>Browser IndexedDB Local Storage</strong>. IndexedDB provides <strong>gigabytes of offline device storage</strong> with zero quota limits, while Firestore provides <strong>instant multi-device synchronization</strong>.
              </p>
            </div>
          </div>

          {/* Top Free Storage Options Grid */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-xs text-slate-500">
              Recommended Free Cloud & Media Storage Providers:
            </h4>

            {/* Option 1: Google Firebase */}
            <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors bg-white shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                    🔥
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">1. Google Firebase (Spark Free Plan)</h5>
                    <span className="text-xs text-indigo-600 font-semibold">100% Free Forever Tier</span>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Currently Connected
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600 pl-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Database:</strong> 1 GB Firestore database storage, 50,000 document reads/day, 20,000 writes/day.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>File & Photo Storage:</strong> 5 GB cloud bucket storage, 1 GB daily download bandwidth.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Benefits:</strong> Real-time subscriptions, offline caching, works seamlessly on mobile and desktop.
                </li>
              </ul>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Documentation & Setup</span>
                <a
                  href="https://firebase.google.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  firebase.google.com/pricing <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Option 2: Cloudinary */}
            <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors bg-white shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                    ☁️
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">2. Cloudinary (Media & Photo Cloud)</h5>
                    <span className="text-xs text-sky-600 font-semibold">Generous Free Plan</span>
                  </div>
                </div>
                <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Best for Heavy Photos
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600 pl-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Storage:</strong> 25 GB of managed image & video storage credits per month.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Smart Features:</strong> Automatic on-the-fly image optimization, resizing, thumbnail generation, and global CDN delivery.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Best Use:</strong> Storing hundreds of high-resolution construction site inspection photos.
                </li>
              </ul>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Website</span>
                <a
                  href="https://cloudinary.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  cloudinary.com/pricing <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Option 3: Supabase */}
            <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors bg-white shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                    ⚡
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">3. Supabase (PostgreSQL + S3 Storage)</h5>
                    <span className="text-xs text-emerald-600 font-semibold">Open Source Firebase Alternative</span>
                  </div>
                </div>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  SQL + S3 Files
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600 pl-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Database:</strong> 500 MB PostgreSQL relational database.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>File Storage:</strong> 1 GB file storage with 2 GB monthly egress bandwidth.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Benefits:</strong> Standard SQL querying, fine-grained access policies, S3-compatible API.
                </li>
              </ul>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Website</span>
                <a
                  href="https://supabase.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  supabase.com/pricing <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Option 4: Browser IndexedDB */}
            <div className="border border-slate-200 rounded-xl p-4 bg-indigo-50/40 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                    💾
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">4. Browser IndexedDB (Local Offline Engine)</h5>
                    <span className="text-xs text-indigo-700 font-semibold">Zero-Cost Offline Resilience</span>
                  </div>
                </div>
                <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Built-in Engine
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600 pl-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Capacity:</strong> Typically allows <strong>up to 60% of available disk space</strong> (hundreds of Gigabytes).
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Zero Quota Errors:</strong> Unlike old 5MB localStorage, IndexedDB stores photos and large site projects permanently without crashing.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <strong>Speed:</strong> Instant millisecond read/write speeds with zero network latency.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
