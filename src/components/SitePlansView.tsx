import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Filter,
  Printer,
  ChevronRight,
  User,
  Tag,
  Sparkles,
  ArrowRight,
  Flame,
  Check
} from "lucide-react";
import { SitesMap, SitePlans, PlanItem, WorkPriority } from "../types";
import { getSitePlans, updateSitePlans, countPendingPlans } from "../lib/plansUtils";
import { SitePlansReportSection } from "./SitePlansReportSection";

interface SitePlansViewProps {
  sitesData: SitesMap;
  currentSite: string;
  allSitesList: string[];
  onSelectSite: (site: string) => void;
  onPersist: (newSitesMap: SitesMap, siteName?: string) => void;
}

type CategoryType = "all" | "issues" | "daily" | "weekly" | "monthly";

export const SitePlansView: React.FC<SitePlansViewProps> = ({
  sitesData,
  currentSite,
  allSitesList,
  onSelectSite,
  onPersist,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Temporary form states for editing
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<PlanItem["status"]>("Pending");
  const [editPriority, setEditPriority] = useState<WorkPriority>("Medium");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // New item inputs per section
  const [newIssuesText, setNewIssuesText] = useState("");
  const [newIssuesPriority, setNewIssuesPriority] = useState<WorkPriority>("High");
  const [newIssuesTrade, setNewIssuesTrade] = useState("");

  const [newDailyText, setNewDailyText] = useState("");
  const [newDailyTrade, setNewDailyTrade] = useState("");

  const [newWeeklyText, setNewWeeklyText] = useState("");
  const [newWeeklyTarget, setNewWeeklyTarget] = useState("");

  const [newMonthlyText, setNewMonthlyText] = useState("");
  const [newMonthlyTarget, setNewMonthlyTarget] = useState("");

  const plans = getSitePlans(sitesData, currentSite);
  const counts = countPendingPlans(plans);

  // Helper to persist plan updates
  const handleUpdatePlans = (updatedPlans: SitePlans) => {
    const updatedSites = updateSitePlans(sitesData, currentSite, updatedPlans);
    onPersist(updatedSites, currentSite);
  };

  // Add Item Handler
  const handleAddItem = (
    category: keyof SitePlans,
    title: string,
    priority: WorkPriority = "Medium",
    assignedTo: string = "",
    targetDate: string = ""
  ) => {
    if (!title.trim()) return;

    const newItem: PlanItem = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      status: "Pending",
      priority,
      assignedTo: assignedTo.trim(),
      targetDate: targetDate.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newPlans: SitePlans = {
      ...plans,
      [category]: [newItem, ...(plans[category] || [])],
    };

    handleUpdatePlans(newPlans);
  };

  // Delete Item Handler
  const handleDeleteItem = (category: keyof SitePlans, id: string) => {
    const newPlans: SitePlans = {
      ...plans,
      [category]: (plans[category] || []).filter((item) => item.id !== id),
    };
    handleUpdatePlans(newPlans);
  };

  // Toggle Status
  const handleToggleStatus = (category: keyof SitePlans, id: string) => {
    const updatedList = (plans[category] || []).map((item) => {
      if (item.id === id) {
        const nextStatus: PlanItem["status"] =
          item.status === "Pending"
            ? "In Progress"
            : item.status === "In Progress"
            ? "Resolved"
            : "Pending";
        return { ...item, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return item;
    });

    handleUpdatePlans({ ...plans, [category]: updatedList });
  };

  // Start Editing Item
  const handleStartEdit = (item: PlanItem) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditStatus(item.status);
    setEditPriority(item.priority || "Medium");
    setEditAssignedTo(item.assignedTo || "");
    setEditTargetDate(item.targetDate || "");
    setEditNotes(item.notes || "");
  };

  // Save Edit Item
  const handleSaveEdit = (category: keyof SitePlans) => {
    if (!editingItemId || !editTitle.trim()) return;

    const updatedList = (plans[category] || []).map((item) => {
      if (item.id === editingItemId) {
        return {
          ...item,
          title: editTitle.trim(),
          status: editStatus,
          priority: editPriority,
          assignedTo: editAssignedTo.trim(),
          targetDate: editTargetDate.trim(),
          notes: editNotes.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    handleUpdatePlans({ ...plans, [category]: updatedList });
    setEditingItemId(null);
  };

  // Print function
  const handlePrintPlans = () => {
    window.print();
  };

  const getPriorityBadgeClass = (priority?: WorkPriority) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      case "Medium":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 font-medium";
    }
  };

  const getStatusBadgeClass = (status: PlanItem["status"]) => {
    switch (status) {
      case "Resolved":
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "In Progress":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive UI Screen View - Hidden during print */}
      <div className="space-y-6 print:hidden">
        {/* Top Banner & Control Header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Site Execution & Action Planning</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{currentSite}</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-slate-600 text-lg font-semibold">Action Plans & Issues</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track key site challenges, daily next-day targets, weekly milestones, and monthly objectives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto print:hidden">
          {/* Site Picker */}
          <select
            value={currentSite}
            onChange={(e) => onSelectSite(e.target.value)}
            className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {allSitesList.map((site) => (
              <option key={site} value={site}>
                Site: {site}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrintPlans}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveCategory("issues")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === "issues"
              ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Issues & Challenges</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{counts.issuesCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {plans.issuesAndChallenges?.length || 0} total logged
          </p>
        </div>

        <div
          onClick={() => setActiveCategory("daily")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === "daily"
              ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Next Day Plan</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{counts.dailyCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {plans.nextDayPlan?.length || 0} daily items
          </p>
        </div>

        <div
          onClick={() => setActiveCategory("weekly")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === "weekly"
              ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Weekly Plan</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{counts.weeklyCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {plans.weeklyPlan?.length || 0} weekly targets
          </p>
        </div>

        <div
          onClick={() => setActiveCategory("monthly")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeCategory === "monthly"
              ? "bg-purple-50 border-purple-400 ring-2 ring-purple-400/20 shadow-sm"
              : "bg-white border-slate-200 hover:border-purple-300"
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Plan</span>
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{counts.monthlyCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {plans.monthlyPlan?.length || 0} monthly goals
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 print:hidden">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Show All Boards
        </button>
        <button
          onClick={() => setActiveCategory("issues")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeCategory === "issues"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Issues & Challenges ({plans.issuesAndChallenges?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveCategory("daily")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeCategory === "daily"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Next Day Plan ({plans.nextDayPlan?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveCategory("weekly")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeCategory === "weekly"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Weekly Plan ({plans.weeklyPlan?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveCategory("monthly")}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeCategory === "monthly"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-50"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Monthly Plan ({plans.monthlyPlan?.length || 0})</span>
        </button>
      </div>

      {/* Main Boards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: ISSUES AND CHALLENGES */}
        {(activeCategory === "all" || activeCategory === "issues") && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-100" />
                <h3 className="font-extrabold text-base tracking-tight">Issues & Challenges</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs">
                {plans.issuesAndChallenges?.length || 0} Logged
              </span>
            </div>

            <div className="p-4 bg-rose-50/50 border-b border-rose-100 print:hidden">
              <p className="text-xs text-rose-900 font-semibold mb-2">
                Log blockers, access delays, material shortages or safety challenges:
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newIssuesText}
                  onChange={(e) => setNewIssuesText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem(
                        "issuesAndChallenges",
                        newIssuesText,
                        newIssuesPriority,
                        newIssuesTrade
                      );
                      setNewIssuesText("");
                    }
                  }}
                  placeholder="Describe issue or challenge..."
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={newIssuesPriority}
                      onChange={(e) => setNewIssuesPriority(e.target.value as WorkPriority)}
                      className="px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold text-slate-700"
                    >
                      <option value="Critical">Critical Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>

                    <input
                      type="text"
                      value={newIssuesTrade}
                      onChange={(e) => setNewIssuesTrade(e.target.value)}
                      placeholder="Assigned Trade (e.g. Plumbing)"
                      className="px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 w-36"
                    />
                  </div>

                  <button
                    onClick={() => {
                      handleAddItem(
                        "issuesAndChallenges",
                        newIssuesText,
                        newIssuesPriority,
                        newIssuesTrade
                      );
                      setNewIssuesText("");
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Issue</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {(!plans.issuesAndChallenges || plans.issuesAndChallenges.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No issues or challenges logged for {currentSite}.
                </div>
              ) : (
                plans.issuesAndChallenges.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.status === "Resolved"
                        ? "bg-slate-50 border-slate-200 opacity-75"
                        : "bg-white border-rose-100 hover:border-rose-300 shadow-2xs"
                    }`}
                  >
                    {editingItemId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as PlanItem["status"])}
                            className="p-1.5 bg-white border rounded text-xs font-semibold"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as WorkPriority)}
                            className="p-1.5 bg-white border rounded text-xs font-semibold"
                          >
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <input
                            type="text"
                            value={editAssignedTo}
                            onChange={(e) => setEditAssignedTo(e.target.value)}
                            placeholder="Assigned Trade"
                            className="p-1.5 bg-white border rounded text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit("issuesAndChallenges")}
                            className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleStatus("issuesAndChallenges", item.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                              item.status === "Resolved"
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : item.status === "In Progress"
                                ? "bg-amber-400 border-amber-500 text-white"
                                : "bg-white border-slate-300 text-transparent hover:border-rose-400"
                            }`}
                            title="Click to toggle status"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <div>
                            <p
                              className={`text-xs font-bold text-slate-900 ${
                                item.status === "Resolved" ? "line-through text-slate-400" : ""
                              }`}
                            >
                              {item.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                                  item.priority
                                )}`}
                              >
                                {item.priority || "Medium"} Priority
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                              {item.assignedTo && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {item.assignedTo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 print:hidden">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("issuesAndChallenges", item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: NEXT DAY PLAN (DAILY) */}
        {(activeCategory === "all" || activeCategory === "daily") && (
          <div className="bg-white rounded-2xl border border-indigo-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-100" />
                <h3 className="font-extrabold text-base tracking-tight">Next Day Plan (Daily)</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs">
                {plans.nextDayPlan?.length || 0} Tasks
              </span>
            </div>

            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 print:hidden">
              <p className="text-xs text-indigo-900 font-semibold mb-2">
                Define priority targets and work items for tomorrow / next shift:
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newDailyText}
                  onChange={(e) => setNewDailyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem("nextDayPlan", newDailyText, "Medium", newDailyTrade);
                      setNewDailyText("");
                    }
                  }}
                  placeholder="e.g. Complete Unit 3 tiling prep, inspect second floor plumbing..."
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={newDailyTrade}
                    onChange={(e) => setNewDailyTrade(e.target.value)}
                    placeholder="Trade / Subcontractor"
                    className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 w-44"
                  />
                  <button
                    onClick={() => {
                      handleAddItem("nextDayPlan", newDailyText, "Medium", newDailyTrade);
                      setNewDailyText("");
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Daily Target</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {(!plans.nextDayPlan || plans.nextDayPlan.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No next day plans set for {currentSite}.
                </div>
              ) : (
                plans.nextDayPlan.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.status === "Completed" || item.status === "Resolved"
                        ? "bg-slate-50 border-slate-200 opacity-75"
                        : "bg-white border-indigo-100 hover:border-indigo-300 shadow-2xs"
                    }`}
                  >
                    {editingItemId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as PlanItem["status"])}
                            className="p-1.5 bg-white border rounded text-xs font-semibold"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <input
                            type="text"
                            value={editAssignedTo}
                            onChange={(e) => setEditAssignedTo(e.target.value)}
                            placeholder="Assigned Trade"
                            className="p-1.5 bg-white border rounded text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit("nextDayPlan")}
                            className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleStatus("nextDayPlan", item.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                              item.status === "Completed" || item.status === "Resolved"
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : item.status === "In Progress"
                                ? "bg-amber-400 border-amber-500 text-white"
                                : "bg-white border-slate-300 text-transparent hover:border-indigo-400"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <div>
                            <p
                              className={`text-xs font-bold text-slate-900 ${
                                item.status === "Completed" || item.status === "Resolved"
                                  ? "line-through text-slate-400"
                                  : ""
                              }`}
                            >
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                              {item.assignedTo && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {item.assignedTo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 print:hidden">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("nextDayPlan", item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: WEEKLY PLAN */}
        {(activeCategory === "all" || activeCategory === "weekly") && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-100" />
                <h3 className="font-extrabold text-base tracking-tight">Weekly Plan</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs">
                {plans.weeklyPlan?.length || 0} Milestones
              </span>
            </div>

            <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 print:hidden">
              <p className="text-xs text-emerald-900 font-semibold mb-2">
                Set weekly milestones and work package deadlines:
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newWeeklyText}
                  onChange={(e) => setNewWeeklyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem("weeklyPlan", newWeeklyText, "Medium", "", newWeeklyTarget);
                      setNewWeeklyText("");
                    }
                  }}
                  placeholder="e.g. Complete First Floor electrical 2nd fix across all units..."
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={newWeeklyTarget}
                    onChange={(e) => setNewWeeklyTarget(e.target.value)}
                    placeholder="Target Week / Date (e.g. Week 32)"
                    className="px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 w-48"
                  />
                  <button
                    onClick={() => {
                      handleAddItem("weeklyPlan", newWeeklyText, "Medium", "", newWeeklyTarget);
                      setNewWeeklyText("");
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Weekly Plan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {(!plans.weeklyPlan || plans.weeklyPlan.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No weekly plan items set for {currentSite}.
                </div>
              ) : (
                plans.weeklyPlan.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.status === "Completed" || item.status === "Resolved"
                        ? "bg-slate-50 border-slate-200 opacity-75"
                        : "bg-white border-emerald-100 hover:border-emerald-300 shadow-2xs"
                    }`}
                  >
                    {editingItemId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as PlanItem["status"])}
                            className="p-1.5 bg-white border rounded text-xs font-semibold"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <input
                            type="text"
                            value={editTargetDate}
                            onChange={(e) => setEditTargetDate(e.target.value)}
                            placeholder="Target Week / Date"
                            className="p-1.5 bg-white border rounded text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit("weeklyPlan")}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleStatus("weeklyPlan", item.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                              item.status === "Completed" || item.status === "Resolved"
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : item.status === "In Progress"
                                ? "bg-amber-400 border-amber-500 text-white"
                                : "bg-white border-slate-300 text-transparent hover:border-emerald-400"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <div>
                            <p
                              className={`text-xs font-bold text-slate-900 ${
                                item.status === "Completed" || item.status === "Resolved"
                                  ? "line-through text-slate-400"
                                  : ""
                              }`}
                            >
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                              {item.targetDate && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {item.targetDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 print:hidden">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("weeklyPlan", item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 4: MONTHLY PLAN */}
        {(activeCategory === "all" || activeCategory === "monthly") && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-100" />
                <h3 className="font-extrabold text-base tracking-tight">Monthly Plan</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs">
                {plans.monthlyPlan?.length || 0} Goals
              </span>
            </div>

            <div className="p-4 bg-purple-50/50 border-b border-purple-100 print:hidden">
              <p className="text-xs text-purple-900 font-semibold mb-2">
                Track high-level monthly goals, handover targets, and procurement:
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newMonthlyText}
                  onChange={(e) => setNewMonthlyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem("monthlyPlan", newMonthlyText, "Medium", "", newMonthlyTarget);
                      setNewMonthlyText("");
                    }
                  }}
                  placeholder="e.g. Complete snagging and hand over Units 1-4..."
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={newMonthlyTarget}
                    onChange={(e) => setNewMonthlyTarget(e.target.value)}
                    placeholder="Target Month (e.g. August 2026)"
                    className="px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 w-48"
                  />
                  <button
                    onClick={() => {
                      handleAddItem("monthlyPlan", newMonthlyText, "Medium", "", newMonthlyTarget);
                      setNewMonthlyText("");
                    }}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Monthly Goal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {(!plans.monthlyPlan || plans.monthlyPlan.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No monthly goals set for {currentSite}.
                </div>
              ) : (
                plans.monthlyPlan.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.status === "Completed" || item.status === "Resolved"
                        ? "bg-slate-50 border-slate-200 opacity-75"
                        : "bg-white border-purple-100 hover:border-purple-300 shadow-2xs"
                    }`}
                  >
                    {editingItemId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as PlanItem["status"])}
                            className="p-1.5 bg-white border rounded text-xs font-semibold"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <input
                            type="text"
                            value={editTargetDate}
                            onChange={(e) => setEditTargetDate(e.target.value)}
                            placeholder="Target Month"
                            className="p-1.5 bg-white border rounded text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit("monthlyPlan")}
                            className="px-3 py-1 bg-purple-600 text-white font-bold text-xs rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleToggleStatus("monthlyPlan", item.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                              item.status === "Completed" || item.status === "Resolved"
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : item.status === "In Progress"
                                ? "bg-amber-400 border-amber-500 text-white"
                                : "bg-white border-slate-300 text-transparent hover:border-purple-400"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <div>
                            <p
                              className={`text-xs font-bold text-slate-900 ${
                                item.status === "Completed" || item.status === "Resolved"
                                  ? "line-through text-slate-400"
                                  : ""
                              }`}
                            >
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                              {item.targetDate && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <CalendarDays className="w-3 h-3 text-slate-400" />
                                  {item.targetDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 print:hidden">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("monthlyPlan", item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Printable Report Container for Native Print Dialog */}
      <div id="printable-report-doc" className="hidden print:block font-sans text-black p-4 space-y-6 bg-white">
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-black">
              Site Management & Execution Log
            </div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">
              SITE ACTION PLANS & ISSUES REPORT
            </h2>
            <p className="text-sm font-semibold text-black mt-1">
              Project Site: <strong className="underline">{currentSite}</strong> · Report Date: <strong>{new Date().toLocaleDateString()}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-black font-semibold">
            <p>STATUS: OFFICIAL</p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <SitePlansReportSection sitePlansData={[{ siteName: currentSite, plans }]} />

        <div className="pt-8 border-t-2 border-black grid grid-cols-3 gap-6 text-xs text-black font-bold break-inside-avoid">
          <div>
            <p className="mb-8">Prepared By: ___________________</p>
            <p className="text-[10px] font-normal">Site Coordinator / Engineer</p>
          </div>
          <div>
            <p className="mb-8">Reviewed By: ___________________</p>
            <p className="text-[10px] font-normal">Project Supervisor</p>
          </div>
          <div>
            <p className="mb-8">Client Sign-Off: ___________________</p>
            <p className="text-[10px] font-normal">Representative Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
