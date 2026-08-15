import React, { useState, useMemo } from "react";
import {
  X,
  FileDown,
  Building,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  Image as ImageIcon,
  Check,
  ChevronRight,
  UserCheck,
  FileText,
} from "lucide-react";
import { SitesMap, WorkItem } from "../types";
import { getSitePlans } from "../lib/plansUtils";
import { generateExecutiveDocxReport } from "../utils/docxReportGenerator";
import { generateDocFile } from "../utils/docHtmlGenerator";

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SitesMap;
  initialSite?: string;
  onShowToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const ExecutiveSummaryModal: React.FC<ExecutiveSummaryModalProps> = ({
  isOpen,
  onClose,
  sites,
  initialSite,
  onShowToast,
}) => {
  const allSiteNames = Object.keys(sites);

  // Multi-site selection state
  const [selectedSites, setSelectedSites] = useState<string[]>(
    initialSite && sites[initialSite] ? [initialSite] : allSiteNames
  );

  // Report metadata
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "daily">("weekly");
  const [reportTitle, setReportTitle] = useState<string>("Weekly Site Progress & Executive 5-Point Work Summary");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [preparedBy, setPreparedBy] = useState<string>("Eng. Kehinde / Site Coordinator");
  const [projectManager, setProjectManager] = useState<string>("Lead Project Engineer / PM");
  const [managementRecipient, setManagementRecipient] = useState<string>(
    "Executive Project Management & Board of Directors"
  );

  const [activeTab, setActiveTab] = useState<"questions" | "photos" | "preview">("questions");
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<boolean>(false);
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);

  // Toggle single site in multi-select
  const toggleSite = (siteName: string) => {
    if (selectedSites.includes(siteName)) {
      if (selectedSites.length === 1) {
        onShowToast("At least one site must remain selected", "info");
        return;
      }
      setSelectedSites(selectedSites.filter((s) => s !== siteName));
    } else {
      setSelectedSites([...selectedSites, siteName]);
    }
  };

  const selectAllSites = () => setSelectedSites([...allSiteNames]);
  const deselectAllSites = () => {
    if (allSiteNames.length > 0) setSelectedSites([allSiteNames[0]]);
  };

  // Extract work items and metrics for selected sites
  interface ItemWithLoc extends WorkItem {
    siteName: string;
    unitName: string;
    floorName: string;
  }

  const { allItems, completedItems, ongoingItems, pendingItems, overallPct, allPhotos } = useMemo(() => {
    const all: ItemWithLoc[] = [];
    const completed: ItemWithLoc[] = [];
    const ongoing: ItemWithLoc[] = [];
    const pending: ItemWithLoc[] = [];
    const photosList: Array<{
      id: string;
      siteName: string;
      unitName: string;
      floorName: string;
      area: string;
      work: string;
      trade: string;
      status: string;
      photoUrl: string;
      description: string;
      selected: boolean;
    }> = [];

    selectedSites.forEach((siteName) => {
      const siteObj = sites[siteName] || {};
      Object.entries(siteObj).forEach(([unitName, unitData]) => {
        if (unitName.startsWith("_")) return;
        Object.entries(unitData).forEach(([floorName, floorItems]) => {
          (floorItems as WorkItem[]).forEach((item) => {
            const itemLoc: ItemWithLoc = { ...item, siteName, unitName, floorName };
            all.push(itemLoc);

            if (item.status === "Completed") completed.push(itemLoc);
            else if (item.status === "In Progress") ongoing.push(itemLoc);
            else pending.push(itemLoc);

            if (item.photos && item.photos.length > 0) {
              item.photos.forEach((photoUrl, idx) => {
                photosList.push({
                  id: `${item.id || `${item.area}-${item.work}`}-${idx}`,
                  siteName,
                  unitName,
                  floorName,
                  area: item.area,
                  work: item.work,
                  trade: item.trade || "General",
                  status: item.status,
                  photoUrl,
                  description: `${item.work} - ${item.area} (${item.status})`,
                  selected: true,
                });
              });
            }
          });
        });
      });
    });

    const sortBySite = (a: ItemWithLoc, b: ItemWithLoc) => {
      const sC = a.siteName.localeCompare(b.siteName);
      if (sC !== 0) return sC;
      const uC = a.unitName.localeCompare(b.unitName);
      if (uC !== 0) return uC;
      const fC = a.floorName.localeCompare(b.floorName);
      if (fC !== 0) return fC;
      return (a.area || "").localeCompare(b.area || "");
    };

    all.sort(sortBySite);
    completed.sort(sortBySite);
    ongoing.sort(sortBySite);
    pending.sort(sortBySite);

    const pct = all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0;
    return {
      allItems: all,
      completedItems: completed,
      ongoingItems: ongoing,
      pendingItems: pending,
      overallPct: pct,
      allPhotos: photosList,
    };
  }, [sites, selectedSites]);

  // Photo selection and custom descriptions state
  const [photoState, setPhotoState] = useState<Record<string, { selected: boolean; description: string }>>({});

  // Sync photo state when allPhotos changes
  React.useEffect(() => {
    setPhotoState((prev) => {
      const next = { ...prev };
      allPhotos.forEach((p) => {
        if (next[p.id] === undefined) {
          next[p.id] = { selected: true, description: p.description };
        }
      });
      return next;
    });
  }, [allPhotos]);

  // Aggregate site plans for Q2, Q3, Q4
  const sitePlansSummary = useMemo(() => {
    const issues: string[] = [];
    const nextDay: string[] = [];
    const weekly: string[] = [];
    const monthly: string[] = [];

    selectedSites.forEach((siteName) => {
      const p = getSitePlans(sites, siteName);
      (p.issuesAndChallenges || []).forEach((i) => issues.push(`[${siteName}] ${i.title}${i.notes ? ` (${i.notes})` : ""}`));
      (p.nextDayPlan || []).forEach((n) => nextDay.push(`[${siteName}] ${n.title}${n.notes ? ` (${n.notes})` : ""}`));
      (p.weeklyPlan || []).forEach((w) => weekly.push(`[${siteName}] ${w.title}${w.notes ? ` (${w.notes})` : ""}`));
      (p.monthlyPlan || []).forEach((m) => monthly.push(`[${siteName}] ${m.title}${m.notes ? ` (${m.notes})` : ""}`));
    });

    return { issues, nextDay, weekly, monthly };
  }, [sites, selectedSites]);

  // 5 Questions text state with smart defaults
  const [q1, setQ1] = useState<string>("");
  const [q2, setQ2] = useState<string>("");
  const [q3, setQ3] = useState<string>("");
  const [q4, setQ4] = useState<string>("");
  const [q5, setQ5] = useState<string>("");

  // Initialize or update question text when selection changes
  React.useEffect(() => {
    const siteLabel = selectedSites.join(", ");
    setQ1(
      `Current overall project execution across ${siteLabel} has attained an aggregate completion rate of ${overallPct}%. A total of ${completedItems.length} work items have been fully finished and inspected, ${ongoingItems.length} work items are actively ongoing across various floors and units, and ${pendingItems.length} items remain in preparatory pipeline.`
    );

    const plannedList = reportType === "monthly" ? sitePlansSummary.monthly : sitePlansSummary.weekly;
    setQ2(
      plannedList.length > 0
        ? `According to the approved schedule and target milestones for ${reportType === "weekly" ? "this week" : "this month"}, planned deliverables focused on: \n• ` +
            plannedList.slice(0, 5).join("\n• ")
        : `According to the approved programme of work, the target milestone was to conclude all primary wet works, electrical first-fix conduit piping, plumbing rough-ins, and surface prep ready for final fittings.`
    );

    setQ3(
      sitePlansSummary.issues.length > 0
        ? `Schedule variances and site-specific delays were identified during the reporting cycle due to:\n• ` +
            sitePlansSummary.issues.slice(0, 4).join("\n• ")
        : `Identified variances are primarily driven by slight delays in specialized finishing material deliveries, sequence overlaps between mechanical/electrical trades, and temporary artisan redeployment across priority units.`
    );

    setQ4(
      sitePlansSummary.nextDay.length > 0
        ? `To recover time and meet targets, the site team has deployed immediate corrective interventions:\n• ` +
            sitePlansSummary.nextDay.slice(0, 4).join("\n• ")
        : `Corrective measures implemented include: (1) Deploying dedicated parallel artisan teams across upper floors; (2) Pre-ordering fittings and screed materials 5 days ahead; (3) Instituting daily morning trade synchronization briefings.`
    );

    setQ5(
      `To sustain progress without interruption, the site team requests Management support on:\n1. Prompt review and financial clearance for upcoming batch material procurement requisitions.\n2. Milestone sign-offs and stage disbursements for specialized subcontractors.\n3. Final architectural approval on sample finishes and sanitary fittings.`
    );
  }, [selectedSites, overallPct, completedItems.length, ongoingItems.length, pendingItems.length, reportType, sitePlansSummary]);

  // Update report title dynamically when reportType changes
  const handleReportTypeChange = (type: "weekly" | "monthly" | "daily") => {
    setReportType(type);
    if (type === "weekly") {
      setReportTitle("Weekly Site Progress & Executive 5-Point Work Summary");
    } else if (type === "monthly") {
      setReportTitle("Monthly Executive Site Progress & 5-Point Comprehensive Review");
    } else {
      setReportTitle("Daily Site Work Progress & Operations Close-Out");
    }
  };

  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const chosenPhotos = allPhotos
        .filter((p) => photoState[p.id]?.selected !== false)
        .map((p) => ({
          ...p,
          description: photoState[p.id]?.description || p.description,
        }));

      await generateExecutiveDocxReport({
        reportType,
        title: reportTitle,
        selectedSites,
        sites,
        startDate,
        endDate,
        preparedBy,
        projectManager,
        managementRecipient,
        q1WhereAreWe: q1,
        q2WhereShouldWeBe: q2,
        q3WhyDifference: q3,
        q4WhatDoingAboutIt: q4,
        q5NeedFromManagement: q5,
        includePhotos,
        selectedPhotos: chosenPhotos,
      });

      onShowToast("Word Document (.docx) downloaded successfully! 📄", "success");
    } catch (err) {
      console.error("Failed to generate DOCX:", err);
      onShowToast("Docx generation failed, triggering Word (.doc) fallback...", "info");
      handleDownloadDoc();
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleDownloadDoc = () => {
    try {
      const chosenPhotos = allPhotos
        .filter((p) => photoState[p.id]?.selected !== false)
        .map((p) => ({
          ...p,
          description: photoState[p.id]?.description || p.description,
        }));

      generateDocFile({
        reportType,
        title: reportTitle,
        selectedSites,
        sites,
        startDate,
        endDate,
        preparedBy,
        projectManager,
        managementRecipient,
        q1WhereAreWe: q1,
        q2WhereShouldWeBe: q2,
        q3WhyDifference: q3,
        q4WhatDoingAboutIt: q4,
        q5NeedFromManagement: q5,
        includePhotos,
        selectedPhotos: chosenPhotos,
      });

      onShowToast("Word Document (.doc) downloaded successfully! 📄", "success");
    } catch (err) {
      console.error("Failed to generate DOC:", err);
      onShowToast("Error generating document", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">Executive Work Summary & 5-Point Report</h3>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                  Word / DOC Exporter
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Generate official Word summaries structured strictly around the 5 core management questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 space-y-3">
          {/* Multiple Sites Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                Select Sites for Report ({selectedSites.length} of {allSiteNames.length} selected):
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllSites}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllSites}
                  className="text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSiteNames.map((siteName) => {
                const isSelected = selectedSites.includes(siteName);
                const count = Object.values(sites[siteName] || {}).reduce((acc, u) => {
                  if (typeof u !== "object" || !u) return acc;
                  return (
                    acc +
                    Object.values(u).reduce((fAcc, f) => (Array.isArray(f) ? fAcc + f.length : fAcc), 0)
                  );
                }, 0);

                return (
                  <button
                    key={siteName}
                    type="button"
                    onClick={() => toggleSite(siteName)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{siteName}</span>
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count} items
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period, Dates & Output settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Report Period</label>
              <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleReportTypeChange("weekly")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                    reportType === "weekly" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => handleReportTypeChange("monthly")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                    reportType === "monthly" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => handleReportTypeChange("daily")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                    reportType === "daily" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Daily
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date Range</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Prepared By</label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Engineer Name"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Submitted To</label>
              <input
                type="text"
                value={managementRecipient}
                onChange={(e) => setManagementRecipient(e.target.value)}
                placeholder="Management Recipient"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick KPI Stats Banner */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">
              Total Scope: <strong className="text-slate-900">{allItems.length}</strong>
            </span>
            <span className="text-emerald-700 font-semibold">
              Completed: <strong className="text-emerald-900">{completedItems.length}</strong>
            </span>
            <span className="text-blue-700 font-semibold">
              Ongoing: <strong className="text-blue-900">{ongoingItems.length}</strong>
            </span>
            <span className="text-amber-700 font-semibold">
              Pending: <strong className="text-amber-900">{pendingItems.length}</strong>
            </span>
            <span className="text-indigo-700 font-bold bg-indigo-100/80 px-2 py-0.5 rounded-md">
              Overall: {overallPct}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                activeTab === "questions"
                  ? "bg-white text-indigo-900 shadow-xs border border-indigo-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              5 Core Questions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === "photos"
                  ? "bg-white text-indigo-900 shadow-xs border border-indigo-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Photos ({allPhotos.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === "questions" ? (
            <div className="space-y-5">
              {/* Report Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Report Document Title:
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* QUESTION 1 */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      Where are we? – Current progress and status of work
                    </h4>
                    <p className="text-xs text-slate-500 ml-7">
                      Covers completed work items, ongoing active works, and current physical milestone %
                    </p>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    {completedItems.length} Completed | {ongoingItems.length} Ongoing
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* QUESTION 2 */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      Where should we be? – Planned progress based on approved programme
                    </h4>
                    <p className="text-xs text-slate-500 ml-7">
                      Planned progress, baseline milestones, and target deliverables for this period
                    </p>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* QUESTION 3 */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      Why is there a difference? – Variance, delays, and reasons
                    </h4>
                    <p className="text-xs text-slate-500 ml-7">
                      Root cause analysis of schedule variances, on-site blockers, trade dependencies, material delays
                    </p>
                  </div>
                  {sitePlansSummary.issues.length > 0 && (
                    <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                      {sitePlansSummary.issues.length} Logged Issues
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* QUESTION 4 */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center shrink-0">
                        4
                      </span>
                      What are we doing about it? – Corrective actions and measures
                    </h4>
                    <p className="text-xs text-slate-500 ml-7">
                      Action plans, re-allocated artisan resources, parallel sequencing, and recovery milestones
                    </p>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={q4}
                  onChange={(e) => setQ4(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* QUESTION 5 */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center shrink-0">
                        5
                      </span>
                      What do we need from Management? – Decisions, approvals & interventions
                    </h4>
                    <p className="text-xs text-slate-500 ml-7">
                      Approvals, procurement clearances, stage disbursements, or interventions required from Directors
                    </p>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={q5}
                  onChange={(e) => setQ5(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          ) : (
            /* Photos Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Photographs from Selected Sites ({allPhotos.length} Available)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select which progress photographs to include in the Word document and customize captions
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Include Photos in Document
                </label>
              </div>

              {allPhotos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No photos uploaded for selected sites yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Upload photos on site via the camera button next to any work item to showcase visual progress.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPhotos.map((photo) => {
                    const st = photoState[photo.id] || { selected: true, description: photo.description };
                    return (
                      <div
                        key={photo.id}
                        className={`border rounded-xl p-3 flex flex-col gap-2 transition-all ${
                          st.selected ? "border-indigo-300 bg-indigo-50/20" : "border-slate-200 opacity-60 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                          <span className="truncate max-w-[200px]">
                            {photo.siteName} – {photo.unitName} ({photo.floorName})
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.selected}
                              onChange={(e) =>
                                setPhotoState({
                                  ...photoState,
                                  [photo.id]: { ...st, selected: e.target.checked },
                                })
                              }
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Include</span>
                          </label>
                        </div>

                        <div className="h-44 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                          <img
                            src={photo.photoUrl}
                            alt="Progress item"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>Area: {photo.area}</span>
                            <span className="font-semibold text-indigo-700">{photo.trade}</span>
                          </div>
                          <input
                            type="text"
                            value={st.description}
                            onChange={(e) =>
                              setPhotoState({
                                ...photoState,
                                [photo.id]: { ...st, description: e.target.value },
                              })
                            }
                            placeholder="Add photo caption / description..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Exporting for: <strong className="text-slate-800">{selectedSites.join(", ")}</strong> ({reportType.toUpperCase()} REPORT)
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadDoc}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              Download Word (.doc)
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isGeneratingDocx}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isGeneratingDocx ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating .DOCX...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Download Word (.docx)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
