import { SitesMap, SitePlans, PlanItem } from "../types";

export const DEFAULT_SITE_PLANS: SitePlans = {
  issuesAndChallenges: [],
  nextDayPlan: [],
  weeklyPlan: [],
  monthlyPlan: [],
};

export function getSitePlans(sitesData: SitesMap, siteName: string): SitePlans {
  if (!sitesData || !sitesData[siteName]) {
    return { ...DEFAULT_SITE_PLANS };
  }
  const rawPlans = (sitesData[siteName] as any)?._plans;
  if (!rawPlans) {
    return {
      issuesAndChallenges: [],
      nextDayPlan: [],
      weeklyPlan: [],
      monthlyPlan: [],
    };
  }
  return {
    issuesAndChallenges: Array.isArray(rawPlans.issuesAndChallenges) ? rawPlans.issuesAndChallenges : [],
    nextDayPlan: Array.isArray(rawPlans.nextDayPlan) ? rawPlans.nextDayPlan : [],
    weeklyPlan: Array.isArray(rawPlans.weeklyPlan) ? rawPlans.weeklyPlan : [],
    monthlyPlan: Array.isArray(rawPlans.monthlyPlan) ? rawPlans.monthlyPlan : [],
  };
}

export function updateSitePlans(
  sitesData: SitesMap,
  siteName: string,
  newPlans: SitePlans
): SitesMap {
  const updatedMap = JSON.parse(JSON.stringify(sitesData)) as SitesMap;
  if (!updatedMap[siteName]) {
    updatedMap[siteName] = {};
  }
  (updatedMap[siteName] as any)._plans = newPlans;
  return updatedMap;
}

export function countPendingPlans(plans: SitePlans): {
  issuesCount: number;
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  totalPending: number;
} {
  const issuesCount = (plans.issuesAndChallenges || []).filter(
    (i) => i.status === "Pending" || i.status === "In Progress"
  ).length;
  const dailyCount = (plans.nextDayPlan || []).filter(
    (i) => i.status === "Pending" || i.status === "In Progress"
  ).length;
  const weeklyCount = (plans.weeklyPlan || []).filter(
    (i) => i.status === "Pending" || i.status === "In Progress"
  ).length;
  const monthlyCount = (plans.monthlyPlan || []).filter(
    (i) => i.status === "Pending" || i.status === "In Progress"
  ).length;

  return {
    issuesCount,
    dailyCount,
    weeklyCount,
    monthlyCount,
    totalPending: issuesCount + dailyCount + weeklyCount + monthlyCount,
  };
}
