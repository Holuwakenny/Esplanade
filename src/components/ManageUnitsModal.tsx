import React, { useState } from "react";
import { X, Building2, Plus, Trash2, Edit3, Check, Filter, Layers, Clock } from "lucide-react";
import { SiteTrackerData, WorkItem } from "../types";

interface ManageUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SiteTrackerData;
  onAddUnit: (unitName: string, floors: string[]) => void;
  onRenameUnit: (oldName: string, newName: string) => void;
  onDeleteUnit: (unitName: string) => void;
  onSelectUnitFilter: (unitName: string) => void;
}

export const ManageUnitsModal: React.FC<ManageUnitsModalProps> = ({
  isOpen,
  onClose,
  data,
  onAddUnit,
  onRenameUnit,
  onDeleteUnit,
  onSelectUnitFilter,
}) => {
  const [newUnitName, setNewUnitName] = useState("");
  const [selectedFloors, setSelectedFloors] = useState<string[]>([
    "Ground Floor",
    "First Floor",
    "Second Floor",
  ]);
  const [customFloorInput, setCustomFloorInput] = useState("");
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!isOpen) return null;

  const unitNames = Object.keys(data).filter((u) => !u.startsWith("_"));

  // Handle Add Unit submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUnitName.trim();
    if (!trimmed) return;
    if (unitNames.includes(trimmed)) {
      alert(`Unit "${trimmed}" already exists.`);
      return;
    }
    const finalFloors = selectedFloors.length > 0 ? selectedFloors : ["Ground Floor"];
    onAddUnit(trimmed, finalFloors);
    setNewUnitName("");
  };

  const handleAddCustomFloor = () => {
    const trimmed = customFloorInput.trim();
    if (trimmed && !selectedFloors.includes(trimmed)) {
      setSelectedFloors([...selectedFloors, trimmed]);
      setCustomFloorInput("");
    }
  };

  const handleToggleFloor = (floor: string) => {
    if (selectedFloors.includes(floor)) {
      if (selectedFloors.length === 1) return; // Keep at least 1 floor
      setSelectedFloors(selectedFloors.filter((f) => f !== floor));
    } else {
      setSelectedFloors([...selectedFloors, floor]);
    }
  };

  const startRename = (unit: string) => {
    setEditingUnit(unit);
    setEditingName(unit);
  };

  const saveRename = (oldName: string) => {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== oldName) {
      if (unitNames.includes(trimmed)) {
        alert(`Unit "${trimmed}" already exists.`);
        return;
      }
      onRenameUnit(oldName, trimmed);
    }
    setEditingUnit(null);
  };

  const handleDelete = (unit: string) => {
    // Check how many items exist in this unit
    let itemCount = 0;
    (Object.values(data[unit] || {}) as WorkItem[][]).forEach((items) => {
      itemCount += items.length;
    });

    if (itemCount > 0) {
      if (!confirm(`Unit "${unit}" contains ${itemCount} outstanding work items. Are you sure you want to delete this unit and all its items?`)) {
        return;
      }
    }
    onDeleteUnit(unit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Manage & List Units</h3>
              <p className="text-xs text-slate-400">View unit close-out status or create new site units</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Section 1: Add New Unit Form */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add New Building Unit
            </h4>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Name / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 7, Penthouse A, Block C - Unit 12"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Unit</span>
                  </button>
                </div>
              </div>

              {/* Floor Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Initial Floors Layout:
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {["Ground Floor", "First Floor", "Second Floor", "Roof Floor"].map((f) => {
                    const isSelected = selectedFloors.includes(f);
                    return (
                      <button
                        type="button"
                        key={f}
                        onClick={() => handleToggleFloor(f)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {f}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Floor Input */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="+ Add custom floor (e.g. Basement 1)"
                    value={customFloorInput}
                    onChange={(e) => setCustomFloorInput(e.target.value)}
                    className="p-1.5 text-xs bg-white border border-slate-200 rounded-md w-64 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFloor}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium border border-slate-200 transition-colors"
                  >
                    Add Floor
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: All Units List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-slate-600" />
                All Units Directory ({unitNames.length})
              </h4>
              <span className="text-xs text-slate-500">
                Click any unit to filter the main close-out board
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unitNames.map((unit) => {
                const floorsObj = data[unit] || {};
                const floorNames = Object.keys(floorsObj);
                let totalWorks = 0;
                let completedWorks = 0;
                let pendingWorks = 0;

                (Object.values(floorsObj) as WorkItem[][]).forEach((items) => {
                  totalWorks += items.length;
                  items.forEach((item) => {
                    if (item.status === "Completed") completedWorks++;
                    else pendingWorks++;
                  });
                });

                const pct = totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0;
                const isEditing = editingUnit === unit;

                return (
                  <div
                    key={unit}
                    className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="p-1 text-xs border border-indigo-400 rounded bg-indigo-50/50 w-full font-bold focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(unit)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Save name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-base">{unit}</h5>
                          <button
                            onClick={() => startRename(unit)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Rename unit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onSelectUnitFilter(unit);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Filter table by this unit"
                        >
                          <Filter className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleDelete(unit)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">
                          {completedWorks} / {totalWorks} Works Completed
                        </span>
                        <span className="font-bold text-indigo-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Floor breakdown pill tags */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {floorNames.length} Floors ({floorNames.join(", ")})
                      </span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Clock className="w-3 h-3 text-amber-500" /> {pendingWorks} pending
                      </span>
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
