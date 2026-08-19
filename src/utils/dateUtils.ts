import { DateFilterType } from "../types";

/**
 * Safely parses any date string, timestamp number, or Date object.
 * Returns null if invalid or missing.
 */
export function parseDateSafe(dateInput?: string | number | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  // Handle number timestamps
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle string
  const str = String(dateInput).trim();
  if (!str) return null;

  // Try standard Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Handle "YYYY-MM-DD" or "YYYY/MM/DD" manually if standard parser failed
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const manualDate = new Date(year, month, day);
    if (!isNaN(manualDate.getTime())) {
      return manualDate;
    }
  }

  return null;
}

/**
 * Checks if two dates represent the exact same calendar day (local or UTC).
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = parseDateSafe(date1);
  const d2 = parseDateSafe(date2);
  if (!d1 || !d2) return false;

  // Local calendar comparison
  const localMatch =
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (localMatch) return true;

  // UTC calendar comparison (in case one date is UTC ISO string)
  const utcMatch =
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate();

  return utcMatch;
}

/**
 * Formats a date string for UI display in standard construction report format: "19 Aug 2026"
 */
export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  const d = parseDateSafe(dateStr);
  if (!d) return String(dateStr);

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Returns human-readable label for date filter
 */
export function getDateFilterLabel(dateFilter?: DateFilterType): string {
  switch (dateFilter) {
    case "today":
      return "Today (Daily Report)";
    case "this_week":
      return "This Week (7 Days)";
    case "this_month":
      return "This Month (30 Days)";
    case "custom":
      return "Custom Date Range";
    case "all":
    default:
      return "All Dates / Lifetime";
  }
}

/**
 * Validates whether a work item matches the active global DateFilterType.
 *
 * CRITICAL RULE:
 * If dateFilter !== "all", items WITHOUT a valid updatedAt timestamp MUST BE EXCLUDED (return false).
 */
export function isItemMatchingDateFilter(
  updatedAt?: string | null,
  dateFilter: DateFilterType = "all",
  startDate?: string,
  endDate?: string
): boolean {
  // If no date filter is applied, all items are included
  if (!dateFilter || dateFilter === "all") {
    return true;
  }

  // If a specific date filter is active, item MUST have a valid updatedAt timestamp
  if (!updatedAt) {
    return false;
  }

  const itemDate = parseDateSafe(updatedAt);
  if (!itemDate) {
    return false;
  }

  const now = new Date();

  if (dateFilter === "today") {
    return isSameDay(itemDate, now);
  }

  if (dateFilter === "this_week") {
    // 7-day rolling window up to end of today
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
    return itemDate >= startOfWeek && itemDate <= endOfToday;
  }

  if (dateFilter === "this_month") {
    // Match current calendar month & year
    const isCurrentMonth =
      itemDate.getFullYear() === now.getFullYear() &&
      itemDate.getMonth() === now.getMonth();

    if (isCurrentMonth) return true;

    // Or within last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return itemDate >= thirtyDaysAgo && itemDate <= now;
  }

  if (dateFilter === "custom") {
    if (startDate) {
      const start = parseDateSafe(startDate);
      if (start) {
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
    }
    if (endDate) {
      const end = parseDateSafe(endDate);
      if (end) {
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
    }
    return true;
  }

  return true;
}

/**
 * Validates whether a work item matches the chosen report timeframe in ReportsModal.
 *
 * CRITICAL RULE:
 * When filtering for daily, weekly, or monthly report, items WITHOUT a valid updatedAt timestamp MUST BE EXCLUDED (return false).
 */
export function isItemInReportPeriod(
  updatedAt?: string | null,
  reportPeriod: "daily" | "weekly" | "monthly" = "daily",
  selectedDateStr?: string
): boolean {
  if (!updatedAt) {
    return false;
  }

  const itemDate = parseDateSafe(updatedAt);
  if (!itemDate) {
    return false;
  }

  const refDate = selectedDateStr ? parseDateSafe(selectedDateStr) || new Date() : new Date();

  if (reportPeriod === "daily") {
    return isSameDay(itemDate, refDate);
  }

  if (reportPeriod === "weekly") {
    // 7-day period ending on selected reference date
    const targetEnd = new Date(
      refDate.getFullYear(),
      refDate.getMonth(),
      refDate.getDate(),
      23,
      59,
      59,
      999
    );
    const startMs = targetEnd.getTime() - 7 * 24 * 60 * 60 * 1000;
    return itemDate.getTime() >= startMs && itemDate.getTime() <= targetEnd.getTime();
  }

  if (reportPeriod === "monthly") {
    // Same year and month as selected reference date
    const isSameYearMonth =
      itemDate.getFullYear() === refDate.getFullYear() &&
      itemDate.getMonth() === refDate.getMonth();

    if (isSameYearMonth) return true;

    // Check UTC as well in case of timezone boundary
    const isUtcSameYearMonth =
      itemDate.getUTCFullYear() === refDate.getUTCFullYear() &&
      itemDate.getUTCMonth() === refDate.getUTCMonth();

    return isUtcSameYearMonth;
  }

  return true;
}
