import React, { useState, useMemo, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  UserCheck,
  FileText,
  RefreshCw,
  Eye,
  Layers,
  Building2,
  ExternalLink,
  Info,
  Download,
  Presentation,
} from "lucide-react";
import { SitesMap, WorkItem } from "../types";
import { getSitePlans } from "../lib/plansUtils";
import { generateExecutiveDocxReport, SiteQuestionData } from "../utils/docxReportGenerator";
import { generateDocFile } from "../utils/docHtmlGenerator";
import { generateExecutivePdfReport } from "../utils/pdfReportGenerator";
import { generateExecutivePptxReport } from "../utils/pptxReportGenerator";
import { GmhLogo } from "./GmhLogo";

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SitesMap;
  currentSite?: string;
  initialSite?: string;
  onShowToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export const ExecutiveSummaryModal: React.FC<ExecutiveSummaryModalProps> = ({
  isOpen,
  onClose,
  sites,
  currentSite,
  initialSite,
  onShowToast,
}) => {
  const activeInitialSite = currentSite || initialSite;
  const allSiteNames = Object.keys(sites);

  // Multi-site selection state
  const [selectedSites, setSelectedSites] = useState<string[]>(
    activeInitialSite && sites[activeInitialSite] && activeInitialSite !== "all"
      ? [activeInitialSite]
      : allSiteNames
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingPptx, setIsGeneratingPptx] = useState<boolean>(false);
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

  // View mode for 5 points: "tabs" (one site at a time) or "stacked" (all sites categorized cards)
  const [viewMode, setViewMode] = useState<"tabs" | "stacked">("tabs");
  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>({});
  const [expandedWorkLists, setExpandedWorkLists] = useState<Record<string, boolean>>({});

  // Photos categorization state
  const [photoSiteFilter, setPhotoSiteFilter] = useState<string>("all");
  const [photoPreviewModal, setPhotoPreviewModal] = useState<{
    url: string;
    title: string;
    meta: string;
  } | null>(null);

  // Group photos by site
  const photosBySite = useMemo(() => {
    const map: Record<string, typeof allPhotos> = {};
    selectedSites.forEach((s) => {
      map[s] = [];
    });
    allPhotos.forEach((p) => {
      if (!map[p.siteName]) map[p.siteName] = [];
      map[p.siteName].push(p);
    });
    return map;
  }, [allPhotos, selectedSites]);

  // Bulk toggle photos for a specific site
  const setAllPhotosForSite = (siteName: string, selected: boolean) => {
    const sitePhotos = photosBySite[siteName] || [];
    setPhotoState((prev) => {
      const next = { ...prev };
      sitePhotos.forEach((p) => {
        next[p.id] = {
          ...(next[p.id] || { description: p.description }),
          selected,
        };
      });
      return next;
    });
    notify(`${selected ? "Included" : "Excluded"} all photos for ${siteName}`, "info");
  };

  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  const toggleSiteExpanded = (siteName: string) => {
    setExpandedSites((prev) => ({
      ...prev,
      [siteName]: prev[siteName] === undefined ? false : !prev[siteName],
    }));
  };

  const toggleWorkListExpanded = (siteName: string) => {
    setExpandedWorkLists((prev) => ({
      ...prev,
      [siteName]: !prev[siteName],
    }));
  };

  // Per-site computed metrics for 5 points
  interface SiteMetricDetail {
    siteName: string;
    total: number;
    completed: ItemWithLoc[];
    ongoing: ItemWithLoc[];
    pending: ItemWithLoc[];
    pct: number;
    plans: ReturnType<typeof getSitePlans>;
  }

  const siteMetricsMap = useMemo(() => {
    const map: Record<string, SiteMetricDetail> = {};
    selectedSites.forEach((sName) => {
      const sItems = allItems.filter((i) => i.siteName === sName);
      const sCompleted = sItems.filter((i) => i.status === "Completed");
      const sOngoing = sItems.filter((i) => i.status === "In Progress");
      const sPending = sItems.filter((i) => i.status === "Pending");
      const sTotal = sItems.length;
      const sPct = sTotal > 0 ? Math.round((sCompleted.length / sTotal) * 100) : 0;
      const plans = getSitePlans(sites, sName);

      map[sName] = {
        siteName: sName,
        total: sTotal,
        completed: sCompleted,
        ongoing: sOngoing,
        pending: sPending,
        pct: sPct,
        plans,
      };
    });
    return map;
  }, [allItems, selectedSites, sites]);

  // Per-site 5 Questions text state
  const [siteSummaries, setSiteSummaries] = useState<Record<string, SiteQuestionData>>({});
  const [activeSiteTab, setActiveSiteTab] = useState<string>(() =>
    selectedSites.length === 1 ? selectedSites[0] : "all"
  );

  // Generate smart default 5-point text for a specific site
  const getDefaultSiteSummary = (siteName: string): SiteQuestionData => {
    const siteObj = sites[siteName] || {};
    let sTotal = 0;
    let sCompleted = 0;
    let sOngoing = 0;
    let sPending = 0;

    Object.entries(siteObj).forEach(([uName, uFloors]) => {
      if (uName.startsWith("_")) return;
      Object.entries(uFloors).forEach(([, items]) => {
        (items as WorkItem[]).forEach((item) => {
          sTotal++;
          if (item.status === "Completed") sCompleted++;
          else if (item.status === "In Progress") sOngoing++;
          else sPending++;
        });
      });
    });

    const sPct = sTotal > 0 ? Math.round((sCompleted / sTotal) * 100) : 0;
    const plans = getSitePlans(sites, siteName);
    const issues = plans.issuesAndChallenges || [];
    const nextDay = plans.nextDayPlan || [];
    const weekly = plans.weeklyPlan || [];
    const monthly = plans.monthlyPlan || [];
    const planned = reportType === "monthly" ? monthly : weekly;

    return {
      q1WhereAreWe: `Current project execution on site "${siteName}" stands at ${sPct}% physical completion. A total of ${sCompleted} work items have been fully finished and inspected, ${sOngoing} items are actively ongoing across units and floors, and ${sPending} items remain in preparatory pipeline.`,
      q2WhereShouldWeBe:
        planned.length > 0
          ? `According to the approved schedule and target milestones for ${siteName} (${reportType === "weekly" ? "this week" : "this month"}), planned deliverables focus on:\n• ` +
            planned.slice(0, 4).map((p) => `${p.title}${p.notes ? ` (${p.notes})` : ""}`).join("\n• ")
          : `According to the approved programme of work for ${siteName}, the target milestone was to conclude primary surface preparation, M&E rough-ins, and scheduled trade close-outs.`,
      q3WhyDifference:
        issues.length > 0
          ? `Schedule variances and site-specific delays for ${siteName} during this period:\n• ` +
            issues.slice(0, 4).map((i) => `${i.title}${i.notes ? ` (${i.notes})` : ""}`).join("\n• ")
          : `Identified variances for ${siteName} are primarily linked to material delivery sequence, trade overlaps, and specialized finishing artisan attendance.`,
      q4WhatDoingAboutIt:
        nextDay.length > 0
          ? `To recover time and attain milestones on ${siteName}, the site team has deployed corrective measures:\n• ` +
            nextDay.slice(0, 4).map((n) => `${n.title}${n.notes ? ` (${n.notes})` : ""}`).join("\n• ")
          : `Corrective measures implemented on ${siteName} include: (1) Deploying dedicated parallel artisan teams; (2) Pre-ordering finishing materials 5 days ahead; (3) Daily morning trade synchronization briefings.`,
      q5NeedFromManagement: `To sustain momentum on ${siteName} without disruption, the site team requests Management support on:\n1. Prompt review and financial clearance for upcoming batch material procurement requisitions.\n2. Milestone sign-offs and stage disbursements for specialized subcontractors.\n3. Final architectural approval on sample finishes and sanitary fittings.`,
    };
  };

  // Synchronize site summaries whenever selectedSites or reportType changes
  useEffect(() => {
    setSiteSummaries((prev) => {
      const next = { ...prev };
      selectedSites.forEach((sName) => {
        if (!next[sName]) {
          next[sName] = getDefaultSiteSummary(sName);
        }
      });
      return next;
    });

    if (selectedSites.length === 1) {
      setActiveSiteTab(selectedSites[0]);
    } else if (activeSiteTab !== "all" && !selectedSites.includes(activeSiteTab)) {
      setActiveSiteTab("all");
    }
  }, [selectedSites, reportType, sites]);

  const updateSiteQuestion = (siteName: string, field: keyof SiteQuestionData, val: string) => {
    setSiteSummaries((prev) => ({
      ...prev,
      [siteName]: {
        ...(prev[siteName] || getDefaultSiteSummary(siteName)),
        [field]: val,
      },
    }));

    if (selectedSites.length === 1 && selectedSites[0] === siteName) {
      if (field === "q1WhereAreWe") setQ1(val);
      else if (field === "q2WhereShouldWeBe") setQ2(val);
      else if (field === "q3WhyDifference") setQ3(val);
      else if (field === "q4WhatDoingAboutIt") setQ4(val);
      else if (field === "q5NeedFromManagement") setQ5(val);
    }
  };

  const resetSiteDraft = (siteName: string) => {
    const fresh = getDefaultSiteSummary(siteName);
    setSiteSummaries((prev) => ({
      ...prev,
      [siteName]: fresh,
    }));
    if (selectedSites.length === 1 && selectedSites[0] === siteName) {
      setQ1(fresh.q1WhereAreWe || "");
      setQ2(fresh.q2WhereShouldWeBe || "");
      setQ3(fresh.q3WhyDifference || "");
      setQ4(fresh.q4WhatDoingAboutIt || "");
      setQ5(fresh.q5NeedFromManagement || "");
    }
    notify(`Reset 5-Point Summary for "${siteName}" to auto-draft`, "info");
  };

  const resetAllDrafts = () => {
    const nextSiteSummaries: Record<string, SiteQuestionData> = {};
    selectedSites.forEach((sName) => {
      nextSiteSummaries[sName] = getDefaultSiteSummary(sName);
    });
    setSiteSummaries(nextSiteSummaries);

    const siteLabel = selectedSites.join(", ");
    setQ1(
      `Current overall project execution across ${siteLabel} has attained an aggregate completion rate of ${overallPct}%. A total of ${completedItems.length} work items have been fully finished and inspected, ${ongoingItems.length} work items are actively ongoing across various floors and units, and ${pendingItems.length} items remain in preparatory pipeline.`
    );
    notify("Reset all site 5-point summaries to latest site metrics", "info");
  };

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
        siteSummaries,
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
        siteSummaries,
        includePhotos,
        selectedPhotos: chosenPhotos,
      });

      onShowToast("Word Document (.doc) downloaded successfully! 📄", "success");
    } catch (err) {
      console.error("Failed to generate DOC:", err);
      onShowToast("Error generating document", "error");
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const chosenPhotos = allPhotos
        .filter((p) => photoState[p.id]?.selected !== false)
        .map((p) => ({
          ...p,
          description: photoState[p.id]?.description || p.description,
        }));

      await generateExecutivePdfReport({
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
        siteSummaries,
        includePhotos,
        selectedPhotos: chosenPhotos,
      });

      if (onShowToast) {
        onShowToast("PDF Document (.pdf) downloaded successfully! 📄", "success");
      }
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      if (onShowToast) {
        onShowToast("Error generating PDF document", "error");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPptx = async () => {
    setIsGeneratingPptx(true);
    try {
      const chosenPhotos = allPhotos
        .filter((p) => photoState[p.id]?.selected !== false)
        .map((p) => ({
          ...p,
          description: photoState[p.id]?.description || p.description,
        }));

      await generateExecutivePptxReport({
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
        siteSummaries,
        includePhotos,
        selectedPhotos: chosenPhotos,
      });

      if (onShowToast) {
        onShowToast("PowerPoint Presentation (.pptx) downloaded successfully! 📊", "success");
      }
    } catch (err) {
      console.error("Failed to generate PPTX:", err);
      if (onShowToast) {
        onShowToast("Error generating PowerPoint presentation", "error");
      }
    } finally {
      setIsGeneratingPptx(false);
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
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-white text-indigo-900 shadow-xs border border-indigo-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              Document Preview
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

              {/* SITE CATEGORIZATION BAR */}
              <div className="bg-slate-900 p-3 rounded-xl text-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    5 Points Categorized by:
                  </span>

                  {/* Consolidated Tab (if multiple sites selected) */}
                  {selectedSites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSiteTab("all");
                        setViewMode("tabs");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        viewMode === "tabs" && activeSiteTab === "all"
                          ? "bg-indigo-600 text-white shadow-xs ring-1 ring-white/30"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <span>🌐 Consolidated Overview</span>
                      <span className="bg-indigo-900/80 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {overallPct}%
                      </span>
                    </button>
                  )}

                  {/* Individual Site Tabs */}
                  {selectedSites.map((sName) => {
                    const sMetrics = siteMetricsMap[sName];
                    const isSiteActive = viewMode === "tabs" && activeSiteTab === sName;
                    const pct = sMetrics?.pct || 0;
                    return (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => {
                          setActiveSiteTab(sName);
                          setViewMode("tabs");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSiteActive
                            ? "bg-indigo-600 text-white shadow-xs ring-1 ring-white/30"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 text-indigo-300" />
                        <span>{sName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            pct >= 80
                              ? "bg-emerald-500/30 text-emerald-300"
                              : pct >= 40
                              ? "bg-blue-500/30 text-blue-300"
                              : "bg-amber-500/30 text-amber-300"
                          }`}
                        >
                          {pct}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* View Mode Toggle: Tabs vs Stacked All Sites */}
                <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewMode("tabs")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === "tabs"
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Focus on one site at a time"
                  >
                    <span>📑 Tabbed View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("stacked")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === "stacked"
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Display all sites categorized on one page"
                  >
                    <span>📜 All Sites Categorized</span>
                  </button>
                </div>
              </div>

              {/* RENDER VIEW: TABBED MODE */}
              {viewMode === "tabs" && (
                <>
                  {activeSiteTab === "all" ? (
                    /* CONSOLIDATED 5 QUESTIONS */
                    <div className="space-y-4">
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            Consolidated 5-Point Portfolio Summary:
                          </span>
                          <span className="text-slate-600">
                            Aggregated across all {selectedSites.length} selected sites ({selectedSites.join(", ")}).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={resetAllDrafts}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset Consolidated to Auto-Draft</span>
                        </button>
                      </div>

                      {/* QUESTION 1 */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">
                                1
                              </span>
                              Where are we across all sites? – Current progress and status of work
                            </h4>
                            <p className="text-xs text-slate-500 ml-7">
                              Covers portfolio completed deliverables, active ongoing works, and overall milestone %
                            </p>
                          </div>
                          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            {completedItems.length} Completed | {ongoingItems.length} Ongoing ({overallPct}%)
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
                              Planned progress, baseline milestones, and target deliverables across all sites
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
                    /* SITE-SPECIFIC 5 QUESTIONS */
                    (() => {
                      const sName = activeSiteTab;
                      const sData = siteSummaries[sName] || getDefaultSiteSummary(sName);
                      const sMetric = siteMetricsMap[sName];
                      const sCompleted = sMetric?.completed || [];
                      const sOngoing = sMetric?.ongoing || [];
                      const sPending = sMetric?.pending || [];
                      const sTotal = sMetric?.total || 0;
                      const sPct = sMetric?.pct || 0;
                      const sPlans = sMetric?.plans || getSitePlans(sites, sName);
                      const sIssues = sPlans.issuesAndChallenges || [];
                      const sNextDay = sPlans.nextDayPlan || [];
                      const sMilestones =
                        reportType === "monthly" ? sPlans.monthlyPlan || [] : sPlans.weeklyPlan || [];
                      const isWorkListOpen = !!expandedWorkLists[sName];

                      return (
                        <div className="space-y-4">
                          {/* Site Performance Header Card */}
                          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-xl p-4 text-white shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/80 flex items-center justify-center text-white border border-indigo-400/30">
                                  <Building className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-base tracking-tight text-white uppercase">
                                      {sName}
                                    </h3>
                                    <span
                                      className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                                        sPct >= 80
                                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                          : sPct >= 40
                                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                      }`}
                                    >
                                      {sPct}% Completed
                                    </span>
                                  </div>
                                  <p className="text-xs text-indigo-200 mt-0.5">
                                    Site-specific 5-point close-out summary and operational audit
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => resetSiteDraft(sName)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-200 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/30 transition-colors cursor-pointer"
                                  title="Re-generate auto draft from current site data"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Reset Auto-Draft</span>
                                </button>
                              </div>
                            </div>

                            {/* Site KPI Counter Chips */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-indigo-900/80 text-xs">
                              <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                                <span className="text-[11px] text-slate-400 block">Total Scope</span>
                                <strong className="text-sm font-bold text-white">{sTotal} items</strong>
                              </div>
                              <div className="bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-800/40">
                                <span className="text-[11px] text-emerald-400 block">Completed</span>
                                <strong className="text-sm font-bold text-emerald-300">
                                  {sCompleted.length} items
                                </strong>
                              </div>
                              <div className="bg-blue-950/40 px-3 py-2 rounded-lg border border-blue-800/40">
                                <span className="text-[11px] text-blue-400 block">In Progress</span>
                                <strong className="text-sm font-bold text-blue-300">{sOngoing.length} items</strong>
                              </div>
                              <div className="bg-amber-950/40 px-3 py-2 rounded-lg border border-amber-800/40">
                                <span className="text-[11px] text-amber-400 block">Pending</span>
                                <strong className="text-sm font-bold text-amber-300">{sPending.length} items</strong>
                              </div>
                            </div>
                          </div>

                          {/* QUESTION 1 for this Site */}
                          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">
                                    1
                                  </span>
                                  Where are we on {sName}? – Current progress & status of work
                                </h4>
                                <p className="text-xs text-slate-500 ml-7">
                                  Covers completed deliverables, active ongoing trades, and milestone % for {sName}
                                </p>
                              </div>
                              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {sCompleted.length} Finished | {sOngoing.length} Active ({sPct}%)
                              </span>
                            </div>

                            <textarea
                              rows={3}
                              value={sData.q1WhereAreWe || ""}
                              onChange={(e) => updateSiteQuestion(sName, "q1WhereAreWe", e.target.value)}
                              className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                              placeholder={`Draft status for ${sName}...`}
                            />

                            {/* Collapsible preview of items on this site */}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => toggleWorkListExpanded(sName)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer self-start"
                              >
                                {isWorkListOpen ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {isWorkListOpen ? "Hide" : "Preview"} work scope breakdown for {sName} (
                                  {sCompleted.length} completed, {sOngoing.length} ongoing)
                                </span>
                              </button>

                              {isWorkListOpen && (
                                <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs space-y-2">
                                  <div>
                                    <span className="font-bold text-emerald-800 block mb-1">
                                      Completed on {sName} ({sCompleted.length}):
                                    </span>
                                    {sCompleted.length === 0 ? (
                                      <span className="text-slate-400 italic">No completed items logged yet.</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {sCompleted.slice(0, 20).map((c, idx) => (
                                          <span
                                            key={idx}
                                            className="bg-emerald-100/80 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded text-[11px]"
                                          >
                                            {c.unitName} ({c.floorName}) - {c.area}: {c.work}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/60">
                                    <span className="font-bold text-blue-800 block mb-1">
                                      Actively Ongoing on {sName} ({sOngoing.length}):
                                    </span>
                                    {sOngoing.length === 0 ? (
                                      <span className="text-slate-400 italic">No ongoing items currently.</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {sOngoing.slice(0, 20).map((o, idx) => (
                                          <span
                                            key={idx}
                                            className="bg-blue-100/80 text-blue-900 border border-blue-200 px-2 py-0.5 rounded text-[11px]"
                                          >
                                            {o.unitName} ({o.floorName}) - {o.area}: {o.work} [{o.trade || "General"}]
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* QUESTION 2 for this Site */}
                          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">
                                    2
                                  </span>
                                  Where should we be on {sName}? – Planned programme milestones
                                </h4>
                                <p className="text-xs text-slate-500 ml-7">
                                  Approved schedule milestones and planned benchmarks for {sName}
                                </p>
                              </div>
                            </div>
                            <textarea
                              rows={3}
                              value={sData.q2WhereShouldWeBe || ""}
                              onChange={(e) => updateSiteQuestion(sName, "q2WhereShouldWeBe", e.target.value)}
                              className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                            />
                            {sMilestones.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                                <span className="font-bold text-slate-700">Programme Targets:</span>
                                {sMilestones.slice(0, 4).map((p) => (
                                  <span
                                    key={p.id}
                                    className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[11px]"
                                  >
                                    🎯 {p.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* QUESTION 3 for this Site */}
                          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center shrink-0">
                                    3
                                  </span>
                                  Why is there a difference on {sName}? – Variances, delays & reasons
                                </h4>
                                <p className="text-xs text-slate-500 ml-7">
                                  Root cause analysis of schedule variances, blockers, and trade issues on {sName}
                                </p>
                              </div>
                              {sIssues.length > 0 && (
                                <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                                  {sIssues.length} Logged Issues
                                </span>
                              )}
                            </div>
                            <textarea
                              rows={3}
                              value={sData.q3WhyDifference || ""}
                              onChange={(e) => updateSiteQuestion(sName, "q3WhyDifference", e.target.value)}
                              className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                            />
                            {sIssues.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-rose-700">
                                <span className="font-bold">Logged Site Challenges:</span>
                                {sIssues.slice(0, 4).map((i) => (
                                  <span
                                    key={i.id}
                                    className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[11px]"
                                  >
                                    ⚠️ {i.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* QUESTION 4 for this Site */}
                          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center shrink-0">
                                    4
                                  </span>
                                  What are we doing about it on {sName}? – Corrective actions & recovery
                                </h4>
                                <p className="text-xs text-slate-500 ml-7">
                                  Action plans, re-allocated artisan resources, parallel sequencing on {sName}
                                </p>
                              </div>
                              {sNextDay.length > 0 && (
                                <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                  {sNextDay.length} Action Plans
                                </span>
                              )}
                            </div>
                            <textarea
                              rows={3}
                              value={sData.q4WhatDoingAboutIt || ""}
                              onChange={(e) => updateSiteQuestion(sName, "q4WhatDoingAboutIt", e.target.value)}
                              className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                            />
                            {sNextDay.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-amber-800">
                                <span className="font-bold">Recovery Interventions:</span>
                                {sNextDay.slice(0, 4).map((n) => (
                                  <span
                                    key={n.id}
                                    className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px]"
                                  >
                                    ⚡ {n.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* QUESTION 5 for this Site */}
                          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center shrink-0">
                                    5
                                  </span>
                                  What do we need from Management for {sName}? – Decisions & approvals
                                </h4>
                                <p className="text-xs text-slate-500 ml-7">
                                  Approvals, procurement clearances, disbursements, or decisions required for {sName}
                                </p>
                              </div>
                            </div>
                            <textarea
                              rows={3}
                              value={sData.q5NeedFromManagement || ""}
                              onChange={(e) => updateSiteQuestion(sName, "q5NeedFromManagement", e.target.value)}
                              className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                            />
                          </div>

                          {/* Visual Evidence Section for this Site alongside 5 Points */}
                          {(() => {
                            const sitePhotos = photosBySite[sName] || [];
                            const includedCount = sitePhotos.filter(
                              (p) => photoState[p.id]?.selected ?? true
                            ).length;
                            return (
                              <div className="border border-indigo-200 rounded-xl p-4 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-indigo-50/30 shadow-xs space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                                        Photographic Evidence for {sName}
                                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                          {includedCount} of {sitePhotos.length} Included
                                        </span>
                                      </h5>
                                      <p className="text-[11px] text-slate-500">
                                        These photographs are categorized and embedded directly alongside {sName}'s 5-point report in Word.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {sitePhotos.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setAllPhotosForSite(sName, includedCount < sitePhotos.length)}
                                        className="text-[11px] text-slate-600 hover:text-indigo-700 font-semibold px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                                      >
                                        {includedCount < sitePhotos.length ? "Include All" : "Exclude All"}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPhotoSiteFilter(sName);
                                        setActiveTab("photos");
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-white border border-indigo-300 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      <span>Configure {sName} Photos</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {sitePhotos.length > 0 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                                    {sitePhotos.slice(0, 6).map((photo) => {
                                      const isSel = photoState[photo.id]?.selected ?? true;
                                      return (
                                        <div
                                          key={photo.id}
                                          onClick={() =>
                                            setPhotoPreviewModal({
                                              url: photo.photoUrl,
                                              title: `${sName} – ${photo.unitName} (${photo.floorName})`,
                                              meta: `${photo.area} | ${photo.trade} | ${photoState[photo.id]?.description || photo.work}`,
                                            })
                                          }
                                          className={`relative rounded-lg overflow-hidden border h-16 cursor-pointer group transition-all ${
                                            isSel ? "border-indigo-400 ring-1 ring-indigo-400/50" : "border-slate-200 opacity-40"
                                          }`}
                                        >
                                          <img
                                            src={photo.photoUrl}
                                            alt={photo.work}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px]">
                                            <Eye className="w-3 h-3" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic">
                                    No photos uploaded for {sName} yet. Upload photos via the camera icon in the works tracker table.
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()
                  )}
                </>
              )}

              {/* RENDER VIEW: STACKED (ALL SITES CATEGORIZED) */}
              {viewMode === "stacked" && (
                <div className="space-y-6">
                  {/* Consolidated Header if multiple sites */}
                  {selectedSites.length > 1 && (
                    <div className="border border-indigo-200 rounded-xl bg-indigo-50/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                            Part I: Consolidated Portfolio 5-Point Summary ({selectedSites.length} Sites)
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={resetAllDrafts}
                          className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset All</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-indigo-900 block">1. Where are we?</label>
                          <textarea
                            rows={3}
                            value={q1}
                            onChange={(e) => setQ1(e.target.value)}
                            className="w-full text-xs bg-white border border-indigo-200 rounded-lg p-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-indigo-900 block">
                            2. Where should we be?
                          </label>
                          <textarea
                            rows={3}
                            value={q2}
                            onChange={(e) => setQ2(e.target.value)}
                            className="w-full text-xs bg-white border border-indigo-200 rounded-lg p-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-rose-900 block">
                            3. Why is there a difference?
                          </label>
                          <textarea
                            rows={3}
                            value={q3}
                            onChange={(e) => setQ3(e.target.value)}
                            className="w-full text-xs bg-white border border-rose-200 rounded-lg p-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-amber-900 block">
                            4. What are we doing about it?
                          </label>
                          <textarea
                            rows={3}
                            value={q4}
                            onChange={(e) => setQ4(e.target.value)}
                            className="w-full text-xs bg-white border border-amber-200 rounded-lg p-2"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-purple-900 block">
                          5. What do we need from Management?
                        </label>
                        <textarea
                          rows={2}
                          value={q5}
                          onChange={(e) => setQ5(e.target.value)}
                          className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Each Site's 5-Point Card */}
                  {selectedSites.map((siteName) => {
                    const sData = siteSummaries[siteName] || getDefaultSiteSummary(siteName);
                    const sMetric = siteMetricsMap[siteName];
                    const sTotal = sMetric?.total || 0;
                    const sPct = sMetric?.pct || 0;
                    const sCompleted = sMetric?.completed || [];
                    const sOngoing = sMetric?.ongoing || [];
                    const isCollapsed = expandedSites[siteName] === false;

                    return (
                      <div
                        key={siteName}
                        className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white"
                      >
                        {/* Site Header Banner */}
                        <div
                          onClick={() => toggleSiteExpanded(siteName)}
                          className="bg-slate-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Building className="w-4 h-4 text-indigo-400" />
                            <h4 className="font-extrabold text-sm uppercase tracking-wide">
                              Site 5-Point Work Summary: {siteName}
                            </h4>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                sPct >= 80
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : sPct >= 40
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {sPct}% Completed
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-300">
                              {sCompleted.length} Completed | {sOngoing.length} Ongoing | {sTotal} Total
                            </span>
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Site 5-Point Body */}
                        {!isCollapsed && (
                          <div className="p-4 space-y-4 bg-slate-50/40">
                            {/* Point 1 */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                                <span>1. Where are we on {siteName}?</span>
                                <span className="text-[11px] font-normal text-emerald-700 font-semibold">
                                  {sCompleted.length} Completed, {sOngoing.length} Ongoing
                                </span>
                              </label>
                              <textarea
                                rows={3}
                                value={sData.q1WhereAreWe || ""}
                                onChange={(e) => updateSiteQuestion(siteName, "q1WhereAreWe", e.target.value)}
                                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>

                            {/* Point 2 */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-indigo-900 block">
                                2. Where should we be on {siteName}?
                              </label>
                              <textarea
                                rows={2}
                                value={sData.q2WhereShouldWeBe || ""}
                                onChange={(e) => updateSiteQuestion(siteName, "q2WhereShouldWeBe", e.target.value)}
                                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>

                            {/* Point 3 */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-rose-900 block">
                                3. Why is there a difference on {siteName}?
                              </label>
                              <textarea
                                rows={2}
                                value={sData.q3WhyDifference || ""}
                                onChange={(e) => updateSiteQuestion(siteName, "q3WhyDifference", e.target.value)}
                                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>

                            {/* Point 4 */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-amber-900 block">
                                4. What are we doing about it on {siteName}?
                              </label>
                              <textarea
                                rows={2}
                                value={sData.q4WhatDoingAboutIt || ""}
                                onChange={(e) => updateSiteQuestion(siteName, "q4WhatDoingAboutIt", e.target.value)}
                                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>

                            {/* Point 5 */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-purple-900 block">
                                5. What do we need from Management for {siteName}?
                              </label>
                              <textarea
                                rows={2}
                                value={sData.q5NeedFromManagement || ""}
                                onChange={(e) => updateSiteQuestion(siteName, "q5NeedFromManagement", e.target.value)}
                                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>

                            {/* Point 6 Preview: Site Photographic Evidence */}
                            {(() => {
                              const sitePhotos = photosBySite[siteName] || [];
                              const includedCount = sitePhotos.filter(
                                (p) => photoState[p.id]?.selected ?? true
                              ).length;
                              return (
                                <div className="border border-indigo-200 rounded-xl p-3.5 bg-gradient-to-r from-indigo-50/40 via-white to-slate-50 space-y-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                                      <h5 className="text-xs font-bold text-indigo-950">
                                        6. Photographic Evidence for {siteName}
                                      </h5>
                                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                        {includedCount} of {sitePhotos.length} Included
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPhotoSiteFilter(siteName);
                                        setActiveTab("photos");
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                                    >
                                      <span>Configure Photos</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {sitePhotos.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                      {sitePhotos.slice(0, 6).map((photo) => {
                                        const isSel = photoState[photo.id]?.selected ?? true;
                                        return (
                                          <div
                                            key={photo.id}
                                            onClick={() =>
                                              setPhotoPreviewModal({
                                                url: photo.photoUrl,
                                                title: `${siteName} – ${photo.unitName} (${photo.floorName})`,
                                                meta: `${photo.area} | ${photo.trade} | ${photoState[photo.id]?.description || photo.work}`,
                                              })
                                            }
                                            className={`relative rounded-md overflow-hidden border h-14 cursor-pointer group ${
                                              isSel ? "border-indigo-400 ring-1 ring-indigo-400/50" : "border-slate-200 opacity-40"
                                            }`}
                                          >
                                            <img
                                              src={photo.photoUrl}
                                              alt={photo.work}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                              referrerPolicy="no-referrer"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-slate-400 italic">No photos recorded for this site yet.</p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "preview" ? (
            /* LIVE DOCUMENT PREVIEW TAB */
            <div className="space-y-6 bg-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 max-w-3xl mx-auto space-y-6 text-slate-900">
                {/* GMH LUXURY OFFICIAL COVER PAGE BANNER */}
                <div className="bg-[#071D49] text-white p-6 rounded-xl border-2 border-[#D4AF37] shadow-xl text-center space-y-4">
                  <div className="flex justify-center">
                    <GmhLogo className="h-16 w-auto" />
                  </div>
                  <div className="w-24 h-0.5 bg-[#D4AF37] mx-auto" />
                  <div>
                    <h2 className="text-lg font-black uppercase text-white tracking-wide">
                      {reportTitle}
                    </h2>
                    <p className="text-xs font-extrabold text-[#F9E79F] uppercase tracking-widest mt-1">
                      EXECUTIVE 5-QUESTION PROGRESS SUMMARY & DETAILED SITE AUDIT
                    </p>
                  </div>
                  <div className="bg-[#0b2559] border border-[#D4AF37]/60 rounded-lg p-3 max-w-xl mx-auto text-left text-xs grid grid-cols-2 gap-2 text-slate-200">
                    <div>
                      <span className="text-[#F9E79F] font-bold block text-[11px]">Project / Sites:</span>
                      <strong className="text-white">{selectedSites.join(", ")}</strong>
                    </div>
                    <div>
                      <span className="text-[#F9E79F] font-bold block text-[11px]">Reporting Period:</span>
                      <span className="text-white">{reportType.toUpperCase()} ({startDate} to {endDate})</span>
                    </div>
                    <div>
                      <span className="text-[#F9E79F] font-bold block text-[11px]">Prepared By:</span>
                      <span className="text-white">{preparedBy}</span>
                    </div>
                    <div>
                      <span className="text-[#F9E79F] font-bold block text-[11px]">Submitted To:</span>
                      <span className="text-white">{managementRecipient}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">
                    GMH LUXURY • 11 YEARS • BUILT BY VISION, SUSTAINED BY TRUST
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Total Scope</span>
                    <strong className="text-sm font-bold text-slate-900">{allItems.length}</strong>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-[11px] text-emerald-700 block">Completed</span>
                    <strong className="text-sm font-bold text-emerald-800">{completedItems.length}</strong>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-[11px] text-blue-700 block">In Progress</span>
                    <strong className="text-sm font-bold text-blue-800">{ongoingItems.length}</strong>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[11px] text-amber-700 block">Pending</span>
                    <strong className="text-sm font-bold text-amber-800">{pendingItems.length}</strong>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                    <span className="text-[11px] text-indigo-700 block">Completion</span>
                    <strong className="text-sm font-bold text-indigo-800">{overallPct}%</strong>
                  </div>
                </div>

                {/* If multiple sites, show Part I Consolidated Overview */}
                {selectedSites.length > 1 && (
                  <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/30 space-y-3">
                    <h3 className="font-extrabold text-sm text-indigo-950 uppercase border-b border-indigo-200 pb-1.5">
                      Part I: Consolidated Executive 5-Point Overview
                    </h3>
                    <div className="text-xs space-y-2">
                      <p>
                        <strong className="text-indigo-900">1. Progress Status:</strong> {q1}
                      </p>
                      <p>
                        <strong className="text-indigo-900">2. Programme Targets:</strong> {q2}
                      </p>
                      <p>
                        <strong className="text-rose-900">3. Variances & Reasons:</strong> {q3}
                      </p>
                      <p>
                        <strong className="text-amber-900">4. Recovery Interventions:</strong> {q4}
                      </p>
                      <p>
                        <strong className="text-purple-900">5. Management Requests:</strong> {q5}
                      </p>
                    </div>
                  </div>
                )}

                {/* Part II: Site-Categorized 5 Points */}
                <div className="space-y-6">
                  {selectedSites.map((siteName) => {
                    const sData = siteSummaries[siteName] || getDefaultSiteSummary(siteName);
                    const sMetric = siteMetricsMap[siteName];
                    const sTotal = sMetric?.total || 0;
                    const sPct = sMetric?.pct || 0;
                    const sCompleted = sMetric?.completed || [];
                    const sOngoing = sMetric?.ongoing || [];

                    return (
                      <div
                        key={siteName}
                        className="border-t-2 border-indigo-600 pt-4 space-y-3.5 text-xs"
                      >
                        <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                          <h4 className="font-black text-sm text-slate-900 uppercase">
                            SITE 5-POINT WORK SUMMARY: {siteName}
                          </h4>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {sPct}% Complete ({sCompleted.length} of {sTotal} items)
                          </span>
                        </div>

                        {/* Point 1 */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900">
                            1. Where are we on {siteName}? – Current Progress & Status
                          </h5>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {sData.q1WhereAreWe}
                          </p>
                        </div>

                        {/* Point 2 */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900">
                            2. Where should we be on {siteName}? – Planned Programme Milestones
                          </h5>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {sData.q2WhereShouldWeBe}
                          </p>
                        </div>

                        {/* Point 3 */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900">
                            3. Why is there a difference on {siteName}? – Variances, Delays & Reasons
                          </h5>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {sData.q3WhyDifference}
                          </p>
                        </div>

                        {/* Point 4 */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900">
                            4. What are we doing about it on {siteName}? – Recovery Interventions
                          </h5>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {sData.q4WhatDoingAboutIt}
                          </p>
                        </div>

                        {/* Point 5 */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900">
                            5. What do we need from Management for {siteName}? – Decisions & Approvals
                          </h5>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {sData.q5NeedFromManagement}
                          </p>
                        </div>

                        {/* Point 6: Photographic Evidence for this site alongside the report */}
                        {includePhotos && (() => {
                          const sPhotos = allPhotos.filter(
                            (p) => p.siteName === siteName && (photoState[p.id]?.selected ?? true)
                          );
                          if (sPhotos.length === 0) return null;
                          return (
                            <div className="space-y-2 pt-3 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
                                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                  6. Photographic Evidence & Visual Records for {siteName} ({sPhotos.length} Photo{sPhotos.length > 1 ? "s" : ""})
                                </h5>
                                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                                  Embedded Alongside {siteName} Report
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {sPhotos.map((photo, pIdx) => (
                                  <div
                                    key={photo.id}
                                    className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs group"
                                  >
                                    {/* Bold Header Bar */}
                                    <div className="bg-[#071D49] text-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide border-b-2 border-[#D4AF37] flex items-center justify-between">
                                      <span>PHOTO {pIdx + 1}: {photo.unitName} • {photo.floorName}</span>
                                      <span className="text-[#F9E79F]">{photo.area}</span>
                                    </div>
                                    <div
                                      onClick={() =>
                                        setPhotoPreviewModal({
                                          url: photo.photoUrl,
                                          title: `${siteName} – ${photo.unitName} (${photo.floorName})`,
                                          meta: `${photo.area} | ${photo.trade} | ${photoState[photo.id]?.description || photo.work}`,
                                        })
                                      }
                                      className="h-44 w-full bg-slate-900 rounded-none overflow-hidden cursor-pointer relative"
                                    >
                                      <img
                                        src={photo.photoUrl}
                                        alt={photo.work}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                                        <Eye className="w-4 h-4 text-[#F9E79F]" />
                                        <span>Click to Inspect Full Photo</span>
                                      </div>
                                    </div>
                                    {/* Bold Caption Area */}
                                    <div className="p-2.5 bg-slate-50 space-y-1.5 border-t border-slate-200">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="bg-indigo-100 text-indigo-900 font-extrabold px-2 py-0.5 rounded border border-indigo-200 uppercase">
                                          TRADE: {photo.trade || "GENERAL"}
                                        </span>
                                        <span
                                          className={`font-extrabold px-2 py-0.5 rounded border uppercase ${
                                            photo.status === "Completed"
                                              ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                                              : "bg-blue-100 text-blue-900 border-blue-200"
                                          }`}
                                        >
                                          STATUS: {photo.status}
                                        </span>
                                      </div>
                                      <div className="text-[11px] font-bold text-slate-900 leading-snug bg-white p-2 rounded border border-slate-200">
                                        {photoState[photo.id]?.description || photo.work}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Photos Tab - Fully Categorized by Site */
            <div className="space-y-4">
              {/* Top Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    Photographs Categorized by Site ({allPhotos.length} Available across {selectedSites.length} Sites)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Curate and caption photographic evidence for each site. Photos are organized directly alongside each site's 5-point report.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={includePhotos}
                      onChange={(e) => setIncludePhotos(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Include Photos in Document
                  </label>
                </div>
              </div>

              {/* Site Categorization Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Category:
                </span>
                <button
                  type="button"
                  onClick={() => setPhotoSiteFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    photoSiteFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>All Sites</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      photoSiteFilter === "all" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {allPhotos.length}
                  </span>
                </button>

                {selectedSites.map((sName) => {
                  const sPhotos = photosBySite[sName] || [];
                  const sIncluded = sPhotos.filter((p) => photoState[p.id]?.selected ?? true).length;
                  const isActive = photoSiteFilter === sName;
                  return (
                    <button
                      key={sName}
                      type="button"
                      onClick={() => setPhotoSiteFilter(sName)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <Building className="w-3 h-3" />
                      <span>{sName}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          isActive ? "bg-indigo-700 text-indigo-100" : "bg-indigo-50 text-indigo-700 font-semibold"
                        }`}
                      >
                        {sIncluded}/{sPhotos.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grouped or Filtered Photos Content */}
              {allPhotos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No photos uploaded for selected sites yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Upload photos on site via the camera icon in the works tracker table. They will automatically be categorized here by site alongside their 5-point report.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(photoSiteFilter === "all" ? selectedSites : [photoSiteFilter]).map((sName) => {
                    const sitePhotos = photosBySite[sName] || [];
                    const includedCount = sitePhotos.filter(
                      (p) => photoState[p.id]?.selected ?? true
                    ).length;

                    return (
                      <div
                        key={sName}
                        className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white"
                      >
                        {/* Site Category Header Banner */}
                        <div className="bg-slate-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Building className="w-4 h-4 text-indigo-400" />
                            <h4 className="font-extrabold text-sm uppercase tracking-wide">
                              Site Photographic Evidence: {sName}
                            </h4>
                            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                              {includedCount} of {sitePhotos.length} Included
                            </span>
                          </div>

                          {sitePhotos.length > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAllPhotosForSite(sName, true)}
                                className="text-xs text-indigo-300 hover:text-white font-medium hover:underline cursor-pointer"
                              >
                                Select All for {sName}
                              </button>
                              <span className="text-slate-600">|</span>
                              <button
                                type="button"
                                onClick={() => setAllPhotosForSite(sName, false)}
                                className="text-xs text-slate-400 hover:text-slate-200 font-medium hover:underline cursor-pointer"
                              >
                                Deselect All
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Photos Grid for this site */}
                        <div className="p-4">
                          {sitePhotos.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs italic">
                              No photographs recorded for site {sName} in this period.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {sitePhotos.map((photo) => {
                                const st = photoState[photo.id] || {
                                  selected: true,
                                  description: photo.description,
                                };
                                return (
                                  <div
                                    key={photo.id}
                                    className={`border rounded-xl p-3 flex flex-col gap-2.5 transition-all ${
                                      st.selected
                                        ? "border-indigo-300 bg-indigo-50/20 shadow-2xs"
                                        : "border-slate-200 opacity-60 bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                      <span className="truncate max-w-[180px] font-bold text-slate-900">
                                        {photo.unitName} ({photo.floorName})
                                      </span>
                                      <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs text-[11px]">
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

                                    {/* Thumbnail with Zoom action */}
                                    <div
                                      onClick={() =>
                                        setPhotoPreviewModal({
                                          url: photo.photoUrl,
                                          title: `${photo.siteName} – ${photo.unitName} (${photo.floorName})`,
                                          meta: `${photo.area} | ${photo.trade} | ${st.description || photo.work}`,
                                        })
                                      }
                                      className="h-44 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 relative group cursor-pointer"
                                    >
                                      <img
                                        src={photo.photoUrl}
                                        alt={photo.work}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                        <Eye className="w-4 h-4" />
                                        <span>Click to Inspect</span>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                                        <span className="truncate">Area: <strong>{photo.area}</strong></span>
                                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 text-[10px]">
                                          {photo.trade}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                          Caption in {photo.siteName} Report:
                                        </label>
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
                                          className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Download Word (.doc)
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isGeneratingDocx}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
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

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF (.pdf)
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadPptx}
              disabled={isGeneratingPptx}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPptx ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating .PPTX...
                </>
              ) : (
                <>
                  <Presentation className="w-4 h-4 text-amber-200" />
                  Download PowerPoint (.pptx)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Photo Full-size Preview Modal */}
        {photoPreviewModal && (
          <div
            onClick={() => setPhotoPreviewModal(null)}
            className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{photoPreviewModal.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{photoPreviewModal.meta}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoPreviewModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex items-center justify-center bg-black/40 overflow-auto max-h-[70vh]">
                <img
                  src={photoPreviewModal.url}
                  alt={photoPreviewModal.title}
                  className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Site Progress Visual Documentation</span>
                <button
                  type="button"
                  onClick={() => setPhotoPreviewModal(null)}
                  className="px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
