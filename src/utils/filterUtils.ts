import { WorkItem, FilterState } from "../types";
import { isItemMatchingDateFilter } from "./dateUtils";

/**
 * Checks if a work item satisfies the current filter state,
 * supporting both multi-select arrays and single-select backwards compatibility.
 */
export function isItemMatchingFilters(
  item: WorkItem,
  siteName: string,
  unitName: string,
  floorName: string,
  filters: FilterState
): boolean {
  // 1. Site Filter
  if (filters.sites && filters.sites.length > 0) {
    if (!filters.sites.includes(siteName)) return false;
  } else if (filters.site && filters.site !== "all") {
    if (filters.site !== siteName) return false;
  }

  // 2. Unit Filter
  if (filters.units && filters.units.length > 0) {
    if (!filters.units.includes(unitName)) return false;
  } else if (filters.unit && filters.unit !== "all") {
    if (filters.unit !== unitName) return false;
  }

  // 3. Floor Filter
  if (filters.floors && filters.floors.length > 0) {
    if (!filters.floors.includes(floorName)) return false;
  } else if (filters.floor && filters.floor !== "all") {
    if (filters.floor !== floorName) return false;
  }

  // 4. Status Filter
  if (filters.statuses && filters.statuses.length > 0) {
    if (!filters.statuses.includes(item.status)) return false;
  } else if (filters.status && filters.status !== "all") {
    if (filters.status !== item.status) return false;
  }

  // 5. Trade Filter
  if (filters.trades && filters.trades.length > 0) {
    if (!filters.trades.includes(item.trade)) return false;
  } else if (filters.trade && filters.trade !== "all") {
    if (filters.trade !== item.trade) return false;
  }

  // 6. Priority Filter
  const itemPriority = item.priority || "Medium";
  if (filters.priorities && filters.priorities.length > 0) {
    if (!filters.priorities.includes(itemPriority)) return false;
  } else if (filters.priority && filters.priority !== "all") {
    if (filters.priority !== itemPriority) return false;
  }

  // 7. Date Filter (Strictly enforces lifetime, today, this_week, this_month, custom)
  if (
    !isItemMatchingDateFilter(
      item.updatedAt,
      filters.dateFilter,
      filters.startDate,
      filters.endDate
    )
  ) {
    return false;
  }

  // 8. Search Query
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const matchArea = (item.area || "").toLowerCase().includes(q);
    const matchWork = (item.work || "").toLowerCase().includes(q);
    const matchTrade = (item.trade || "").toLowerCase().includes(q);
    const matchNotes = (item.notes || "").toLowerCase().includes(q);
    const matchSite = siteName.toLowerCase().includes(q);
    const matchUnit = unitName.toLowerCase().includes(q);
    const matchFloor = floorName.toLowerCase().includes(q);

    if (
      !matchArea &&
      !matchWork &&
      !matchTrade &&
      !matchNotes &&
      !matchSite &&
      !matchUnit &&
      !matchFloor
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Counts active filter criteria
 */
export function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.sites && filters.sites.length > 0) count++;
  else if (filters.site && filters.site !== "all") count++;

  if (filters.sortBy && filters.sortBy !== "site") count++;
  if (filters.dateFilter && filters.dateFilter !== "all") count++;

  if (filters.units && filters.units.length > 0) count++;
  else if (filters.unit && filters.unit !== "all") count++;

  if (filters.floors && filters.floors.length > 0) count++;
  else if (filters.floor && filters.floor !== "all") count++;

  if (filters.priorities && filters.priorities.length > 0) count++;
  else if (filters.priority && filters.priority !== "all") count++;

  if (filters.statuses && filters.statuses.length > 0) count++;
  else if (filters.status && filters.status !== "all") count++;

  if (filters.trades && filters.trades.length > 0) count++;
  else if (filters.trade && filters.trade !== "all") count++;

  return count;
}
