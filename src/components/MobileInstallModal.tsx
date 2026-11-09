import React, { useState } from "react";
import {
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  Download,
  Copy,
  ExternalLink,
  Wifi,
  Sparkles,
  Layers,
  X,
  Apple,
} from "lucide-react";
import { GmhLogo } from "./GmhLogo";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type?: "success" | "info" | "error") => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "desktop">(() => {
    if (isIOS) return "ios";
    if (isAndroid) return "android";
    return "ios";
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        if (onShowToast) onShowToast("App link copied to clipboard! Share with site engineers 📋", "success");
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      if (onShowToast) onShowToast("GMH Tracker installed to your device! 🎉", "success");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 touch-pan-y">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[85vh] my-auto">
        {/* Header with GMH Luxury Theme */}
        <div className="bg-gradient-to-r from-[#071D49] via-[#0B2A6B] to-[#071D49] p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#04122E] border-2 border-[#D4AF37] p-1.5 shadow-lg flex items-center justify-center shrink-0">
              <img
                src="/icons/icon-192.png"
                alt="GMH Tracker App Icon"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  // Fallback to SVG if PNG is loading
                  (e.target as HTMLImageElement).src = "/icons/icon.svg";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F5E18C] text-[10px] font-black uppercase tracking-wider">
                  Mobile PWA & Shortcut
                </span>
                {isInstalled && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Installed
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Install GMH Works Tracker
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Add 1-tap mobile shortcut to your iPhone, iPad, or Android home screen.
              </p>
            </div>
          </div>
        </div>

        {/* Device Selection Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 gap-1.5">
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "ios"
                ? "bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700 font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Apple className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <span>iPhone / iPad</span>
          </button>

          <button
            onClick={() => setActiveTab("android")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "android"
                ? "bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700 font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Android Phone</span>
          </button>

          <button
            onClick={() => setActiveTab("desktop")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "desktop"
                ? "bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700 font-extrabold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Desktop / PC</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0 touch-pan-y space-y-5 text-slate-700 dark:text-slate-300 text-sm">
          {/* iOS Instructions */}
          {activeTab === "ios" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Tip for iOS Safari:</strong> Apple requires shortcuts to be added through the Safari browser toolbar. Follow these 3 quick steps below.
                </div>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Open in Safari & Tap Share
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ensure you are in <strong>Safari</strong> (not inside another app). Tap the <strong>Share</strong> button (the square with an upward arrow <span className="inline-block px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono text-[11px]">📤</span>) at the bottom or top of your screen.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Select &quot;Add to Home Screen&quot;
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Scroll down through the share options and tap <strong className="text-indigo-600 dark:text-indigo-400 font-bold">&quot;Add to Home Screen&quot;</strong> (marked with a <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 dark:text-slate-300" /> icon).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Tap &quot;Add&quot; in Top-Right
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      The name <strong>GMH Tracker</strong> will be pre-filled with the gold luxury emblem. Tap <strong>Add</strong>. The icon now appears on your home screen like any native App Store app!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Instructions */}
          {activeTab === "android" && (
            <div className="space-y-4">
              {isInstallable ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-300 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-sm">One-Click Install Ready!</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200">
                    Your Android browser supports immediate 1-click installation. Tap below to add GMH Tracker directly to your app launcher and home screen.
                  </p>
                  <button
                    onClick={handleDirectInstall}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install GMH Tracker App Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Open Chrome or Samsung Internet Menu
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap the <strong>three dots (⋮)</strong> menu in the upper right corner of Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Choose <strong>Install app</strong> or <strong>Add to Home screen</strong> from the menu options.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Confirm & Launch
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Confirm prompt. The app installs with standalone full-screen window and instant offline database caching.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop Instructions */}
          {activeTab === "desktop" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-950 dark:text-sky-300">
                <p className="font-bold text-sm">Desktop Chrome & Edge PWA</p>
                <p className="text-xs text-sky-800 dark:text-sky-200 mt-1">
                  On Chrome or Edge on Windows/Mac, look for the <strong>Install App icon (computer with down arrow)</strong> inside the right side of the URL address bar, or click Menu (⋮) &gt; &quot;Save and share&quot; &gt; &quot;Install GMH Works Tracker&quot;.
                </p>
              </div>

              {isInstallable && (
                <button
                  onClick={handleDirectInstall}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install to Desktop Window</span>
                </button>
              )}
            </div>
          )}

          {/* Offline & Construction Benefits Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
              <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Works Offline on Site</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Update works, tick completions, and save photos even in basements with zero cell reception.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Full-Screen Native Feel</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  No browser address bars or navigation clutter. Launches instantly from your home screen.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Share Link for Colleagues / Site Supervisors */}
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
            <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide mb-1.5">
              Share link with on-site engineers:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            GMH Luxury · PWA Standalone Mode
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
