import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DocxReportOptions } from "./docxReportGenerator";
import { getSitePlans } from "../lib/plansUtils";
import { GMH_LOGO_SVG } from "./gmhLogoAsset";

export async function generateExecutivePdfReport(options: DocxReportOptions): Promise<void> {
  const {
    reportType,
    title,
    selectedSites,
    sites,
    startDate,
    endDate,
    preparedBy,
    projectManager,
    managementRecipient,
    q1WhereAreWe,
    q2WhereShouldWeBe,
    q3WhyDifference,
    q4WhatDoingAboutIt,
    q5NeedFromManagement,
    siteSummaries,
    includePhotos,
    selectedPhotos,
  } = options;

  interface ItemWithLoc {
    siteName: string;
    unitName: string;
    floorName: string;
    area: string;
    work: string;
    trade: string;
    status: string;
    priority: string;
    notes?: string;
  }

  const allItems: ItemWithLoc[] = [];
  const completedItems: ItemWithLoc[] = [];
  const ongoingItems: ItemWithLoc[] = [];
  const pendingItems: ItemWithLoc[] = [];

  selectedSites.forEach((siteName) => {
    const siteData = sites[siteName] || {};
    Object.entries(siteData).forEach(([unitName, unitData]) => {
      if (unitName.startsWith("_")) return;
      Object.entries(unitData).forEach(([floorName, floorItems]) => {
        (floorItems as any[]).forEach((item) => {
          const itemLoc: ItemWithLoc = { ...item, siteName, unitName, floorName };
          allItems.push(itemLoc);

          if (item.status === "Completed") completedItems.push(itemLoc);
          else if (item.status === "In Progress") ongoingItems.push(itemLoc);
          else pendingItems.push(itemLoc);
        });
      });
    });
  });

  const total = allItems.length;
  const completed = completedItems.length;
  const inProgress = ongoingItems.length;
  const pending = pendingItems.length;
  const overallPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const sortBySite = (a: ItemWithLoc, b: ItemWithLoc) => {
    const sC = a.siteName.localeCompare(b.siteName);
    if (sC !== 0) return sC;
    const uC = a.unitName.localeCompare(b.unitName);
    if (uC !== 0) return uC;
    const fC = a.floorName.localeCompare(b.floorName);
    if (fC !== 0) return fC;
    return (a.area || "").localeCompare(b.area || "");
  };

  allItems.sort(sortBySite);
  completedItems.sort(sortBySite);
  ongoingItems.sort(sortBySite);
  pendingItems.sort(sortBySite);

  const allIssues: Array<{ site: string; title: string; notes?: string }> = [];
  const allNextDay: Array<{ site: string; title: string; notes?: string }> = [];
  const allWeekly: Array<{ site: string; title: string; notes?: string }> = [];
  const allMonthly: Array<{ site: string; title: string; notes?: string }> = [];

  selectedSites.forEach((siteName) => {
    const plans = getSitePlans(sites, siteName);
    (plans.issuesAndChallenges || []).forEach((p) => allIssues.push({ site: siteName, title: p.title, notes: p.notes }));
    (plans.nextDayPlan || []).forEach((p) => allNextDay.push({ site: siteName, title: p.title, notes: p.notes }));
    (plans.weeklyPlan || []).forEach((p) => allWeekly.push({ site: siteName, title: p.title, notes: p.notes }));
    (plans.monthlyPlan || []).forEach((p) => allMonthly.push({ site: siteName, title: p.title, notes: p.notes }));
  });

  const plannedList = reportType === "monthly" ? allMonthly : allWeekly;

  // Build clean HTML string styled for A4 page width (approx 780px wide)
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "780px";
  container.style.backgroundColor = "#ffffff";
  container.style.padding = "24px 30px";
  container.style.fontFamily = "Arial, Helvetica, sans-serif";
  container.style.fontSize = "12px";
  container.style.color = "#1e293b";
  container.style.lineHeight = "1.5";
  container.style.zIndex = "-1000";

  container.innerHTML = `
    <!-- GMH LUXURY EXECUTIVE COVER PAGE -->
    <div style="background: #071D49; color: #ffffff; border-radius: 10px; padding: 30px 24px; margin-bottom: 28px; border: 2px solid #D4AF37; text-align: center; box-shadow: 0 4px 14px rgba(7, 29, 73, 0.25);">
      <div style="max-width: 320px; margin: 0 auto 16px auto; overflow: hidden; border-radius: 6px;">
        ${GMH_LOGO_SVG}
      </div>

      <div style="width: 120px; height: 2px; background: #D4AF37; margin: 0 auto 16px auto;"></div>

      <h1 style="font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 1px;">
        ${title}
      </h1>
      <div style="font-size: 12px; font-weight: 800; color: #F9E79F; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 22px;">
        EXECUTIVE 5-QUESTION PROGRESS SUMMARY & DETAILED SITE AUDIT
      </div>

      <!-- Cover Metadata Grid Box -->
      <table style="width: 100%; max-width: 680px; margin: 0 auto; border-collapse: collapse; font-size: 11px; text-align: left; background: #0b2559; border: 1px solid #D4AF37; border-radius: 6px; overflow: hidden;">
        <tbody>
          <tr>
            <th style="width: 25%; background: #06173a; color: #F9E79F; padding: 7px 12px; border: 1px solid #1a3875;">Project / Sites:</th>
            <td style="padding: 7px 12px; border: 1px solid #1a3875; color: #ffffff; font-weight: bold;">${selectedSites.join(", ")}</td>
          </tr>
          <tr>
            <th style="background: #06173a; color: #F9E79F; padding: 7px 12px; border: 1px solid #1a3875;">Reporting Period:</th>
            <td style="padding: 7px 12px; border: 1px solid #1a3875; color: #ffffff;">${reportType.toUpperCase()} REPORT (${startDate} to ${endDate})</td>
          </tr>
          <tr>
            <th style="background: #06173a; color: #F9E79F; padding: 7px 12px; border: 1px solid #1a3875;">Prepared By:</th>
            <td style="padding: 7px 12px; border: 1px solid #1a3875; color: #ffffff;">${preparedBy || "Site Coordination Team"}</td>
          </tr>
          <tr>
            <th style="background: #06173a; color: #F9E79F; padding: 7px 12px; border: 1px solid #1a3875;">Submitted To:</th>
            <td style="padding: 7px 12px; border: 1px solid #1a3875; color: #ffffff;">${managementRecipient || "Executive Project Management & Directors"}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 20px; font-size: 9.5px; color: #D4AF37; letter-spacing: 2px; font-weight: 700; text-transform: uppercase;">
        GMH LUXURY • 11 YEARS • BUILT BY VISION, SUSTAINED BY TRUST
      </div>
    </div>

    <!-- KPI Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; text-align: center; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background: #1e293b; color: #ffffff;">
          <th style="padding: 7px; border: 1px solid #cbd5e1;">Total Scope</th>
          <th style="padding: 7px; border: 1px solid #cbd5e1;">Completed</th>
          <th style="padding: 7px; border: 1px solid #cbd5e1;">Ongoing</th>
          <th style="padding: 7px; border: 1px solid #cbd5e1;">Pending</th>
          <th style="padding: 7px; border: 1px solid #cbd5e1;">Completion Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #f8fafc; font-weight: bold;">
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 13px;">${total}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #15803d;">${completed}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #2563eb;">${inProgress}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #d97706;">${pending}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #4338ca;">${overallPct}%</td>
        </tr>
      </tbody>
    </table>

    ${
      selectedSites.length > 1
        ? `
      <!-- PART I: CONSOLIDATED OVERVIEW (MULTIPLE SITES ONLY) -->
      <div style="margin-bottom: 24px; padding: 14px; background: #f8fafc; border: 1px solid #c7d2fe; border-radius: 8px;">
        <h2 style="font-size: 14px; font-weight: 900; color: #1e3a8a; margin: 0 0 4px 0; text-transform: uppercase;">
          PART I: CONSOLIDATED EXECUTIVE 5-POINT OVERVIEW
        </h2>
        <div style="font-size: 10px; font-style: italic; color: #64748b; margin-bottom: 12px;">
          Consolidated progress assessment across all ${selectedSites.length} project sites (${selectedSites.join(", ")}).
        </div>

        <div style="margin-bottom: 10px;">
          <strong style="color: #1e3a8a; font-size: 11px;">1. Where are we across all sites? – Progress & Status:</strong>
          <div style="background: #ffffff; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
            ${(q1WhereAreWe || `Currently, overall progress across all selected sites stands at ${overallPct}% completion with ${completed} completed items and ${inProgress} ongoing items.`).replace(/\n/g, "<br/>")}
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <strong style="color: #1e3a8a; font-size: 11px;">2. Where should we be? – Programme Milestones:</strong>
          <div style="background: #ffffff; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
            ${(q2WhereShouldWeBe || `Target milestones focus on primary structural works, surface preparation, M&E rough-ins, and scheduled trade close-outs.`).replace(/\n/g, "<br/>")}
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <strong style="color: #991b1b; font-size: 11px;">3. Why is there a difference? – Variances & Reasons:</strong>
          <div style="background: #ffffff; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
            ${(q3WhyDifference || `Variances are primarily linked to material delivery sequencing, trade dependencies, and artisan gang allocations.`).replace(/\n/g, "<br/>")}
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <strong style="color: #92400e; font-size: 11px;">4. What are we doing about it? – Recovery Interventions:</strong>
          <div style="background: #ffffff; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
            ${(q4WhatDoingAboutIt || `Interventions include parallel artisan teams, accelerating sign-offs, and early material procurement.`).replace(/\n/g, "<br/>")}
          </div>
        </div>

        <div>
          <strong style="color: #581c87; font-size: 11px;">5. What do we need from Management? – Decisions & Approvals:</strong>
          <div style="background: #ffffff; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
            ${(q5NeedFromManagement || `Expedited review for procurement clearances, subcontractor milestone disbursements, and architectural approvals.`).replace(/\n/g, "<br/>")}
          </div>
        </div>
      </div>

      <div style="margin-top: 24px; margin-bottom: 14px;">
        <h2 style="font-size: 14px; font-weight: 900; color: #1e1b4b; background: #e0e7ff; padding: 8px 12px; border-left: 5px solid #4338ca; margin: 0 0 4px 0;">
          PART II: SITE-BY-SITE 5-POINT WORK SUMMARIES & AUDITS
        </h2>
        <div style="font-size: 10px; font-style: italic; color: #64748b;">
          Detailed 5-point close-out report, milestone status, and work tables categorized individually for each site.
        </div>
      </div>
    `
        : ""
    }

    <!-- SITE-CATEGORIZED SECTIONS (Zero duplicates) -->
    ${selectedSites
      .map((siteName) => {
        const sItems = allItems.filter((i) => i.siteName === siteName);
        const sCompleted = sItems.filter((i) => i.status === "Completed");
        const sOngoing = sItems.filter((i) => i.status === "In Progress");
        const sPending = sItems.filter((i) => i.status === "Pending");
        const sTotal = sItems.length;
        const sPct = sTotal > 0 ? Math.round((sCompleted.length / sTotal) * 100) : 0;

        const siteSummary = siteSummaries?.[siteName] || {};
        const sQ1 =
          siteSummary.q1WhereAreWe ||
          (selectedSites.length === 1 ? q1WhereAreWe : "") ||
          `Current project execution on site "${siteName}" stands at ${sPct}% physical completion. A total of ${sCompleted.length} work items have been fully completed and inspected, ${sOngoing.length} items are actively ongoing across units and floors, and ${sPending.length} items remain in the preparatory pipeline.`;
        const sQ2 =
          siteSummary.q2WhereShouldWeBe ||
          (selectedSites.length === 1 ? q2WhereShouldWeBe : "") ||
          `According to the approved schedule and target milestones for ${siteName} (${reportType === "weekly" ? "this week" : "this month"}), planned deliverables focus on concluding primary trade works, floor finishes, and surface preparation.`;
        const sQ3 =
          siteSummary.q3WhyDifference ||
          (selectedSites.length === 1 ? q3WhyDifference : "") ||
          `Schedule variances and on-site delays for ${siteName} during this period were primarily driven by material delivery sequence, trade overlaps, and specialized artisan attendance.`;
        const sQ4 =
          siteSummary.q4WhatDoingAboutIt ||
          (selectedSites.length === 1 ? q4WhatDoingAboutIt : "") ||
          `To recover time and attain milestones on ${siteName}, the site team has deployed immediate corrective interventions, reallocated parallel artisan gangs, and prioritized critical path units.`;
        const sQ5 =
          siteSummary.q5NeedFromManagement ||
          (selectedSites.length === 1 ? q5NeedFromManagement : "") ||
          `To sustain momentum on ${siteName} without disruption, the site team requests Management review and clearance on pending procurement requisitions and stage disbursements.`;

        const sSitePlans = getSitePlans(sites, siteName);
        const sSiteIssues = sSitePlans.issuesAndChallenges || [];
        const sSiteNextDay = sSitePlans.nextDayPlan || [];
        const sSiteWeekly = sSitePlans.weeklyPlan || [];
        const sSiteMonthly = sSitePlans.monthlyPlan || [];
        const sSitePlanned = reportType === "monthly" ? sSiteMonthly : sSiteWeekly;

        const sPhotos =
          includePhotos && selectedPhotos ? selectedPhotos.filter((p) => p.siteName === siteName) : [];

        return `
        <div style="margin-top: 24px; border-top: 2px solid #4338ca; padding-top: 14px;">
          <h2 style="font-size: 13px; font-weight: 900; color: #1e1b4b; background: #f1f5f9; padding: 8px 12px; border-left: 4px solid #4338ca; margin: 0 0 4px 0;">
            SITE 5-POINT WORK SUMMARY: ${siteName.toUpperCase()}
          </h2>
          <div style="font-size: 10px; font-style: italic; color: #64748b; margin-bottom: 12px;">
            Executive 5-point close-out report and milestones specifically for ${siteName}.
          </div>

          <!-- Site KPI Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10.5px; text-align: center; border: 1px solid #cbd5e1;">
            <thead>
              <tr style="background: #334155; color: #ffffff;">
                <th style="padding: 5px; border: 1px solid #cbd5e1;">Site</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1;">Total Works</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1;">Completed</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1;">Ongoing</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1;">Pending</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1;">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #f8fafc; font-weight: bold;">
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${siteName}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${sTotal}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; color: #15803d;">${sCompleted.length}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; color: #2563eb;">${sOngoing.length}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; color: #d97706;">${sPending.length}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; color: #4338ca;">${sPct}%</td>
              </tr>
            </tbody>
          </table>

          <!-- Point 1 -->
          <div style="margin-bottom: 12px;">
            <strong style="color: #1e293b; font-size: 11px;">1. Where are we on ${siteName}? – Current Progress & Status</strong>
            <div style="background: #f8fafc; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
              ${sQ1.replace(/\n/g, "<br/>")}
            </div>

            <!-- Table of Completed items for this site -->
            <div style="font-weight: bold; color: #15803d; font-size: 10px; margin-top: 8px; margin-bottom: 3px;">
              A. Completed Work Scope on ${siteName} (${sCompleted.length} items):
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-bottom: 8px;">
              <thead>
                <tr style="background: #f1f5f9; color: #334155; text-align: left;">
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 25%;">Unit / Area</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 20%;">Floor</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 35%;">Completed Work Scope</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 20%;">Trade</th>
                </tr>
              </thead>
              <tbody>
                ${
                  sCompleted.length === 0
                    ? `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic; padding: 6px;">No completed items logged for ${siteName}.</td></tr>`
                    : sCompleted
                        .slice(0, 30)
                        .map(
                          (item) => `
                        <tr>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; font-weight: bold;">${item.unitName} - ${item.area}</td>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${item.floorName}</td>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${item.work}</td>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1;"><span style="background: #dcfce7; color: #166534; padding: 1px 4px; border-radius: 3px;">${item.trade || "General"}</span></td>
                        </tr>
                      `
                        )
                        .join("")
                }
              </tbody>
            </table>

            <!-- Table of Ongoing items for this site -->
            <div style="font-weight: bold; color: #2563eb; font-size: 10px; margin-top: 6px; margin-bottom: 3px;">
              B. Ongoing Work Scope on ${siteName} (${sOngoing.length} items):
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1;">
              <thead>
                <tr style="background: #f1f5f9; color: #334155; text-align: left;">
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 25%;">Unit / Area</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 20%;">Floor</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 35%;">Ongoing Work & Notes</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 20%;">Trade</th>
                </tr>
              </thead>
              <tbody>
                ${
                  sOngoing.length === 0
                    ? `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic; padding: 6px;">No ongoing items logged for ${siteName}.</td></tr>`
                    : sOngoing
                        .slice(0, 30)
                        .map(
                          (item) => `
                        <tr>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1; font-weight: bold;">${item.unitName} - ${item.area}</td>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${item.floorName}</td>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1;">${item.work}${item.notes ? ` <em>(${item.notes})</em>` : ""}</td>
                          <td style="padding: 4px 6px; border: 1px solid #cbd5e1;"><span style="background: #dbeafe; color: #1e40af; padding: 1px 4px; border-radius: 3px;">${item.trade || "General"}</span></td>
                        </tr>
                      `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>

          <!-- Point 2 -->
          <div style="margin-bottom: 12px;">
            <strong style="color: #1e293b; font-size: 11px;">2. Where should we be on ${siteName}? – Planned Programme Milestones</strong>
            <div style="background: #f8fafc; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
              ${sQ2.replace(/\n/g, "<br/>")}
            </div>
            ${
              sSitePlanned.length > 0
                ? `<div style="margin-top: 4px; font-size: 10px;"><strong>Milestones Logged:</strong> ${sSitePlanned.map((p) => p.title).join(" • ")}</div>`
                : ""
            }
          </div>

          <!-- Point 3 -->
          <div style="margin-bottom: 12px;">
            <strong style="color: #991b1b; font-size: 11px;">3. Why is there a difference on ${siteName}? – Variances, Delays & Reasons</strong>
            <div style="background: #f8fafc; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
              ${sQ3.replace(/\n/g, "<br/>")}
            </div>
            ${
              sSiteIssues.length > 0
                ? `<div style="margin-top: 4px; font-size: 10px; color: #991b1b;"><strong>Site Blockers:</strong> ${sSiteIssues.map((i) => i.title).join(" • ")}</div>`
                : ""
            }
          </div>

          <!-- Point 4 -->
          <div style="margin-bottom: 12px;">
            <strong style="color: #92400e; font-size: 11px;">4. What are we doing about it on ${siteName}? – Recovery Interventions</strong>
            <div style="background: #f8fafc; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
              ${sQ4.replace(/\n/g, "<br/>")}
            </div>
            ${
              sSiteNextDay.length > 0
                ? `<div style="margin-top: 4px; font-size: 10px; color: #92400e;"><strong>Recovery Actions:</strong> ${sSiteNextDay.map((n) => n.title).join(" • ")}</div>`
                : ""
            }
          </div>

          <!-- Point 5 -->
          <div style="margin-bottom: 14px;">
            <strong style="color: #581c87; font-size: 11px;">5. What do we need from Management for ${siteName}? – Decisions & Approvals</strong>
            <div style="background: #f8fafc; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 3px; font-size: 11px;">
              ${sQ5.replace(/\n/g, "<br/>")}
            </div>
          </div>

          <!-- Photographic Evidence for this Site -->
          ${
            sPhotos.length > 0
              ? `
            <div style="margin-top: 18px; border-top: 2px solid #D4AF37; padding-top: 12px;">
              <strong style="color: #071D49; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                6. Progress Photographic Evidence & Visual Audit for ${siteName} (${sPhotos.length} Verified Photo${sPhotos.length > 1 ? "s" : ""})
              </strong>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 10px;">
                ${sPhotos
                  .map(
                    (p, pIdx) => `
                  <div style="border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                    <!-- BOLD HEADER BAR -->
                    <div style="background: #071D49; color: #ffffff; padding: 6px 10px; font-weight: 800; font-size: 10px; letter-spacing: 0.5px; border-bottom: 2px solid #D4AF37;">
                      PHOTO ${pIdx + 1}: ${p.unitName.toUpperCase()} • ${p.floorName.toUpperCase()} (${p.area.toUpperCase()})
                    </div>
                    <img src="${p.photoUrl}" alt="Site progress visual record" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
                    <!-- BOLD CAPTION BANNER -->
                    <div style="padding: 8px 10px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="background: #e0e7ff; color: #3730a3; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; border: 1px solid #c7d2fe;">
                          TRADE: ${p.trade || "GENERAL"}
                        </span>
                        <span style="background: ${p.status === "Completed" ? "#dcfce7" : "#dbeafe"}; color: ${p.status === "Completed" ? "#166534" : "#1e40af"}; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; border: 1px solid ${p.status === "Completed" ? "#bbf7d0" : "#bfdbfe"};">
                          STATUS: ${p.status.toUpperCase()}
                        </span>
                      </div>
                      <div style="font-size: 10.5px; color: #0f172a; font-weight: 700; line-height: 1.4;">
                        ${p.description || p.work || "Progress inspection photograph."}
                      </div>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("")}

    <!-- Sign-off Block -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 10px; border: 1px solid #cbd5e1; page-break-inside: avoid;">
      <thead>
        <tr style="background: #1e293b; color: #ffffff;">
          <th style="width: 50%; padding: 6px 10px; text-align: left; border: 1px solid #cbd5e1;">Prepared By (Site Engineer / Coordinator)</th>
          <th style="width: 50%; padding: 6px 10px; text-align: left; border: 1px solid #cbd5e1;">Approved By (Project Director / Lead)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 16px 10px 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            Name: ${preparedBy || "Site Coordination Team"}<br/><br/>
            Signature: __________________________<br/>
            Date: ${endDate}
          </td>
          <td style="padding: 16px 10px 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            Name: ${projectManager || "Project Management"}<br/><br/>
            Signature: __________________________<br/>
            Date: ${endDate}
          </td>
        </tr>
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 1.8,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        // Sanitize oklch colors for Tailwind v4 compatibility
        const styles = clonedDoc.querySelectorAll("style");
        styles.forEach((style) => {
          if (style.textContent && style.textContent.includes("oklch")) {
            style.textContent = style.textContent.replace(/oklch\([^)]+\)/gi, "#000000");
          }
        });

        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes("oklch")) {
            htmlEl.style.cssText = htmlEl.style.cssText.replace(/oklch\([^)]+\)/gi, "#000000");
          }
        });
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.9);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Free canvas memory
    canvas.width = 0;
    canvas.height = 0;

    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${cleanTitle}_${startDate}_to_${endDate}.pdf`;
    pdf.save(fileName);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
