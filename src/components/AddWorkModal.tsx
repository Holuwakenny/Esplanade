import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { WorkStatus, WorkPriority } from "../types";

interface AddWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: string[];
  floors: string[];
  trades: string[];
  onAdd: (
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
  units,
  floors,
  trades,
  onAdd,
}) => {
  const [unit, setUnit] = useState<string>(units[0] || "Unit 1");
  const [customUnit, setCustomUnit] = useState("");
  const [floor, setFloor] = useState<string>(floors[0] || "Ground Floor");
  const [area, setArea] = useState("");
  const [work, setWork] = useState("");
  const [trade, setTrade] = useState("Tiler");
  const [customTrade, setCustomTrade] = useState("");
  const [status, setStatus] = useState<WorkStatus>("Pending");
  const [priority, setPriority] = useState<WorkPriority>("Medium");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUnit = unit === "ADD_NEW_UNIT" ? customUnit.trim() : unit;
    const finalTrade = trade === "Other" ? customTrade || "General" : trade;
    if (!finalUnit || !area.trim() || !work.trim()) return;

    onAdd(finalUnit, floor, area.trim(), work.trim(), finalTrade, status, priority, notes.trim());
    setArea("");
    setWork("");
    setNotes("");
    setCustomUnit("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Add New Outstanding Work</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="ADD_NEW_UNIT">+ Add New Unit...</option>
              </select>

              {unit === "ADD_NEW_UNIT" && (
                <input
                  type="text"
                  required
                  placeholder="Enter new unit name (e.g. Unit 7)"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full mt-2 p-2 border border-indigo-300 rounded-lg bg-indigo-50/30 text-slate-800 focus:outline-none focus:bg-white"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Floor</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {floors.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Area / Location *</label>
            <input
              type="text"
              required
              placeholder="e.g. Guest Toilet, Kitchen Entrance, Staircase"
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

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Add Work Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
