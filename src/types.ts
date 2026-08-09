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
}

export type DateFilterType = "all" | "today" | "this_week" | "this_month" | "custom";

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
}
