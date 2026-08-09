import React, { useState } from "react";
import { X, Building, Plus, Trash2, Edit3, Check, FolderPlus, CheckCircle2, Layers } from "lucide-react";
import { SitesMap, WorkItem, SiteTrackerData } from "../types";
import { createEsplanade6Template, createEGC3Template, createCustomSiteTemplate } from "../utils/siteTemplates";

interface ManageSitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SitesMap;
  currentSite: string;
  onSelectSite: (siteName: string) => void;
  onAddSite: (siteName: string, initialData?: SiteTrackerData) => void;
  onRenameSite: (oldName: string, newName: string) => void;
  onDeleteSite: (siteName: string) => void;
}

export const ManageSitesModal: React.FC<ManageSitesModalProps> = ({
  isOpen,
  onClose,
  sites,
  currentSite,
  onSelectSite,
  onAddSite,
  onRenameSite,
  onDeleteSite,
}) => {
  const [newSiteName, setNewSiteName] = useState("");
  const [templateType, setTemplateType] = useState<"esplanade6" | "egc3" | "custom" | "blank">("esplanade6");
  const [customUnits, setCustomUnits] = useState<number>(4);
  const [customFloors, setCustomFloors] = useState<number>(3);
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!isOpen) return null;

  const siteNames = Object.keys(sites);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSiteName.trim();
    if (!trimmed) return;
    if (sites[trimmed]) {
      alert(`A site named "${trimmed}" already exists.`);
      return;
    }

    let initialData: SiteTrackerData;
    if (templateType === "esplanade6") {
      initialData = createEsplanade6Template();
    } else if (templateType === "egc3") {
      initialData = createEGC3Template();
    } else if (templateType === "custom") {
      initialData = createCustomSiteTemplate(customUnits, customFloors);
    } else {
      initialData = {
        "Unit 1": {
          "Ground Floor": [],
          "General / All Floors": [],
        },
      };
    }

    onAddSite(trimmed, initialData);
    setNewSiteName("");
  };

  const startRename = (site: string) => {
    setEditingSite(site);
    setEditingName(site);
  };

  const saveRename = (oldName: string) => {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== oldName) {
      if (sites[trimmed]) {
        alert(`A site named "${trimmed}" already exists.`);
        return;
      }
      onRenameSite(oldName, trimmed);
    }
    setEditingSite(null);
  };

  const handleDelete = (site: string) => {
    if (siteNames.length <= 1) {
      alert("You must have at least one active site.");
      return;
    }

    // Calculate total works in site
    let totalWorks = 0;
    const siteData = sites[site] || {};
    Object.values(siteData).forEach((unit) => {
      (Object.values(unit) as WorkItem[][]).forEach((items) => {
        totalWorks += items.length;
      });
    });

    if (confirm(`Are you sure you want to delete "${site}" and its ${totalWorks} outstanding works?`)) {
      onDeleteSite(site);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Building className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Construction Sites & Projects</h3>
              <p className="text-xs text-slate-400">Switch between sites or add new project locations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Create New Site Form */}
          <form onSubmit={handleCreateSubmit} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <FolderPlus className="w-4 h-4 text-indigo-600" />
              Add New Construction Site / Project
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="e.g. Esplanade 6, EGC3, Lekki Horizon, Royal Gardens"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Site</span>
              </button>
            </div>

            {/* Template selector */}
            <div className="space-y-2 pt-1 border-t border-indigo-100/80">
              <label className="block text-xs font-bold text-slate-700">Initial Project Structure Template:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateType("esplanade6")}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    templateType === "esplanade6"
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold">Esplanade 6</span>
                  <span className={`text-[10px] ${templateType === "esplanade6" ? "text-indigo-100" : "text-slate-400"}`}>
                    6 Units × 3 Floors
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType("egc3")}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    templateType === "egc3"
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold">EGC3</span>
                  <span className={`text-[10px] ${templateType === "egc3" ? "text-indigo-100" : "text-slate-400"}`}>
                    4 Units × 8 Floors
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType("custom")}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    templateType === "custom"
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold">Custom Setup</span>
                  <span className={`text-[10px] ${templateType === "custom" ? "text-indigo-100" : "text-slate-400"}`}>
                    Custom Units & Floors
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType("blank")}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    templateType === "blank"
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold">Manual / Blank</span>
                  <span className={`text-[10px] ${templateType === "blank" ? "text-indigo-100" : "text-slate-400"}`}>
                    Empty Template
                  </span>
                </button>
              </div>

              {/* Custom Units & Floors Inputs if Custom selected */}
              {templateType === "custom" && (
                <div className="flex items-center gap-3 pt-2 text-xs bg-white p-2.5 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Units:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={customUnits}
                      onChange={(e) => setCustomUnits(parseInt(e.target.value) || 1)}
                      className="w-16 p-1 border border-slate-300 rounded text-slate-900 font-bold text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Floors per Unit:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={customFloors}
                      onChange={(e) => setCustomFloors(parseInt(e.target.value) || 1)}
                      className="w-16 p-1 border border-slate-300 rounded text-slate-900 font-bold text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Sites Directory */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">
              All Sites Directory ({siteNames.length})
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {siteNames.map((site) => {
                const isSelected = site === currentSite;
                const siteData = sites[site] || {};
                const unitsList = Object.keys(siteData);
                let totalWorks = 0;
                let completedWorks = 0;

                Object.values(siteData).forEach((unit) => {
                  (Object.values(unit) as WorkItem[][]).forEach((items) => {
                    totalWorks += items.length;
                    items.forEach((item) => {
                      if (item.status === "Completed") completedWorks++;
                    });
                  });
                });

                const pct = totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0;
                const isEditing = editingSite === site;

                return (
                  <div
                    key={site}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200"
                        : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 max-w-sm">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="p-1 text-sm border border-indigo-400 rounded bg-indigo-50/50 font-bold focus:outline-none w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(site)}
                            className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Save site name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-base">{site}</h5>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                              Active Site
                            </span>
                          )}
                          <button
                            onClick={() => startRename(site)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Rename site"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {unitsList.length} Units
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {completedWorks}/{totalWorks} Completed ({pct}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isSelected && (
                        <button
                          onClick={() => {
                            onSelectSite(site);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          Switch To Site
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(site)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete site"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
