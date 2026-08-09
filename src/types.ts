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

export interface TrackerSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overallPct: number;
  tradeCounts: { [trade: string]: number };
  unitStats: { [unitName: string]: UnitStat };
}

export interface FilterState {
  unit: string;
  floor: string;
  status: string;
  trade: string;
  priority: string;
  search: string;
}
