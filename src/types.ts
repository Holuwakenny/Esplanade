export type WorkStatus = "Pending" | "In Progress" | "Completed";
export type WorkPriority = "Low" | "Medium" | "High" | "Critical";

export interface WorkItem {
  id?: string;
  area: string;
  work: string;
  trade: string;
  status: WorkStatus;
  priority?: WorkPriority;
  notes?: string;
  photos?: string[];
  updatedAt?: string;
}

export type FloorData = WorkItem[];

export interface UnitData {
  [floorName: string]: FloorData;
}

export interface SiteTrackerData {
  [unitName: string]: UnitData;
}

export interface UnitStat {
  total: number;
  completed: number;
  pct: number;
}

export interface SiteStat {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  pct: number;
  unitStats: { [unitName: string]: UnitStat };
}

export interface SitesMap {
  [siteName: string]: SiteTrackerData;
}

export interface TrackerSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overallPct: number;
  tradeCounts: { [trade: string]: number };
  unitStats: { [unitName: string]: UnitStat };
  siteStats?: { [siteName: string]: SiteStat };
}

export type DateFilterType = "all" | "today" | "this_week" | "this_month" | "custom";

export interface PlanItem {
  id: string;
  title: string;
  status: "Pending" | "In Progress" | "Completed" | "Resolved";
  priority?: WorkPriority;
  assignedTo?: string;
  targetDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SitePlans {
  issuesAndChallenges: PlanItem[];
  nextDayPlan: PlanItem[];
  weeklyPlan: PlanItem[];
  monthlyPlan: PlanItem[];
}

export interface FilterState {
  site: string;
  unit: string;
  floor: string;
  status: string;
  trade: string;
  priority: string;
  search: string;
  dateFilter: DateFilterType;
  startDate?: string;
  endDate?: string;
  sortBy?: "site" | "priority" | "floor" | "trade" | "status" | "date";
}
