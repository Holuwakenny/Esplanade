import React, { useState, useRef } from "react";
import { X, Calendar, FileText, Printer, Clock, Building, PieChart, Download, Image as ImageIcon, Sparkles } from "lucide-react";
import { SitesMap, WorkItem } from "../types";
import { getSitePlans } from "../lib/plansUtils";
import { SitePlansReportSection } from "./SitePlansReportSection";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SitesMap;
  currentSite: string;
  onOpenExecutiveSummary?: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  sites,
  currentSite: initialSite,
  onOpenExecutiveSummary,
}) => {
  const siteNames = Object.keys(sites);
  const [selectedSites, setSelectedSites] = useState<string[]>(
    initialSite && sites[initialSite] && initialSite !== "all" ? [initialSite] : siteNames
  );
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [preparedBy, setPreparedBy] = useState<string>("Kehinde Fadogba(Arc.) / Site Coordinator");
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includePlans, setIncludePlans] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"site" | "priority" | "floor" | "trade">("site");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const reportPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const toggleSiteSelection = (sName: string) => {
    if (selectedSites.includes(sName)) {
      if (selectedSites.length === 1) return; // Keep at least one
      setSelectedSites(selectedSites.filter((s) => s !== sName));
    } else {
      setSelectedSites([...selectedSites, sName]);
    }
  };

  const selectAllSites = () => setSelectedSites([...siteNames]);
  const deselectAllSites = () => {
    if (siteNames.length > 0) setSelectedSites([siteNames[0]]);
  };

  // Helper to determine if an item matches the chosen report timeframe
  const isItemInPeriod = (updatedAt?: string) => {
    if (!updatedAt) return true;
    const itemDate = new Date(updatedAt);
    if (isNaN(itemDate.getTime())) return true;

    if (!selectedDate) return true;
    const parts = selectedDate.split("-");
    if (parts.length < 3) return true;

    const targetYear = parseInt(parts[0], 10);
    const targetMonth = parseInt(parts[1], 10) - 1; // 0-indexed month
    const targetDay = parseInt(parts[2], 10);

    const itemY = itemDate.getFullYear();
    const itemM = itemDate.getMonth();
    const itemD = itemDate.getDate();

    if (reportPeriod === "daily") {
      return itemY === targetYear && itemM === targetMonth && itemD === targetDay;
    } else if (reportPeriod === "weekly") {
      const targetEnd = new Date(targetYear, targetMonth, targetDay, 23, 59, 59, 999);
      const startMs = targetEnd.getTime() - (7 * 24 * 60 * 60 * 1000);
      return itemDate.getTime() >= startMs && itemDate.getTime() <= targetEnd.getTime();
    } else if (reportPeriod === "monthly") {
      return itemY === targetYear && itemM === targetMonth;
    }
    return true;
  };

  // Collect data based on multi-site selection
  const relevantSites = selectedSites.length > 0 ? selectedSites : siteNames;

  interface ItemWithMeta extends WorkItem {
    siteName: string;
    unitName: string;
    floorName: string;
  }

  const allFilteredItems: ItemWithMeta[] = [];
  const tradeStats: { [trade: string]: { total: number; completed: number; pending: number } } = {};
  let totalWorks = 0;
  let completedWorks = 0;
  let pendingWorks = 0;
  let inProgressWorks = 0;

  relevantSites.forEach((siteName) => {
    const siteObj = sites[siteName] || {};
    Object.entries(siteObj).forEach(([unitName, unitData]) => {
      if (unitName.startsWith("_")) return;
      Object.entries(unitData).forEach(([floorName, items]) => {
        (items as WorkItem[]).forEach((item) => {
          // Strictly filter metrics and breakdowns by chosen report date period
          if (isItemInPeriod(item.updatedAt)) {
            totalWorks++;
            if (item.status === "Completed") completedWorks++;
            else if (item.status === "In Progress") inProgressWorks++;
            else pendingWorks++;

            const trade = item.trade || "General";
            if (!tradeStats[trade]) {
              tradeStats[trade] = { total: 0, completed: 0, pending: 0 };
            }
            tradeStats[trade].total++;
            if (item.status === "Completed") tradeStats[trade].completed++;
            else tradeStats[trade].pending++;

            allFilteredItems.push({
              ...item,
              siteName,
              unitName,
              floorName,
            });
          }
        });
      });
    });
  });

  const completionPct = totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0;

  const PRIORITY_RANK: Record<string, number> = {
    Critical: 1,
    High: 2,
    Medium: 3,
    Low: 4,
  };

  const sortedFilteredItems = [...allFilteredItems].sort((a, b) => {
    if (sortBy === "site") {
      const sC = a.siteName.localeCompare(b.siteName);
      if (sC !== 0) return sC;
      const uC = a.unitName.localeCompare(b.unitName);
      if (uC !== 0) return uC;
      const fC = a.floorName.localeCompare(b.floorName);
      if (fC !== 0) return fC;
      return (a.area || "").localeCompare(b.area || "");
    } else if (sortBy === "priority") {
      const rA = PRIORITY_RANK[a.priority || "Medium"] || 3;
      const rB = PRIORITY_RANK[b.priority || "Medium"] || 3;
      if (rA !== rB) return rA - rB;
      const sC = a.siteName.localeCompare(b.siteName);
      if (sC !== 0) return sC;
    } else if (sortBy === "trade") {
      const tA = a.trade || "";
      const tB = b.trade || "";
      if (tA !== tB) return tA.localeCompare(tB);
      const sC = a.siteName.localeCompare(b.siteName);
      if (sC !== 0) return sC;
    }
    const sC = a.siteName.localeCompare(b.siteName);
    if (sC !== 0) return sC;
    const uC = a.unitName.localeCompare(b.unitName);
    if (uC !== 0) return uC;
    const fC = a.floorName.localeCompare(b.floorName);
    if (fC !== 0) return fC;
    return (a.area || "").localeCompare(b.area || "");
  });

  const totalPhotosCount = sortedFilteredItems.reduce((acc, item) => {
    return acc + (item.photos ? item.photos.length : 0);
  }, 0);

  const sitePlansData = relevantSites.map((siteName) => ({
    siteName,
    plans: getSitePlans(sites, siteName),
  }));

  const totalActionPlansCount = sitePlansData.reduce((acc, item) => {
    const p = item.plans;
    return (
      acc +
      (p.issuesAndChallenges?.length || 0) +
      (p.nextDayPlan?.length || 0) +
      (p.weeklyPlan?.length || 0) +
      (p.monthlyPlan?.length || 0)
    );
  }, 0);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!reportPrintRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const container = reportPrintRef.current;
      container.style.display = "block";

      const canvas = await html2canvas(container, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((style) => {
            if (style.textContent && style.textContent.includes("oklch")) {
              style.textContent = style.textContent.replace(/oklch\([^)]+\)/gi, "#000000");
            }
          });

          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes("oklch")) {
              htmlEl.style.cssText = htmlEl.style.cssText.replace(/oklch\([^)]+\)/gi, "#000000");
            }
          });
        },
      });

      container.style.display = "none";

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${selectedSites.length === siteNames.length ? "All_Sites" : selectedSites.join("_")}_${reportPeriod.toUpperCase()}_Report_${selectedDate}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("Report PDF export failed:", err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in duration-150 max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Header - Hidden in Print */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Daily & Weekly Progress Reports</h3>
              <p className="text-xs text-slate-400">Generate executive close-out reports by site & date period</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenExecutiveSummary && (
              <button
                type="button"
                onClick={onOpenExecutiveSummary}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                title="Generate 5-Point Word Summary Document"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Word (.docx) Summary</span>
              </button>
            )}
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? "PDF..." : "Export PDF"}</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Site Selector Chips Bar */}
        <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 print:hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              Multiple Sites Filter ({selectedSites.length} of {siteNames.length} selected):
            </span>
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
          <div className="flex flex-wrap gap-1.5">
            {siteNames.map((s) => {
              const isChecked = selectedSites.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSiteSelection(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isChecked
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isChecked ? "bg-white" : "bg-slate-300"}`} />
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Bar - Hidden in Print */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3 shrink-0 text-xs print:hidden items-end">
          {/* Sort Order Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              Sort Items By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "site" | "priority" | "floor" | "trade")}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="site">🏗️ Construction Site (A → Z)</option>
              <option value="priority">⚡ Priority (High → Low)</option>
              <option value="floor">🏢 Floor & Area</option>
              <option value="trade">🛠️ Trade / Artisan</option>
            </select>
          </div>

          {/* Prepared By Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              Prepared By:
            </label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="e.g. Eng. Kehinde"
              className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
            />
          </div>

          {/* Report Timeframe */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Report Period:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-white p-1 border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setReportPeriod("daily")}
                className={`py-1 rounded font-bold transition-all cursor-pointer ${
                  reportPeriod === "daily"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod("weekly")}
                className={`py-1 rounded font-bold transition-all cursor-pointer ${
                  reportPeriod === "weekly"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod("monthly")}
                className={`py-1 rounded font-bold transition-all cursor-pointer ${
                  reportPeriod === "monthly"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Reference Date Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Reference Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Include Photos & Plans Checkbox */}
          <div className="flex items-center h-10 gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 bg-white p-2 border border-slate-200 rounded-lg w-1/2 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-xs">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                Photos ({totalPhotosCount})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 bg-white p-2 border border-slate-200 rounded-lg w-1/2 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={includePlans}
                onChange={(e) => setIncludePlans(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Plans ({totalActionPlansCount})
              </span>
            </label>
          </div>
        </div>

        {/* Printable Report Content Body */}
        <div id="printable-report-doc" className="p-6 overflow-y-auto space-y-6 text-sm print:p-0 print:overflow-visible">
          {/* Printable Report Title Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Site Coordination & Close-Out
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {reportPeriod.toUpperCase()} SITE PROGRESS REPORT
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Project Site: <strong className="text-slate-900">{selectedSites.length === siteNames.length ? "All Active Sites" : selectedSites.join(", ")}</strong> · Report Date: <strong className="text-slate-900">{selectedDate}</strong>
              </p>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-800">STATUS: OFFICIAL</p>
              <p>Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block">Total Scope Works</span>
              <span className="text-2xl font-black text-slate-900">{totalWorks}</span>
            </div>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
              <span className="text-xs font-semibold text-emerald-700 block">Completed</span>
              <span className="text-2xl font-black text-emerald-800">{completedWorks}</span>
            </div>

            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
              <span className="text-xs font-semibold text-amber-700 block">In Progress</span>
              <span className="text-2xl font-black text-amber-800">{inProgressWorks}</span>
            </div>

            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80">
              <span className="text-xs font-semibold text-indigo-700 block">Overall Progress</span>
              <span className="text-2xl font-black text-indigo-800">{completionPct}%</span>
            </div>

            <div className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 block">Photos Attached</span>
              <span className="text-2xl font-black text-indigo-900">📷 {totalPhotosCount}</span>
            </div>
          </div>

          {/* Trade Progress Summary Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Trade & Artisan Completion Breakdown
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="p-3">Trade / Artisan</th>
                    <th className="p-3 text-center">Total Tasks</th>
                    <th className="p-3 text-center">Completed</th>
                    <th className="p-3 text-center">Outstanding</th>
                    <th className="p-3 text-right">% Complete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {Object.entries(tradeStats).map(([trade, stat]) => {
                    const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                    return (
                      <tr key={trade} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{trade}</td>
                        <td className="p-3 text-center font-semibold text-slate-700">{stat.total}</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{stat.completed}</td>
                        <td className="p-3 text-center font-medium text-amber-700">{stat.pending}</td>
                        <td className="p-3 text-right font-black text-indigo-600">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Outstanding / Updated Work Items List */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              Recent Outstanding Works Log ({allFilteredItems.length})
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Site / Unit</th>
                    <th className="p-3">Floor & Area</th>
                    <th className="p-3">Outstanding Work</th>
                    <th className="p-3">Trade</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Photos</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sortedFilteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                        No work items recorded for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    sortedFilteredItems.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {item.siteName} · {item.unitName}
                        </td>
                        <td className="p-3 text-slate-700">
                          {item.floorName} ({item.area})
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{item.work}</td>
                        <td className="p-3 text-slate-600">{item.trade}</td>
                        <td className="p-3 font-bold text-amber-700">{item.priority || "Medium"}</td>
                        <td className="p-3">
                          {item.photos && item.photos.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              📷 {item.photos.length} Photo{item.photos.length === 1 ? "" : "s"}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2.5 py-1 rounded font-bold text-xs ${
                              item.status === "Completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "In Progress"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Site Action Plans & Issues Section */}
          {includePlans && (
            <SitePlansReportSection sitePlansData={sitePlansData} />
          )}

          {/* Photo Records Gallery Section */}
          {includePhotos && totalPhotosCount > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Attached Photo Records & Evidence Gallery ({totalPhotosCount})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allFilteredItems.map((item) =>
                  (item.photos || []).map((photoUrl, pIdx) => (
                    <div
                      key={`${item.id}-${pIdx}`}
                      className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs space-y-2"
                    >
                      <div className="h-44 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                        <img
                          src={photoUrl}
                          alt={`Evidence Photo ${pIdx + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="text-xs space-y-1 text-slate-800">
                        <div className="font-bold text-indigo-900 flex justify-between items-center">
                          <span>Photo #{pIdx + 1}: {item.siteName}</span>
                          <span className="text-slate-500 font-normal">{item.unitName} • {item.floorName}</span>
                        </div>
                        <div className="font-semibold text-slate-700">
                          Area: <span className="text-slate-900 font-bold">{item.area}</span> | Trade: <span className="text-slate-900 font-bold">{item.trade}</span>
                        </div>
                        <p className="text-slate-800 font-medium">Work: {item.work}</p>
                        {item.notes && (
                          <p className="text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px]">
                            Notes: "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sign-Off Signature Block for Print Reports */}
          <div className="pt-6 border-t border-slate-200 text-xs sm:text-sm text-slate-600">
            <div className="max-w-xs">
              <p className="font-bold text-slate-800 mb-6 uppercase">PREPARED BY: {preparedBy || "Site Coordinator"}</p>
              <div className="border-b border-slate-400 w-full mb-1"></div>
              <p className="text-xs text-slate-500">Signature & Date</p>
            </div>
          </div>
        </div>

        {/* Footer Actions - Hidden in Print */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <span className="text-xs text-slate-500">
            Export or print the active site's filtered report with full work logs & photo counts.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Generate and download high-resolution PDF report document"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? "Generating PDF..." : "Export PDF Document"}</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print View</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Printable Container for html2canvas Capture */}
      <div className="fixed top-0 left-[-9999px] pointer-events-none opacity-0">
        <div
          ref={reportPrintRef}
          style={{ width: "850px", padding: "36px", backgroundColor: "#ffffff", fontFamily: "sans-serif", color: "#000000", lineHeight: "1.5" }}
          className="bg-white text-black space-y-6"
        >
          {/* Header */}
          <div style={{ borderBottom: "2px solid #000000", paddingBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#000000", textTransform: "uppercase", letterSpacing: "1px" }}>
                SITE COORDINATION & CLOSE-OUT REPORT
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#000000", margin: "4px 0 0 0", textTransform: "uppercase", lineHeight: "1.3" }}>
                {selectedSites.length === siteNames.length ? "ALL ACTIVE SITES" : selectedSites.join(", ")} - {reportPeriod.toUpperCase()} PROGRESS
              </h1>
              <p style={{ fontSize: "12px", color: "#000000", marginTop: "6px" }}>
                PREPARED BY: <strong style={{ color: "#000000" }}>{preparedBy || "Site Coordinator"}</strong> | REPORT DATE: <strong style={{ color: "#000000" }}>{selectedDate}</strong>
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#000000" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>STATUS: OFFICIAL RECORD</p>
              <p style={{ margin: "2px 0 0 0" }}>Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
            <div style={{ border: "1px solid #000000", padding: "10px", borderRadius: "6px", backgroundColor: "#ffffff" }}>
              <div style={{ fontSize: "10px", color: "#000000", fontWeight: "bold", textTransform: "uppercase" }}>Scope Works</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#000000", marginTop: "2px" }}>{totalWorks}</div>
            </div>
            <div style={{ border: "1px solid #000000", padding: "10px", borderRadius: "6px", backgroundColor: "#ffffff" }}>
              <div style={{ fontSize: "10px", color: "#000000", fontWeight: "bold", textTransform: "uppercase" }}>Completed</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#000000", marginTop: "2px" }}>{completedWorks}</div>
            </div>
            <div style={{ border: "1px solid #000000", padding: "10px", borderRadius: "6px", backgroundColor: "#ffffff" }}>
              <div style={{ fontSize: "10px", color: "#000000", fontWeight: "bold", textTransform: "uppercase" }}>In Progress</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#000000", marginTop: "2px" }}>{inProgressWorks}</div>
            </div>
            <div style={{ border: "1px solid #000000", padding: "10px", borderRadius: "6px", backgroundColor: "#ffffff" }}>
              <div style={{ fontSize: "10px", color: "#000000", fontWeight: "bold", textTransform: "uppercase" }}>Progress %</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#000000", marginTop: "2px" }}>{completionPct}%</div>
            </div>
            <div style={{ border: "1px solid #000000", padding: "10px", borderRadius: "6px", backgroundColor: "#ffffff" }}>
              <div style={{ fontSize: "10px", color: "#000000", fontWeight: "bold", textTransform: "uppercase" }}>Photos</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#000000", marginTop: "2px" }}>{totalPhotosCount}</div>
            </div>
          </div>

          {/* Trade Breakdown */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#000000", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Trade & Artisan Completion Breakdown
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", lineHeight: "1.5", border: "1px solid #000000" }}>
              <thead>
                <tr style={{ backgroundColor: "#000000", color: "#ffffff", fontWeight: "bold", fontSize: "12px" }}>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "left" }}>Trade / Artisan</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center" }}>Total Tasks</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center" }}>Completed</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center" }}>Outstanding</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "right" }}>% Complete</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tradeStats).map(([trade, stat], i) => {
                  const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                  return (
                    <tr key={trade} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc", color: "#000000" }}>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "bold" }}>{trade}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center" }}>{stat.total}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center", fontWeight: "bold" }}>{stat.completed}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center" }}>{stat.pending}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "right", fontWeight: "bold" }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Work Log Table */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#000000", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Detailed Work Items & Progress Log ({allFilteredItems.length})
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", lineHeight: "1.5", border: "1px solid #000000" }}>
              <thead>
                <tr style={{ backgroundColor: "#000000", color: "#ffffff", fontWeight: "bold", fontSize: "12px" }}>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "left" }}>Site / Unit</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "left" }}>Floor & Area</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "left" }}>Outstanding Work</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "left" }}>Trade</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "left" }}>Priority</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center" }}>Photos</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "12px", textAlign: "center", color: "#000000", fontStyle: "italic" }}>
                      No work items recorded for this timeframe.
                    </td>
                  </tr>
                ) : (
                  sortedFilteredItems.map((item, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc", color: "#000000" }}>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "bold" }}>{item.siteName} · {item.unitName}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000" }}>{item.floorName} ({item.area})</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "600" }}>{item.work}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000" }}>{item.trade}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "bold" }}>{item.priority || "Medium"}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center" }}>
                        {item.photos && item.photos.length > 0 ? `${item.photos.length} Photo(s)` : "-"}
                      </td>
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "right", fontWeight: "bold" }}>{item.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Action Plans & Issues Section in PDF */}
          {includePlans && (
            <SitePlansReportSection sitePlansData={sitePlansData} isPdfStyle={true} />
          )}

          {/* Photo Gallery & Image Captions Section in PDF */}
          {includePhotos && totalPhotosCount > 0 && (
            <div style={{ paddingTop: "16px", borderTop: "2px solid #000000", marginTop: "20px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#000000", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Attached Photo Records & Image Captions ({totalPhotosCount})
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                {allFilteredItems.map((item) =>
                  (item.photos || []).map((photoUrl, pIdx) => (
                    <div
                      key={`${item.id}-${pIdx}`}
                      style={{
                        border: "1px solid #000000",
                        borderRadius: "6px",
                        padding: "12px",
                        backgroundColor: "#ffffff",
                        pageBreakInside: "avoid"
                      }}
                    >
                      <div style={{ height: "180px", backgroundColor: "#f8fafc", borderRadius: "4px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #000000", marginBottom: "10px" }}>
                        <img
                          src={photoUrl}
                          alt={`Evidence Photo ${pIdx + 1}`}
                          style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                        />
                      </div>
                      <div style={{ fontSize: "11px", lineHeight: "1.4", color: "#000000" }}>
                        <div style={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span>Photo #{pIdx + 1}: {item.siteName}</span>
                          <span style={{ fontWeight: "600" }}>{item.unitName} • {item.floorName}</span>
                        </div>
                        <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                          Area: <span style={{ fontWeight: "bold" }}>{item.area}</span> | Trade: <span style={{ fontWeight: "bold" }}>{item.trade}</span>
                        </div>
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                          Work: {item.work}
                        </div>
                        {item.notes && (
                          <div style={{ fontStyle: "italic", backgroundColor: "#f8fafc", padding: "6px", border: "1px solid #000000", borderRadius: "4px", marginTop: "4px" }}>
                            Caption/Notes: "{item.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Signature Block */}
          <div style={{ paddingTop: "24px", borderTop: "1px solid #000000", marginTop: "24px" }}>
            <div style={{ width: "280px" }}>
              <p style={{ fontSize: "13px", fontWeight: "bold", color: "#000000", textTransform: "uppercase", marginBottom: "30px" }}>
                PREPARED BY: {preparedBy || "Site Coordinator"}
              </p>
              <div style={{ borderBottom: "1px solid #000000", width: "100%", marginBottom: "6px" }}></div>
              <p style={{ fontSize: "11px", color: "#000000", fontWeight: "500" }}>Signature & Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
