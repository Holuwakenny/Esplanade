import React, { useState, useRef } from "react";
import { X, FileDown, Image, CheckSquare, Building, FileText, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { SitesMap, WorkItem, FilterState } from "../types";
import { getSitePlans } from "../lib/plansUtils";
import { SitePlansReportSection } from "./SitePlansReportSection";
import { isItemMatchingDateFilter } from "../utils/dateUtils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sitesData: SitesMap;
  activeSiteName: string;
  filters: FilterState;
}

interface ExportItem {
  siteName: string;
  unitName: string;
  floorName: string;
  item: WorkItem;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  sitesData,
  activeSiteName,
  filters,
}) => {
  const [selectedSiteScope, setSelectedSiteScope] = useState<string>("active"); // "active" or "all"
  const [reportTitle, setReportTitle] = useState<string>(
    `${activeSiteName || "Site"} Work Tracker & Inspection Report`
  );
  const [preparedBy, setPreparedBy] = useState<string>("Site Manager / Project Supervisor");
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includePlans, setIncludePlans] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"site" | "priority" | "floor" | "trade">("site");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Determine site keys to export
  const targetSiteKeys =
    selectedSiteScope === "all"
      ? Object.keys(sitesData)
      : [activeSiteName && sitesData[activeSiteName] ? activeSiteName : Object.keys(sitesData)[0] || "Default"];

  const sitePlansData = targetSiteKeys.map((sKey) => ({
    siteName: sKey,
    plans: getSitePlans(sitesData, sKey),
  }));

  // Gather items to include
  const exportItems: ExportItem[] = [];
  let totalPhotosCount = 0;

  targetSiteKeys.forEach((sKey) => {
    const sData = sitesData[sKey] || {};
    Object.entries(sData).forEach(([unitName, unitFloors]) => {
      if (unitName.startsWith("_")) return;
      if (filters.unit !== "all" && filters.unit !== unitName) return;
      Object.entries(unitFloors).forEach(([floorName, items]) => {
        if (filters.floor !== "all" && filters.floor !== floorName) return;
        items.forEach((item) => {
          if (filters.status !== "all" && item.status !== filters.status) return;
          if (filters.trade !== "all" && item.trade !== filters.trade) return;
          if (filters.priority && filters.priority !== "all" && (item.priority || "Medium") !== filters.priority) return;

          // Date Filter check (strictly enforces date filter)
          if (
            !isItemMatchingDateFilter(
              item.updatedAt,
              filters.dateFilter,
              filters.startDate,
              filters.endDate
            )
          ) {
            return;
          }

          exportItems.push({
            siteName: sKey,
            unitName,
            floorName,
            item,
          });

          if (item.photos && item.photos.length > 0) {
            totalPhotosCount += item.photos.length;
          }
        });
      });
    });
  });

  const PRIORITY_RANK: Record<string, number> = {
    Critical: 1,
    High: 2,
    Medium: 3,
    Low: 4,
  };

  const sortedExportItems = [...exportItems].sort((a, b) => {
    if (sortBy === "site") {
      const sC = a.siteName.localeCompare(b.siteName);
      if (sC !== 0) return sC;
      const uC = a.unitName.localeCompare(b.unitName);
      if (uC !== 0) return uC;
      const fC = a.floorName.localeCompare(b.floorName);
      if (fC !== 0) return fC;
      return (a.item.area || "").localeCompare(b.item.area || "");
    } else if (sortBy === "priority") {
      const rA = PRIORITY_RANK[a.item.priority || "Medium"] || 3;
      const rB = PRIORITY_RANK[b.item.priority || "Medium"] || 3;
      if (rA !== rB) return rA - rB;
      const sC = a.siteName.localeCompare(b.siteName);
      if (sC !== 0) return sC;
    } else if (sortBy === "trade") {
      const tA = a.item.trade || "";
      const tB = b.item.trade || "";
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
    return (a.item.area || "").localeCompare(b.item.area || "");
  });

  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setIsGenerating(true);

    try {
      const container = printContainerRef.current;
      
      // Temporarily reveal container for canvas capture
      container.style.display = "block";
      
      const canvas = await html2canvas(container, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Replace any remaining oklch color declarations with sharp fallback colors
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

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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

      const fileName = `${reportTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("An error occurred while generating the PDF. Please try browser print instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-auto overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-400/30">
              <FileDown className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Export PDF Report with Pictures</h3>
              <p className="text-xs text-slate-400">Generate formatted document with captioned photos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Summary Preview Banner */}
          <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase text-indigo-700 tracking-wider">Report Scope</span>
              <p className="font-bold text-slate-900 text-base">
                {exportItems.length} Work Items Found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white text-indigo-800 font-bold text-xs rounded-lg border border-indigo-200 shadow-2xs flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-indigo-600" />
                {totalPhotosCount} Photos
              </span>
            </div>
          </div>

          {/* Form Options */}
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prepared By</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Category Scope</label>
                <select
                  value={selectedSiteScope}
                  onChange={(e) => setSelectedSiteScope(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs font-semibold focus:outline-none"
                >
                  <option value="active">Active Site Only ({activeSiteName})</option>
                  <option value="all">All Sites & Projects</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Sorting Order in PDF</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "site" | "priority" | "floor" | "trade")}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs font-semibold focus:outline-none"
                >
                  <option value="site">🏗️ Construction Site (A → Z)</option>
                  <option value="priority">⚡ Priority (Critical & High First)</option>
                  <option value="floor">🏢 Floor & Area Location</option>
                  <option value="trade">🛠️ Trade / Artisan Group</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-800">Included Content Options</label>
              
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  Include Photo Gallery Section with Captions ({totalPhotosCount} pictures)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  Include Work Item Comments & Technical Notes
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePlans}
                  onChange={(e) => setIncludePlans(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  Include Site Action Plans, Issues & Challenges
                </span>
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating || exportItems.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGenerating ? "Generating PDF..." : "Download PDF Document"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Printable HTML Container for Html2Canvas Capture */}
      <div className="fixed top-0 left-[-9999px] pointer-events-none opacity-0">
        <div
          ref={printContainerRef}
          style={{ width: "850px", padding: "36px", backgroundColor: "#ffffff", fontFamily: "sans-serif", lineHeight: "1.5" }}
          className="bg-white text-black space-y-6"
        >
          <div style={{ borderBottom: "2px solid #000000", paddingBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#000000", margin: 0, textTransform: "uppercase", letterSpacing: "-0.5px", lineHeight: "1.3" }}>{reportTitle}</h1>
              <p style={{ fontSize: "12px", color: "#000000", marginTop: "6px" }}>
                PREPARED BY: <strong style={{ color: "#000000" }}>{preparedBy || "Site Coordinator"}</strong> | DATE: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ padding: "6px 12px", backgroundColor: "#000000", color: "#ffffff", fontWeight: "bold", fontSize: "11px", borderRadius: "4px", letterSpacing: "0.5px" }}>
                OFFICIAL REPORT
              </span>
            </div>
          </div>

          {/* PDF Work Items Table */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#000000", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Work Items & Progress Status ({exportItems.length})
            </h2>
            <table style={{ width: "100%", textAlign: "left", fontSize: "12px", lineHeight: "1.5", borderCollapse: "collapse", border: "1px solid #000000" }}>
              <thead>
                <tr style={{ backgroundColor: "#000000", color: "#ffffff", fontWeight: "bold", fontSize: "12px" }}>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000", width: "35px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000" }}>Area / Location</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000" }}>Outstanding Work</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000" }}>Trade</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000" }}>Unit / Floor</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000" }}>Priority</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #000000" }}>Status</th>
                  {includeNotes && <th style={{ padding: "8px 10px", border: "1px solid #000000" }}>Comments / Notes</th>}
                </tr>
              </thead>
              <tbody>
                {sortedExportItems.map((row, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc", color: "#000000" }}>
                    <td style={{ padding: "8px 10px", border: "1px solid #000000", textAlign: "center", fontWeight: "bold", color: "#000000" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "bold", color: "#000000" }}>{row.item.area}</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #000000", color: "#000000", fontWeight: "500" }}>{row.item.work}</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #000000", color: "#000000" }}>{row.item.trade}</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "bold", color: "#000000" }}>
                      {row.unitName} - {row.floorName}
                    </td>
                    <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "bold", color: "#000000" }}>{row.item.priority || "Medium"}</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #000000", fontWeight: "bold", color: "#000000" }}>{row.item.status}</td>
                    {includeNotes && (
                      <td style={{ padding: "8px 10px", border: "1px solid #000000", fontStyle: "italic", color: "#000000" }}>
                        {row.item.notes || "-"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Plans & Issues Section */}
          {includePlans && (
            <SitePlansReportSection sitePlansData={sitePlansData} isPdfStyle={true} />
          )}

          {/* Photo Gallery & Image Captions Section */}
          {includePhotos && totalPhotosCount > 0 && (
            <div className="pt-4 border-t border-black">
              <h2 className="text-sm font-bold text-black mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Image className="w-4 h-4 text-black" />
                Attached Photo Records & Image Captions ({totalPhotosCount})
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {exportItems.map((row) =>
                  (row.item.photos || []).map((photoUrl, pIdx) => (
                    <div
                      key={`${row.item.id}-${pIdx}`}
                      className="border border-black rounded-lg p-3 bg-white space-y-2 break-inside-avoid"
                    >
                      <div className="h-48 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-black">
                        <img
                          src={photoUrl}
                          alt={`Evidence Photo ${pIdx + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="text-xs space-y-1.5 bg-white p-2.5 rounded border border-black leading-normal">
                        <div className="font-bold text-black flex justify-between">
                          <span>Photo #{pIdx + 1}: {row.siteName}</span>
                          <span className="text-black font-semibold">{row.unitName} • {row.floorName}</span>
                        </div>
                        <div className="text-black font-semibold">
                          Area: <span className="text-black font-bold">{row.item.area}</span> | Trade: <span className="text-black font-bold">{row.item.trade}</span>
                        </div>
                        <div className="text-black font-medium">
                          Work: {row.item.work}
                        </div>
                        {row.item.notes && (
                          <div className="text-black italic bg-slate-50 p-1.5 rounded border border-black text-xs">
                            Caption/Notes: "{row.item.notes}"
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
          <div className="pt-6 border-t border-black mt-6">
            <div className="w-72">
              <p className="text-sm font-bold text-black uppercase mb-8">PREPARED BY: {preparedBy || "Site Coordinator"}</p>
              <div className="border-b border-black w-full mb-2"></div>
              <p className="text-xs text-black font-medium">Signature & Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
