import { DocxReportOptions } from "./docxReportGenerator";
import { getSitePlans } from "../lib/plansUtils";
import { GMH_LOGO_SVG } from "./gmhLogoAsset";

export function generateDocFile(options: DocxReportOptions): void {
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

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; margin: 30px; }
        h1 { color: #0f172a; font-size: 18pt; text-align: center; margin-bottom: 4px; text-transform: uppercase; font-weight: bold; }
        .subtitle { color: #4338ca; font-size: 12pt; text-align: center; margin-bottom: 25px; font-weight: bold; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
        .meta-table th, .meta-table td { border: 1px solid #cbd5e1; padding: 8px 12px; }
        .meta-table th { background-color: #1e293b; color: #ffffff; text-align: left; width: 25%; }
        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; text-align: center; font-size: 10pt; }
        .kpi-table th { background-color: #312e81; color: #ffffff; padding: 10px; border: 1px solid #cbd5e1; }
        .kpi-table td { padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12pt; }
        h2 { color: #1e3a8a; font-size: 13pt; margin-top: 25px; margin-bottom: 4px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
        .sub-q { color: #64748b; font-style: italic; font-size: 10pt; margin-bottom: 12px; }
        .content-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
        .data-table { width: 100%; border-collapse: collapse; margin: 12px 0 20px 0; font-size: 9.5pt; }
        .data-table th { background-color: #334155; color: #ffffff; padding: 7px 10px; border: 1px solid #cbd5e1; text-align: left; }
        .data-table td { padding: 7px 10px; border: 1px solid #cbd5e1; vertical-align: top; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5pt; font-weight: bold; }
        .badge-completed { background-color: #dcfce7; color: #15803d; }
        .badge-progress { background-color: #dbeafe; color: #1d4ed8; }
        .photo-card { page-break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 20px; background-color: #ffffff; }
        .photo-card img { max-width: 100%; height: auto; max-height: 380px; display: block; margin: 0 auto 10px auto; border-radius: 6px; border: 1px solid #e2e8f0; }
        .photo-meta { font-size: 9.5pt; color: #334155; }
        .signoff-table { width: 100%; border-collapse: collapse; margin-top: 40px; font-size: 10pt; page-break-inside: avoid; }
        .signoff-table th { background-color: #1e293b; color: white; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
        .signoff-table td { padding: 25px 12px 12px 12px; border: 1px solid #cbd5e1; height: 70px; vertical-align: top; }
      </style>
    </head>
    <body>
      <!-- GMH LUXURY OFFICIAL COVER PAGE BANNER -->
      <div style="background-color: #071D49; color: #ffffff; padding: 24px 20px; border-radius: 8px; border: 2px solid #D4AF37; text-align: center; margin-bottom: 24px;">
        <div style="max-width: 280px; margin: 0 auto 12px auto;">
          ${GMH_LOGO_SVG}
        </div>
        <div style="width: 80px; height: 2px; background-color: #D4AF37; margin: 0 auto 12px auto;"></div>
        <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 17pt; text-transform: uppercase;">${title}</h1>
        <div style="color: #F9E79F; font-size: 10.5pt; font-weight: bold; letter-spacing: 1px; margin-bottom: 16px;">
          EXECUTIVE 5-QUESTION PROGRESS SUMMARY & DETAILED SITE AUDIT
        </div>
        <table class="meta-table" style="background-color: #0c2352; border: 1px solid #D4AF37; margin-bottom: 12px;">
          <tr><th style="background-color: #051433; color: #F9E79F; width: 25%;">Project / Sites:</th><td style="color: #ffffff;"><strong>${selectedSites.join(", ")}</strong></td></tr>
          <tr><th style="background-color: #051433; color: #F9E79F;">Reporting Period:</th><td style="color: #ffffff;">${reportType.toUpperCase()} REPORT (${startDate} to ${endDate})</td></tr>
          <tr><th style="background-color: #051433; color: #F9E79F;">Prepared By:</th><td style="color: #ffffff;">${preparedBy || "Site Coordination Team"}</td></tr>
          <tr><th style="background-color: #051433; color: #F9E79F;">Submitted To:</th><td style="color: #ffffff;">${managementRecipient || "Executive Project Management & Directors"}</td></tr>
        </table>
        <div style="color: #D4AF37; font-size: 8.5pt; letter-spacing: 2px; font-weight: bold;">
          GMH LUXURY • 11 YEARS • BUILT BY VISION, SUSTAINED BY TRUST
        </div>
      </div>

      <table class="kpi-table">
        <tr>
          <th>Total Scope Items</th>
          <th>Completed</th>
          <th>Ongoing</th>
          <th>Pending</th>
          <th>Completion %</th>
        </tr>
        <tr>
          <td>${total}</td>
          <td style="color: #15803d;">${completed}</td>
          <td style="color: #2563eb;">${inProgress}</td>
          <td style="color: #d97706;">${pending}</td>
          <td style="color: #4f46e5;">${overallPct}%</td>
        </tr>
      </table>

      ${
        selectedSites.length > 1
          ? `
        <div style="margin-top: 25px; margin-bottom: 25px; padding: 16px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #1e3a8a; font-size: 13pt; margin-top: 0; margin-bottom: 6px;">
            PART I: CONSOLIDATED EXECUTIVE 5-POINT OVERVIEW
          </h2>
          <div class="sub-q" style="margin-bottom: 15px;">
            Consolidated progress assessment across all ${selectedSites.length} project sites (${selectedSites.join(", ")}).
          </div>

          <h3 style="color: #1e293b; font-size: 11pt; margin-top: 10px;">1. Where are we across all sites? – Progress & Status</h3>
          <div class="content-box">
            ${(q1WhereAreWe || `Currently, overall progress across all selected sites stands at ${overallPct}% completion with ${completed} completed items and ${inProgress} ongoing items.`).replace(/\n/g, "<br/>")}
          </div>

          <h3 style="color: #1e293b; font-size: 11pt; margin-top: 10px;">2. Where should we be? – Programme Milestones</h3>
          <div class="content-box">
            ${(q2WhereShouldWeBe || `Target milestones focus on primary structural works, surface preparation, M&E rough-ins, and scheduled trade close-outs.`).replace(/\n/g, "<br/>")}
          </div>

          <h3 style="color: #1e293b; font-size: 11pt; margin-top: 10px;">3. Why is there a difference? – Variances & Reasons</h3>
          <div class="content-box">
            ${(q3WhyDifference || `Variances are primarily linked to material delivery sequencing, trade dependencies, and artisan gang allocations.`).replace(/\n/g, "<br/>")}
          </div>

          <h3 style="color: #1e293b; font-size: 11pt; margin-top: 10px;">4. What are we doing about it? – Recovery Interventions</h3>
          <div class="content-box">
            ${(q4WhatDoingAboutIt || `Interventions include parallel artisan teams, accelerating sign-offs, and early material procurement.`).replace(/\n/g, "<br/>")}
          </div>

          <h3 style="color: #1e293b; font-size: 11pt; margin-top: 10px;">5. What do we need from Management? – Decisions & Approvals</h3>
          <div class="content-box">
            ${(q5NeedFromManagement || `Expedited review for procurement clearances, subcontractor milestone disbursements, and architectural approvals.`).replace(/\n/g, "<br/>")}
          </div>
        </div>

        <div style="margin-top: 30px; margin-bottom: 15px;">
          <h2 style="color: #1e1b4b; background-color: #e0e7ff; padding: 10px 14px; border-left: 5px solid #4338ca; font-size: 14pt; margin-bottom: 4px;">
            PART II: SITE-BY-SITE 5-POINT WORK SUMMARIES & AUDITS
          </h2>
          <div class="sub-q">Detailed 5-point close-out report, milestone status, and work tables categorized individually for each site.</div>
        </div>
      `
          : ""
      }

      ${
        /* Render 5-Point Summary Categorized by Sites */
        selectedSites.map((siteName) => {
          const sItems = allItems.filter((i) => i.siteName === siteName);
          const sCompleted = sItems.filter((i) => i.status === "Completed");
          const sOngoing = sItems.filter((i) => i.status === "In Progress");
          const sPending = sItems.filter((i) => i.status === "Pending");
          const sTotal = sItems.length;
          const sPct = sTotal > 0 ? Math.round((sCompleted.length / sTotal) * 100) : 0;

          const siteSummary = options.siteSummaries?.[siteName] || {};
          const sQ1 = siteSummary.q1WhereAreWe || (selectedSites.length === 1 ? q1WhereAreWe : "") ||
            `Current project execution on site "${siteName}" stands at ${sPct}% physical completion. A total of ${sCompleted.length} work items have been fully completed and inspected, ${sOngoing.length} items are actively ongoing across units and floors, and ${sPending.length} items remain in the preparatory pipeline.`;
          const sQ2 = siteSummary.q2WhereShouldWeBe || (selectedSites.length === 1 ? q2WhereShouldWeBe : "") ||
            `According to the approved schedule and target milestones for ${siteName} (${reportType === "weekly" ? "this week" : "this month"}), planned deliverables focus on concluding primary trade works, floor finishes, and surface preparation.`;
          const sQ3 = siteSummary.q3WhyDifference || (selectedSites.length === 1 ? q3WhyDifference : "") ||
            `Schedule variances and on-site delays for ${siteName} during this period were primarily driven by material delivery sequence, trade overlaps, and specialized artisan attendance.`;
          const sQ4 = siteSummary.q4WhatDoingAboutIt || (selectedSites.length === 1 ? q4WhatDoingAboutIt : "") ||
            `To recover time and attain milestones on ${siteName}, the site team has deployed immediate corrective interventions, reallocated parallel artisan gangs, and prioritized critical path units.`;
          const sQ5 = siteSummary.q5NeedFromManagement || (selectedSites.length === 1 ? q5NeedFromManagement : "") ||
            `To sustain momentum on ${siteName} without disruption, the site team requests Management review and clearance on pending procurement requisitions and stage disbursements.`;

          const sSitePlans = getSitePlans(sites, siteName);
          const sSiteIssues = sSitePlans.issuesAndChallenges || [];
          const sSiteNextDay = sSitePlans.nextDayPlan || [];
          const sSiteWeekly = sSitePlans.weeklyPlan || [];
          const sSiteMonthly = sSitePlans.monthlyPlan || [];
          const sSitePlanned = reportType === "monthly" ? sSiteMonthly : sSiteWeekly;

          return `
            <div style="margin-top: 30px; border-top: 2px solid #4f46e5; padding-top: 15px;">
              <h2 style="color: #1e1b4b; background-color: #f1f5f9; padding: 10px 14px; border-left: 5px solid #4f46e5; font-size: 13pt; margin-bottom: 4px;">
                SITE 5-POINT WORK SUMMARY: ${siteName.toUpperCase()}
              </h2>
              <div class="sub-q" style="margin-bottom: 12px;">Executive 5-point close-out report and milestones specifically for ${siteName}.</div>

              <!-- Site KPI Mini-Table -->
              <table class="kpi-table" style="margin-bottom: 18px;">
                <tr>
                  <th>Site Name</th>
                  <th>Total Works</th>
                  <th>Completed</th>
                  <th>Ongoing</th>
                  <th>Pending</th>
                  <th>Completion Rate</th>
                </tr>
                <tr>
                  <td><strong>${siteName}</strong></td>
                  <td>${sTotal}</td>
                  <td style="color: #15803d;"><strong>${sCompleted.length}</strong></td>
                  <td style="color: #2563eb;"><strong>${sOngoing.length}</strong></td>
                  <td style="color: #d97706;"><strong>${sPending.length}</strong></td>
                  <td style="color: #4f46e5;"><strong>${sPct}%</strong></td>
                </tr>
              </table>

              <!-- Point 1 -->
              <h3 style="color: #1e293b; font-size: 11pt; margin-top: 15px;">1. Where are we on ${siteName}? – Current Progress & Status</h3>
              <div class="content-box">
                ${sQ1.replace(/\n/g, "<br/>")}
              </div>

              <h4 style="color: #15803d; font-size: 10pt; margin-top: 10px; margin-bottom: 4px;">A. Completed Work Scope on ${siteName} (${sCompleted.length} items):</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 25%;">Unit / Area</th>
                    <th style="width: 20%;">Floor Level</th>
                    <th style="width: 35%;">Completed Work Scope</th>
                    <th style="width: 20%;">Trade</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    sCompleted.length === 0
                      ? `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">No items marked as Completed for ${siteName} in this period.</td></tr>`
                      : sCompleted.slice(0, 40).map((i) => `
                        <tr>
                          <td><strong>${i.unitName} - ${i.area}</strong></td>
                          <td>${i.floorName}</td>
                          <td>${i.work}</td>
                          <td><span class="badge badge-completed">${i.trade || "General"}</span></td>
                        </tr>
                      `).join("")
                  }
                </tbody>
              </table>

              <h4 style="color: #2563eb; font-size: 10pt; margin-top: 12px; margin-bottom: 4px;">B. Ongoing Work Scope on ${siteName} (${sOngoing.length} items):</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 25%;">Unit / Area</th>
                    <th style="width: 20%;">Floor Level</th>
                    <th style="width: 35%;">Work Scope & Notes</th>
                    <th style="width: 20%;">Trade / Priority</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    sOngoing.length === 0
                      ? `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">No ongoing work items currently logged for ${siteName}.</td></tr>`
                      : sOngoing.slice(0, 40).map((i) => `
                        <tr>
                          <td><strong>${i.unitName} - ${i.area}</strong></td>
                          <td>${i.floorName}</td>
                          <td>${i.work}${i.notes ? ` <em>(${i.notes})</em>` : ""}</td>
                          <td><span class="badge badge-progress">${i.trade || "General"} [${i.priority || "Medium"}]</span></td>
                        </tr>
                      `).join("")
                  }
                </tbody>
              </table>

              <!-- Point 2 -->
              <h3 style="color: #1e293b; font-size: 11pt; margin-top: 16px;">2. Where should we be on ${siteName}? – Planned Programme Milestones</h3>
              <div class="content-box">
                ${sQ2.replace(/\n/g, "<br/>")}
              </div>
              ${
                sSitePlanned.length > 0
                  ? `<div style="margin-top: 6px; font-size: 10pt;"><strong>Target Milestones Logged:</strong>
                     <ul>
                       ${sSitePlanned.map((p) => `<li><strong>${p.title}</strong>${p.notes ? ` – <em>${p.notes}</em>` : ""}</li>`).join("")}
                     </ul></div>`
                  : ""
              }

              <!-- Point 3 -->
              <h3 style="color: #1e293b; font-size: 11pt; margin-top: 16px;">3. Why is there a difference on ${siteName}? – Variances, Delays & Reasons</h3>
              <div class="content-box">
                ${sQ3.replace(/\n/g, "<br/>")}
              </div>
              ${
                sSiteIssues.length > 0
                  ? `<div style="margin-top: 6px; font-size: 10pt;"><strong style="color: #b91c1c;">Site Issues & Blockers:</strong>
                     <ul>
                       ${sSiteIssues.map((i) => `<li style="color: #991b1b;"><strong>${i.title}</strong>${i.notes ? ` – <em>${i.notes}</em>` : ""}</li>`).join("")}
                     </ul></div>`
                  : ""
              }

              <!-- Point 4 -->
              <h3 style="color: #1e293b; font-size: 11pt; margin-top: 16px;">4. What are we doing about it on ${siteName}? – Corrective Actions & Recovery</h3>
              <div class="content-box">
                ${sQ4.replace(/\n/g, "<br/>")}
              </div>
              ${
                sSiteNextDay.length > 0
                  ? `<div style="margin-top: 6px; font-size: 10pt;"><strong>Corrective Action Steps:</strong>
                     <ul>
                       ${sSiteNextDay.map((n) => `<li><strong>${n.title}</strong>${n.notes ? ` – <em>${n.notes}</em>` : ""}</li>`).join("")}
                     </ul></div>`
                  : ""
              }

              <!-- Point 5 -->
              <h3 style="color: #1e293b; font-size: 11pt; margin-top: 16px;">5. What do we need from Management for ${siteName}? – Decisions & Approvals</h3>
              <div class="content-box">
                ${sQ5.replace(/\n/g, "<br/>")}
              </div>

              <!-- Site-Categorized Photographic Evidence -->
              ${(() => {
                const sPhotos = includePhotos && selectedPhotos
                  ? selectedPhotos.filter((p) => p.siteName === siteName)
                  : [];
                if (sPhotos.length === 0) return "";
                return `
                  <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 14px;">
                    <h3 style="color: #1e3a8a; font-size: 11pt; margin-top: 0; margin-bottom: 4px;">
                      6. Photographic Evidence & Visual Records for ${siteName} (${sPhotos.length} Photo${sPhotos.length > 1 ? "s" : ""})
                    </h3>
                    <div class="sub-q" style="margin-bottom: 12px;">Verified visual documentation of physical progress achieved on ${siteName}.</div>
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                      ${sPhotos
                        .map(
                          (p, pIdx) => `
                        <div class="photo-card" style="page-break-inside: avoid; border: 1px solid #cbd5e1; margin-bottom: 16px; background: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                          <div style="background-color: #071D49; color: #ffffff; padding: 7px 12px; font-weight: bold; font-size: 10pt; border-bottom: 2px solid #D4AF37;">
                            PHOTO ${pIdx + 1}: ${p.siteName.toUpperCase()} – ${p.unitName.toUpperCase()} (${p.floorName.toUpperCase()} - ${p.area.toUpperCase()})
                          </div>
                          <div style="padding: 10px;">
                            <img src="${p.photoUrl}" alt="Site progress photo ${pIdx + 1}" style="max-width: 560px; width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 4px; display: block; margin-bottom: 8px;" />
                            <div class="photo-meta" style="font-size: 9.5pt; color: #1e293b; background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; line-height: 1.4;">
                              <div style="margin-bottom: 4px;">
                                <span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8.5pt;">TRADE: ${p.trade || "GENERAL"}</span>
                                &nbsp;
                                <span style="background-color: ${p.status === "Completed" ? "#dcfce7" : "#dbeafe"}; color: ${p.status === "Completed" ? "#166534" : "#1e40af"}; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8.5pt;">STATUS: ${p.status.toUpperCase()}</span>
                              </div>
                              <div style="font-weight: bold; color: #0f172a; margin-top: 4px;">
                                ${p.description || p.work || "Progress photographic record."}
                              </div>
                            </div>
                          </div>
                        </div>`
                        )
                        .join("")}
                    </div>
                  </div>
                `;
              })()}
            </div>
          `;
        }).join("")
      }

      <table class="signoff-table">
        <tr>
          <th style="width: 50%;">Prepared By (Site Engineer / Coordinator)</th>
          <th style="width: 50%;">Approved By (Project Director / Lead)</th>
        </tr>
        <tr>
          <td>
            Name: ${preparedBy}<br/>
            Signature: __________________________<br/>
            Date: ${endDate}
          </td>
          <td>
            Name: ${projectManager || "Project Management"}<br/>
            Signature: __________________________<br/>
            Date: ${endDate}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + docHtml], { type: "application/msword;charset=utf-8" });
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${cleanTitle}_${startDate}_to_${endDate}.doc`;
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
