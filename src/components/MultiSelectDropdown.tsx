import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X, Search, RotateCcw } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
  badge?: React.ReactNode;
}

interface MultiSelectDropdownProps {
  label: string;
  icon?: React.ReactNode;
  options: MultiSelectOption[];
  selectedValues?: string[];
  onChange: (values: string[]) => void;
  allLabel?: string;
  placeholder?: string;
  variant?: "primary" | "default";
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  icon,
  options,
  selectedValues = [],
  onChange,
  allLabel = "All",
  variant = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Filter options if search query exists
  const filteredOptions = searchQuery.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : options;

  // Selected label summary
  const isAllSelected = selectedValues.length === 0 || selectedValues.length === options.length;
  const isPartiallySelected = selectedValues.length > 0 && selectedValues.length < options.length;

  let displaySummary = allLabel;
  if (selectedValues.length === 1) {
    const matched = options.find((o) => o.value === selectedValues[0]);
    displaySummary = matched ? matched.label : selectedValues[0];
  } else if (selectedValues.length > 1 && !isAllSelected) {
    displaySummary = `${selectedValues.length} Selected`;
  }

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={dropdownRef}>
      {/* Field Label */}
      <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-700">
        <label className="flex items-center gap-1 truncate font-bold text-indigo-950">
          {icon}
          <span>{label}</span>
        </label>
        {isPartiallySelected && (
          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-indigo-600 text-white shrink-0">
            {selectedValues.length}
          </span>
        )}
      </div>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full p-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between gap-1.5 min-h-[42px] cursor-pointer transition-all border text-left ${
          isPartiallySelected
            ? "bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold ring-2 ring-indigo-500/10 shadow-2xs"
            : variant === "primary"
            ? "bg-white border-indigo-200 text-slate-900 font-bold hover:border-indigo-400"
            : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
        }`}
        title={`Filter by ${label}`}
      >
        <span className="truncate flex-1 font-semibold">{displaySummary}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 max-w-[90vw] sm:w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2.5 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Controls: Select All & Clear */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] gap-2">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
              Multi-Select:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer transition-colors"
              >
                All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:text-rose-600 font-semibold cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Quick Search if options count > 6 */}
          {options.length > 6 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options Checklist */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400 italic">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const checked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      checked
                        ? "bg-indigo-50 text-indigo-950 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                          checked
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {opt.badge && <div className="shrink-0">{opt.badge}</div>}
                  </label>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 font-medium truncate">
              {selectedValues.length === 0
                ? "Showing all"
                : `${selectedValues.length} of ${options.length} selected`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-md cursor-pointer transition-colors shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
