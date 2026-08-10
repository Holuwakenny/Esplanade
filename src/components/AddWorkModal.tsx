import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Building, Layers } from "lucide-react";
import { WorkStatus, WorkPriority, SitesMap } from "../types";

interface AddWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SitesMap;
  currentSite: string;
  trades: string[];
  onAdd: (
    siteName: string,
    unit: string,
    floor: string,
    area: string,
    work: string,
    trade: string,
    status: WorkStatus,
    priority: WorkPriority,
    notes: string
  ) => void;
}

export const AddWorkModal: React.FC<AddWorkModalProps> = ({
  isOpen,
  onClose,
  sites,
  currentSite,
  trades,
  onAdd,
}) => {
  const siteList = Object.keys(sites);
  const [selectedSite, setSelectedSite] = useState<string>(
    currentSite || siteList[0] || "Esplanade 6"
  );
  const [customSite, setCustomSite] = useState("");

  const siteData = sites[selectedSite] || {};
  const availableUnits = Object.keys(siteData);

  const [unit, setUnit] = useState<string>(availableUnits[0] || "Unit 1");
  const [customUnit, setCustomUnit] = useState("");

  const unitFloors =
    siteData[unit] && Object.keys(siteData[unit]).length > 0
      ? Object.keys(siteData[unit])
      : ["Ground Floor", "First Floor", "Second Floor", "General"];

  const [floor, setFloor] = useState<string>(unitFloors[0] || "Ground Floor");
  const [customFloor, setCustomFloor] = useState("");

  const [area, setArea] = useState("");
  const [work, setWork] = useState("");
  const [trade, setTrade] = useState("Tiler");
  const [customTrade, setCustomTrade] = useState("");
  const [status, setStatus] = useState<WorkStatus>("Pending");
  const [priority, setPriority] = useState<WorkPriority>("Medium");
  const [notes, setNotes] = useState("");

  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      const initialSite = currentSite && sites[currentSite] ? currentSite : siteList[0] || "Esplanade 6";
      setSelectedSite(initialSite);
      const units = Object.keys(sites[initialSite] || {});
      const initialUnit = units[0] || "Unit 1";
      setUnit(initialUnit);

      const floors = sites[initialSite]?.[initialUnit]
        ? Object.keys(sites[initialSite][initialUnit])
        : ["Ground Floor", "First Floor", "Second Floor", "General"];
      setFloor(floors[0] || "Ground Floor");
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, currentSite]);

  if (!isOpen) return null;

  const handleSiteChange = (newSite: string) => {
    setSelectedSite(newSite);
    if (newSite !== "ADD_NEW_SITE") {
      const newSiteUnits = Object.keys(sites[newSite] || {});
      const firstUnit = newSiteUnits[0] || "Unit 1";
      setUnit(firstUnit);

      const firstUnitFloors = sites[newSite]?.[firstUnit]
        ? Object.keys(sites[newSite][firstUnit])
        : ["Ground Floor", "First Floor", "Second Floor", "General"];
      setFloor(firstUnitFloors[0] || "Ground Floor");
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    if (newUnit !== "ADD_NEW_UNIT") {
      const uFloors = sites[selectedSite]?.[newUnit]
        ? Object.keys(sites[selectedSite][newUnit])
        : ["Ground Floor", "First Floor", "Second Floor", "General"];
      setFloor(uFloors[0] || "Ground Floor");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSite = selectedSite === "ADD_NEW_SITE" ? customSite.trim() : selectedSite;
    const finalUnit = unit === "ADD_NEW_UNIT" ? customUnit.trim() : unit;
    const finalFloor = floor === "ADD_NEW_FLOOR" ? customFloor.trim() : floor;
    const finalTrade = trade === "Other" ? customTrade || "General" : trade;

    if (!finalSite || !finalUnit || !finalFloor || !area.trim() || !work.trim()) return;

    onAdd(
      finalSite,
      finalUnit,
      finalFloor,
      area.trim(),
      work.trim(),
      finalTrade,
      status,
      priority,
      notes.trim()
    );
    setArea("");
    setWork("");
    setNotes("");
    setCustomSite("");
    setCustomUnit("");
    setCustomFloor("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-2xs overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in duration-150">
        {/* Fixed Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base sm:text-lg">Add New Work Item</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {/* Site / Category Selector & Manual Input */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-600" /> Site / Project Name *
              </span>
              <span className="text-xs font-normal text-indigo-600">Select existing or type custom</span>
            </label>
            <select
              value={selectedSite}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="w-full p-2.5 bg-indigo-50/60 border border-indigo-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {siteList.map((s) => (
                <option key={s} value={s}>
                  {s} {s === "Esplanade 6" ? "(6 Units × 3 Floors)" : s === "EGC3" ? "(4 Units × 8 Floors)" : ""}
                </option>
              ))}
              <option value="ADD_NEW_SITE">+ Type New Custom Site Name...</option>
            </select>

            {selectedSite === "ADD_NEW_SITE" && (
              <input
                type="text"
                required
                placeholder="Type site name (e.g. Victoria Island Tower A)"
                value={customSite}
                onChange={(e) => setCustomSite(e.target.value)}
                className="w-full mt-2 p-2.5 border border-indigo-300 rounded-lg bg-indigo-50/30 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          {/* Unit & Floor Grid with Manual Input Support */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="ADD_NEW_UNIT">+ Custom Unit...</option>
              </select>

              {unit === "ADD_NEW_UNIT" && (
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 12 / Suite 4B"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full mt-2 p-2 border border-indigo-300 rounded-lg bg-indigo-50/30 text-slate-800 focus:outline-none focus:bg-white"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Floor *
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {unitFloors.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="ADD_NEW_FLOOR">+ Custom Floor...</option>
              </select>

              {floor === "ADD_NEW_FLOOR" && (
                <input
                  type="text"
                  required
                  placeholder="e.g. 3rd Floor / Mezzanine"
                  value={customFloor}
                  onChange={(e) => setCustomFloor(e.target.value)}
                  className="w-full mt-2 p-2 border border-indigo-300 rounded-lg bg-indigo-50/30 text-slate-800 focus:outline-none focus:bg-white"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Area / Location *</label>
            <input
              type="text"
              required
              placeholder="e.g. Guest Toilet, Kitchen Entrance, Balcony"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Outstanding Work *</label>
            <textarea
              required
              rows={2}
              placeholder="Describe work item required..."
              value={work}
              onChange={(e) => setWork(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trade / Artisan</label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {trades.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>

              {trade === "Other" && (
                <input
                  type="text"
                  placeholder="Specify trade..."
                  value={customTrade}
                  onChange={(e) => setCustomTrade(e.target.value)}
                  className="w-full mt-2 p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkPriority)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkStatus)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Specs</label>
              <input
                type="text"
                placeholder="Optional notes or details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white"
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-2 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Work Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
