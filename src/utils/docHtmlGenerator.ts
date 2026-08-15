import { DocxReportOptions } from "./docxReportGenerator";
import { getSitePlans } from "../lib/plansUtils";

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
      <h1>${title}</h1>
      <div class="subtitle">EXECUTIVE 5-QUESTION PROGRESS SUMMARY & DETAILED SITE AUDIT</div>

      <table class="meta-table">
        <tr><th>Project / Sites:</th><td><strong>${selectedSites.join(", ")}</strong></td></tr>
        <tr><th>Reporting Period:</th><td>${reportType.toUpperCase()} REPORT (${startDate} to ${endDate})</td></tr>
        <tr><th>Prepared By:</th><td>${preparedBy || "Site Coordination Team"}</td></tr>
        <tr><th>Submitted To:</th><td>${managementRecipient || "Executive Project Management & Directors"}</td></tr>
      </table>

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

      <!-- QUESTION 1 -->
      <h2>1. Where are we? – Current Progress & Status of Work</h2>
      <div class="sub-q">Comprehensive breakdown of current progress, completed deliverables, and ongoing site operations.</div>
      <div class="content-box">
        ${q1WhereAreWe.replace(/\n/g, "<br/>")}
      </div>

      <h3 style="color: #15803d; font-size: 11pt; margin-top: 15px;">A. Completed Work Scope in this Period (${completedItems.length} items):</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 20%;">Site / Unit</th>
            <th style="width: 25%;">Floor & Area</th>
            <th style="width: 35%;">Completed Work Scope</th>
            <th style="width: 20%;">Trade</th>
          </tr>
        </thead>
        <tbody>
          ${
            completedItems.length === 0
              ? `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">No items marked as Completed in this reporting period.</td></tr>`
              : completedItems
                  .map(
                    (i) => `
            <tr>
              <td><strong>${i.siteName} - ${i.unitName}</strong></td>
              <td>${i.floorName} / ${i.area}</td>
              <td>${i.work}</td>
              <td><span class="badge badge-completed">${i.trade}</span></td>
            </tr>`
                  )
                  .join("")
          }
        </tbody>
      </table>

      <h3 style="color: #2563eb; font-size: 11pt; margin-top: 15px;">B. Ongoing Work Scope Active on Site (${ongoingItems.length} items):</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 20%;">Site / Unit</th>
            <th style="width: 25%;">Floor & Area</th>
            <th style="width: 35%;">Work Scope & Notes</th>
            <th style="width: 20%;">Trade / Priority</th>
          </tr>
        </thead>
        <tbody>
          ${
            ongoingItems.length === 0
              ? `<tr><td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">No ongoing work items currently logged.</td></tr>`
              : ongoingItems
                  .map(
                    (i) => `
            <tr>
              <td><strong>${i.siteName} - ${i.unitName}</strong></td>
              <td>${i.floorName} / ${i.area}</td>
              <td>${i.work}${i.notes ? ` <em>(${i.notes})</em>` : ""}</td>
              <td><span class="badge badge-progress">${i.trade} [${i.priority}]</span></td>
            </tr>`
                  )
                  .join("")
          }
        </tbody>
      </table>

      <!-- QUESTION 2 -->
      <h2>2. Where should we be? – Planned Progress Based on Approved Programme</h2>
      <div class="sub-q">Target schedule milestones, baseline program expectations, and planned deliverables for the period.</div>
      <div class="content-box">
        ${q2WhereShouldWeBe.replace(/\n/g, "<br/>")}
      </div>
      ${
        plannedList.length > 0
          ? `
        <h3 style="font-size: 11pt; color: #334155;">Programme Target Milestones Logged:</h3>
        <ul>
          ${plannedList.map((p) => `<li><strong>[${p.site}] ${p.title}</strong>${p.notes ? ` – <em>${p.notes}</em>` : ""}</li>`).join("")}
        </ul>`
          : ""
      }

      <!-- QUESTION 3 -->
      <h2>3. Why is there a difference? – Variance, Delays, and Reasons</h2>
      <div class="sub-q">Root cause analysis of schedule variances, on-site blockers, trade dependencies, and material delivery factors.</div>
      <div class="content-box">
        ${q3WhyDifference.replace(/\n/g, "<br/>")}
      </div>
      ${
        allIssues.length > 0
          ? `
        <h3 style="font-size: 11pt; color: #b91c1c;">Site Issues & Challenges Logged:</h3>
        <ul>
          ${allIssues.map((p) => `<li style="color: #991b1b;"><strong>[${p.site}] ${p.title}</strong>${p.notes ? ` – <em>${p.notes}</em>` : ""}</li>`).join("")}
        </ul>`
          : ""
      }

      <!-- QUESTION 4 -->
      <h2>4. What are we doing about it? – Corrective Actions & Recovery Measures</h2>
      <div class="sub-q">Immediate intervention steps, reallocated artisan resources, revised task sequencing, and recovery schedule.</div>
      <div class="content-box">
        ${q4WhatDoingAboutIt.replace(/\n/g, "<br/>")}
      </div>
      ${
        allNextDay.length > 0
          ? `
        <h3 style="font-size: 11pt; color: #1e293b;">Next Recovery Action Plans:</h3>
        <ul>
          ${allNextDay.map((p) => `<li><strong>[${p.site}] ${p.title}</strong>${p.notes ? ` – <em>${p.notes}</em>` : ""}</li>`).join("")}
        </ul>`
          : ""
      }

      <!-- QUESTION 5 -->
      <h2>5. What do we need from Management? – Decisions, Approvals & Resources</h2>
      <div class="sub-q">Explicit approvals, procurement clearances, contractor disbursements, or interventions required from Management.</div>
      <div class="content-box">
        ${q5NeedFromManagement.replace(/\n/g, "<br/>")}
      </div>

      <!-- PHOTOGRAPHIC EVIDENCE -->
      ${
        includePhotos && selectedPhotos && selectedPhotos.length > 0
          ? `
        <h2>6. Progress Photographic Evidence & Site Documentation</h2>
        <div class="sub-q">Verified visual documentation of physical progress achieved during the reporting period.</div>
        <div>
          ${selectedPhotos
            .map(
              (p, idx) => `
            <div class="photo-card">
              <h4 style="color: #1e3a8a; margin: 0 0 8px 0; font-size: 11pt;">Photograph ${idx + 1}: ${p.siteName} – ${p.unitName} (${p.floorName})</h4>
              <img src="${p.photoUrl}" alt="Site progress photo ${idx + 1}" />
              <div class="photo-meta">
                <strong>Area:</strong> ${p.area} | <strong>Trade:</strong> ${p.trade} | <strong>Status:</strong> ${p.status}<br/>
                <strong>Work Progress / Caption:</strong> <em>${p.description || p.work || "Progress photographic record."}</em>
              </div>
            </div>`
            )
            .join("")}
        </div>`
          : ""
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
