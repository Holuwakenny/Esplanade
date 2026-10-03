import PptxGenJS from "pptxgenjs";
import { DocxReportOptions } from "./docxReportGenerator";
import { getSitePlans } from "../lib/plansUtils";
import { getGmhLogoDataUrl } from "./gmhLogoAsset";

export async function generateExecutivePptxReport(options: DocxReportOptions): Promise<void> {
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

  // Initialize PptxGenJS instance
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9"; // 10 x 5.625 inches
  pptx.author = preparedBy || "GMH Luxury Site Coordination Team";
  pptx.company = "GMH LUXURY";
  pptx.title = title;
  pptx.subject = "Executive 5-Question Progress Summary & Detailed Site Audit";

  const logoDataUrl = await getGmhLogoDataUrl();

  // Color Palette Constants
  const C_NAVY = "071D49";
  const C_NAVY_DARK = "040F27";
  const C_NAVY_LIGHT = "0F2B66";
  const C_GOLD = "D4AF37";
  const C_GOLD_LIGHT = "F9E79F";
  const C_GOLD_DARK = "AA7C11";
  const C_WHITE = "FFFFFF";
  const C_SLATE_50 = "F8FAFC";
  const C_SLATE_100 = "F1F5F9";
  const C_SLATE_200 = "E2E8F0";
  const C_SLATE_700 = "334155";
  const C_SLATE_800 = "1E293B";
  const C_GREEN = "15803D";
  const C_BLUE = "2563EB";
  const C_AMBER = "D97706";
  const C_PURPLE = "7C3AED";
  const C_RED = "DC2626";

  // =========================================================================
  // SLIDE 1: LUXURY EXECUTIVE COVER PAGE
  // =========================================================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: C_NAVY };

  // Subtle luxury gold top border accent
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.12,
    fill: { color: C_GOLD },
  });

  // Official GMH Luxury 11-Years Logo Banner
  slide1.addImage({
    data: logoDataUrl,
    x: 3.25,
    y: 0.45,
    w: 3.5,
    h: 1.75,
  });

  // Thin Gold Line Separator
  slide1.addShape(pptx.ShapeType.line, {
    x: 1.5,
    y: 2.35,
    w: 7.0,
    h: 0,
    line: { color: C_GOLD, width: 2 },
  });

  // Title & Subtitle
  slide1.addText(title.toUpperCase(), {
    x: 0.8,
    y: 2.5,
    w: 8.4,
    h: 0.8,
    fontSize: 22,
    fontFace: "Arial",
    bold: true,
    color: C_WHITE,
    align: "center",
  });

  slide1.addText("EXECUTIVE 5-QUESTION PROGRESS SUMMARY & DETAILED SITE AUDIT", {
    x: 0.8,
    y: 3.3,
    w: 8.4,
    h: 0.35,
    fontSize: 12,
    fontFace: "Arial",
    bold: true,
    color: C_GOLD_LIGHT,
    align: "center",
  });

  // Metadata Card Box
  slide1.addShape(pptx.ShapeType.rect, {
    x: 1.5,
    y: 3.8,
    w: 7.0,
    h: 1.45,
    fill: { color: C_NAVY_LIGHT },
    line: { color: C_GOLD, width: 1.5 },
  });

  // Metadata details inside card
  const metaRows = [
    [
      { text: "Project / Sites:", options: { bold: true, color: C_GOLD, fontSize: 10, fontFace: "Arial" } },
      { text: selectedSites.join(", "), options: { bold: true, color: C_WHITE, fontSize: 10, fontFace: "Arial" } },
      { text: "Reporting Period:", options: { bold: true, color: C_GOLD, fontSize: 10, fontFace: "Arial" } },
      { text: `${reportType.toUpperCase()} (${startDate} to ${endDate})`, options: { color: C_WHITE, fontSize: 10, fontFace: "Arial" } },
    ],
    [
      { text: "Prepared By:", options: { bold: true, color: C_GOLD, fontSize: 10, fontFace: "Arial" } },
      { text: preparedBy || "Site Coordination Team", options: { color: C_WHITE, fontSize: 10, fontFace: "Arial" } },
      { text: "Submitted To:", options: { bold: true, color: C_GOLD, fontSize: 10, fontFace: "Arial" } },
      { text: managementRecipient || "Executive Project Management", options: { color: C_WHITE, fontSize: 10, fontFace: "Arial" } },
    ],
  ];

  slide1.addTable(metaRows as any, {
    x: 1.65,
    y: 3.9,
    w: 6.7,
    h: 1.25,
    colW: [1.3, 2.1, 1.3, 2.0],
    border: { pt: 0, color: C_NAVY_LIGHT },
    margin: 3,
  });

  // Bottom Footer Bar
  slide1.addText("GMH LUXURY • 11 YEARS • BUILT BY VISION, SUSTAINED BY TRUST", {
    x: 0.5,
    y: 5.35,
    w: 9.0,
    h: 0.25,
    fontSize: 9,
    fontFace: "Arial",
    color: C_GOLD,
    align: "center",
  });

  // Helper function to create standard slide header with GMH luxury styling
  const createSlideHeader = (slide: PptxGenJS.Slide, heading: string, sub: string) => {
    // Navy top bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.85,
      fill: { color: C_NAVY },
    });

    // Gold accent hairline
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0.85,
      w: "100%",
      h: 0.05,
      fill: { color: C_GOLD },
    });

    // Heading text
    slide.addText(heading.toUpperCase(), {
      x: 0.6,
      y: 0.12,
      w: 6.8,
      h: 0.4,
      fontSize: 15,
      fontFace: "Arial",
      bold: true,
      color: C_WHITE,
    });

    // Subtitle text
    slide.addText(sub, {
      x: 0.6,
      y: 0.48,
      w: 6.8,
      h: 0.3,
      fontSize: 9.5,
      fontFace: "Arial",
      color: C_GOLD_LIGHT,
    });

    // GMH Logo in top right
    slide.addImage({
      data: logoDataUrl,
      x: 8.0,
      y: 0.08,
      w: 1.5,
      h: 0.72,
    });

    // Bottom standard footer
    slide.addText(`GMH LUXURY | ${selectedSites.join(", ")} | ${reportType.toUpperCase()} REPORT`, {
      x: 0.6,
      y: 5.35,
      w: 8.8,
      h: 0.22,
      fontSize: 8,
      fontFace: "Arial",
      color: C_SLATE_700,
    });
  };

  // =========================================================================
  // SLIDE 2: EXECUTIVE PROGRESS KPI DASHBOARD
  // =========================================================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: C_SLATE_50 };
  createSlideHeader(
    slide2,
    "Executive Progress Dashboard Metrics",
    `Consolidated deliverables & scope completion status (${startDate} to ${endDate})`
  );

  // 5 KPI Metric Cards
  const cardW = 1.65;
  const cardH = 1.35;
  const cardY = 1.15;
  const cardGap = 0.15;
  const startX = 0.55;

  const kpis = [
    { title: "TOTAL SCOPE", value: `${total}`, color: C_NAVY, sub: "Total Items" },
    { title: "COMPLETED", value: `${completed}`, color: C_GREEN, sub: "Signed Off" },
    { title: "ONGOING", value: `${inProgress}`, color: C_BLUE, sub: "Active on Site" },
    { title: "PENDING", value: `${pending}`, color: C_AMBER, sub: "In Pipeline" },
    { title: "COMPLETION", value: `${overallPct}%`, color: C_GOLD_DARK, sub: "Physical Velocity" },
  ];

  kpis.forEach((k, idx) => {
    const x = startX + idx * (cardW + cardGap);
    // Card background
    slide2.addShape(pptx.ShapeType.rect, {
      x,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: C_WHITE },
      line: { color: C_SLATE_200, width: 1.5 },
    });

    // Top color strip
    slide2.addShape(pptx.ShapeType.rect, {
      x,
      y: cardY,
      w: cardW,
      h: 0.1,
      fill: { color: k.color },
    });

    // Card Title
    slide2.addText(k.title, {
      x,
      y: cardY + 0.18,
      w: cardW,
      h: 0.25,
      fontSize: 9,
      fontFace: "Arial",
      bold: true,
      color: C_SLATE_700,
      align: "center",
    });

    // Card Value
    slide2.addText(k.value, {
      x,
      y: cardY + 0.42,
      w: cardW,
      h: 0.55,
      fontSize: 24,
      fontFace: "Arial",
      bold: true,
      color: k.color,
      align: "center",
    });

    // Card Subtitle
    slide2.addText(k.sub, {
      x,
      y: cardY + 0.98,
      w: cardW,
      h: 0.25,
      fontSize: 8.5,
      fontFace: "Arial",
      color: C_SLATE_700,
      align: "center",
    });
  });

  // Progress Bar Visualization
  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 2.7,
    w: 8.85,
    h: 0.35,
    fill: { color: C_SLATE_200 },
  });

  const filledW = (8.85 * overallPct) / 100;
  if (filledW > 0) {
    slide2.addShape(pptx.ShapeType.rect, {
      x: 0.55,
      y: 2.7,
      w: Math.max(0.2, filledW),
      h: 0.35,
      fill: { color: C_NAVY },
    });
  }

  slide2.addText(`OVERALL COMPLETION BENCHMARK: ${overallPct}% ACHIEVED`, {
    x: 0.55,
    y: 2.72,
    w: 8.85,
    h: 0.32,
    fontSize: 9.5,
    fontFace: "Arial",
    bold: true,
    color: overallPct > 40 ? C_WHITE : C_NAVY,
    align: "center",
  });

  // Executive Scope Takeaways Box
  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 3.25,
    w: 8.85,
    h: 1.95,
    fill: { color: C_WHITE },
    line: { color: C_SLATE_200, width: 1.5 },
  });

  slide2.addText("EXECUTIVE TAKEAWAYS & WORK VELOCITY SUMMARY", {
    x: 0.75,
    y: 3.35,
    w: 8.4,
    h: 0.25,
    fontSize: 10.5,
    fontFace: "Arial",
    bold: true,
    color: C_NAVY,
  });

  const takeaways = [
    `• Total Work Scope: ${total} tracked work deliverables across ${selectedSites.length} project site(s) (${selectedSites.join(", ")}).`,
    `• Completed Deliverables: ${completed} items (${overallPct}%) have been fully inspected, verified, and signed off.`,
    `• Active Operations: ${inProgress} items currently have active artisan gangs and trade supervisors deployed on site.`,
    `• Strategic Pipeline: ${pending} items scheduled for commencement following trade handovers and stage sign-offs.`,
    `• Management Attention: Timely approval of material requisitions and milestone sign-offs will preserve recovery acceleration.`,
  ];

  slide2.addText(takeaways.join("\n\n"), {
    x: 0.75,
    y: 3.65,
    w: 8.4,
    h: 1.45,
    fontSize: 9.5,
    fontFace: "Arial",
    color: C_SLATE_800,
    lineSpacing: 16,
  });

  // =========================================================================
  // SLIDE 3: IF MULTIPLE SITES -> CONSOLIDATED 5-POINT PORTFOLIO OVERVIEW
  // =========================================================================
  if (selectedSites.length > 1) {
    const slide3 = pptx.addSlide();
    slide3.background = { color: C_SLATE_50 };
    createSlideHeader(
      slide3,
      "Part I: Consolidated Executive 5-Point Portfolio Overview",
      `High-level progress synthesis across all ${selectedSites.length} project sites`
    );

    const questions5 = [
      {
        num: "1",
        title: "Where are we across all sites? – Progress & Status",
        color: C_NAVY,
        body: q1WhereAreWe || `Aggregate physical execution across all selected sites stands at ${overallPct}% completion with ${completed} completed items and ${inProgress} ongoing operations.`,
      },
      {
        num: "2",
        title: "Where should we be? – Programme Milestones",
        color: C_BLUE,
        body: q2WhereShouldWeBe || `Target milestones focus on primary structural works, surface preparation, M&E rough-ins, and scheduled trade close-outs.`,
      },
      {
        num: "3",
        title: "Why is there a difference? – Variances & Reasons",
        color: C_RED,
        body: q3WhyDifference || `Schedule variances are primarily driven by material delivery sequences, trade dependencies, and artisan gang attendance.`,
      },
      {
        num: "4",
        title: "What are we doing about it? – Recovery Interventions",
        color: C_AMBER,
        body: q4WhatDoingAboutIt || `Interventions deployed include parallel artisan teams, accelerated milestone sign-offs, and early material procurement.`,
      },
      {
        num: "5",
        title: "What do we need from Management? – Decisions & Approvals",
        color: C_PURPLE,
        body: q5NeedFromManagement || `Expedited review for procurement clearances, subcontractor milestone disbursements, and architectural approvals.`,
      },
    ];

    const qYStart = 1.05;
    const qH = 0.8;
    const qGap = 0.06;

    questions5.forEach((q, idx) => {
      const y = qYStart + idx * (qH + qGap);

      // Card box
      slide3.addShape(pptx.ShapeType.rect, {
        x: 0.55,
        y,
        w: 8.85,
        h: qH,
        fill: { color: C_WHITE },
        line: { color: C_SLATE_200, width: 1.2 },
      });

      // Left color indicator
      slide3.addShape(pptx.ShapeType.rect, {
        x: 0.55,
        y,
        w: 0.15,
        h: qH,
        fill: { color: q.color },
      });

      // Title
      slide3.addText(q.title, {
        x: 0.8,
        y: y + 0.06,
        w: 8.5,
        h: 0.22,
        fontSize: 9.5,
        fontFace: "Arial",
        bold: true,
        color: q.color,
      });

      // Body text
      slide3.addText(q.body, {
        x: 0.8,
        y: y + 0.28,
        w: 8.5,
        h: 0.48,
        fontSize: 8.5,
        fontFace: "Arial",
        color: C_SLATE_800,
      });
    });
  }

  // =========================================================================
  // SITE-BY-SITE DETAILED AUDITS & HIGH-QUALITY PHOTOGRAPHIC EVIDENCE
  // =========================================================================
  for (const siteName of selectedSites) {
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

    // -----------------------------------------------------------------------
    // SLIDE A: SITE 5-POINT WORK SUMMARY
    // -----------------------------------------------------------------------
    const siteSlide1 = pptx.addSlide();
    siteSlide1.background = { color: C_SLATE_50 };
    createSlideHeader(
      siteSlide1,
      `Site 5-Point Summary: ${siteName.toUpperCase()}`,
      `Comprehensive 5-point close-out report • ${sPct}% Complete (${sCompleted.length}/${sTotal} items)`
    );

    // Site Mini KPI Bar
    const sKpis = [
      { label: "Total Scope", val: `${sTotal}` },
      { label: "Completed", val: `${sCompleted.length}`, col: C_GREEN },
      { label: "Ongoing", val: `${sOngoing.length}`, col: C_BLUE },
      { label: "Pending", val: `${sPending.length}`, col: C_AMBER },
      { label: "Completion Rate", val: `${sPct}%`, col: C_NAVY },
    ];

    sKpis.forEach((k, idx) => {
      const x = 0.55 + idx * 1.8;
      siteSlide1.addShape(pptx.ShapeType.rect, {
        x,
        y: 1.05,
        w: 1.65,
        h: 0.55,
        fill: { color: C_WHITE },
        line: { color: C_SLATE_200, width: 1 },
      });
      siteSlide1.addText(k.label.toUpperCase(), {
        x,
        y: 1.08,
        w: 1.65,
        h: 0.2,
        fontSize: 7.5,
        fontFace: "Arial",
        bold: true,
        color: C_SLATE_700,
        align: "center",
      });
      siteSlide1.addText(k.val, {
        x,
        y: 1.25,
        w: 1.65,
        h: 0.3,
        fontSize: 13,
        fontFace: "Arial",
        bold: true,
        color: k.col || C_NAVY,
        align: "center",
      });
    });

    // 5 Question Cards for this site
    const sitePoints = [
      { num: "1", title: `1. Where are we on ${siteName}? – Progress & Status`, body: sQ1, col: C_NAVY },
      { num: "2", title: `2. Where should we be on ${siteName}? – Milestones`, body: sQ2, col: C_BLUE },
      { num: "3", title: `3. Why is there a difference on ${siteName}? – Variances`, body: sQ3, col: C_RED },
      { num: "4", title: `4. What are we doing about it on ${siteName}? – Interventions`, body: sQ4, col: C_AMBER },
      { num: "5", title: `5. What do we need from Management for ${siteName}?`, body: sQ5, col: C_PURPLE },
    ];

    const sQStartY = 1.75;
    const sQH = 0.67;
    const sQGap = 0.05;

    sitePoints.forEach((p, pIdx) => {
      const y = sQStartY + pIdx * (sQH + sQGap);
      siteSlide1.addShape(pptx.ShapeType.rect, {
        x: 0.55,
        y,
        w: 8.85,
        h: sQH,
        fill: { color: C_WHITE },
        line: { color: C_SLATE_200, width: 1 },
      });
      siteSlide1.addShape(pptx.ShapeType.rect, {
        x: 0.55,
        y,
        w: 0.12,
        h: sQH,
        fill: { color: p.col },
      });
      siteSlide1.addText(p.title, {
        x: 0.75,
        y: y + 0.04,
        w: 8.55,
        h: 0.2,
        fontSize: 9,
        fontFace: "Arial",
        bold: true,
        color: p.col,
      });
      siteSlide1.addText(p.body, {
        x: 0.75,
        y: y + 0.24,
        w: 8.55,
        h: 0.4,
        fontSize: 8,
        fontFace: "Arial",
        color: C_SLATE_800,
      });
    });

    // -----------------------------------------------------------------------
    // SLIDE B: SITE WORK SCOPE STATUS (COMPLETED & ONGOING TABLES)
    // -----------------------------------------------------------------------
    const siteSlide2 = pptx.addSlide();
    siteSlide2.background = { color: C_SLATE_50 };
    createSlideHeader(
      siteSlide2,
      `Work Scope Status: ${siteName.toUpperCase()}`,
      `Completed (${sCompleted.length}) and Active Ongoing (${sOngoing.length}) trade deliverables`
    );

    // Completed Table (Top Half)
    siteSlide2.addText(`A. COMPLETED WORK SCOPE (${sCompleted.length} items signed off)`, {
      x: 0.55,
      y: 1.0,
      w: 8.85,
      h: 0.25,
      fontSize: 10,
      fontFace: "Arial",
      bold: true,
      color: C_GREEN,
    });

    const compRows: any[] = [
      [
        { text: "Unit / Area", options: { bold: true, fill: { color: "DCFCE7" }, color: "166534", fontSize: 8.5 } },
        { text: "Floor", options: { bold: true, fill: { color: "DCFCE7" }, color: "166534", fontSize: 8.5 } },
        { text: "Completed Work Scope", options: { bold: true, fill: { color: "DCFCE7" }, color: "166534", fontSize: 8.5 } },
        { text: "Trade", options: { bold: true, fill: { color: "DCFCE7" }, color: "166534", fontSize: 8.5 } },
      ],
    ];

    if (sCompleted.length === 0) {
      compRows.push([
        { text: "No completed items logged for this period", options: { fontSize: 8, color: C_SLATE_700 } } as any,
        { text: "-", options: { fontSize: 8 } },
        { text: "-", options: { fontSize: 8 } },
        { text: "-", options: { fontSize: 8 } },
      ]);
    } else {
      sCompleted.slice(0, 5).forEach((item) => {
        compRows.push([
          { text: `${item.unitName} - ${item.area}`, options: { fontSize: 8, bold: true, color: C_SLATE_800 } },
          { text: item.floorName, options: { fontSize: 8, color: C_SLATE_800 } },
          { text: item.work, options: { fontSize: 8, color: C_SLATE_800 } },
          { text: item.trade || "General", options: { fontSize: 8, bold: true, color: C_GREEN } },
        ]);
      });
    }

    siteSlide2.addTable(compRows as any, {
      x: 0.55,
      y: 1.25,
      w: 8.85,
      colW: [2.5, 1.2, 3.8, 1.35],
      border: { pt: 0.5, color: C_SLATE_200 },
      fill: { color: C_WHITE },
      margin: 2.5,
    });

    // Ongoing Table (Bottom Half)
    const ongoingY = 3.15;
    siteSlide2.addText(`B. ACTIVE ONGOING WORK SCOPE (${sOngoing.length} items in progress)`, {
      x: 0.55,
      y: ongoingY,
      w: 8.85,
      h: 0.25,
      fontSize: 10,
      fontFace: "Arial",
      bold: true,
      color: C_BLUE,
    });

    const ongoingTableRows: any[] = [
      [
        { text: "Unit / Area", options: { bold: true, fill: { color: "DBEAFE" }, color: "1E40AF", fontSize: 8.5 } },
        { text: "Floor", options: { bold: true, fill: { color: "DBEAFE" }, color: "1E40AF", fontSize: 8.5 } },
        { text: "Active Ongoing Work & Notes", options: { bold: true, fill: { color: "DBEAFE" }, color: "1E40AF", fontSize: 8.5 } },
        { text: "Trade", options: { bold: true, fill: { color: "DBEAFE" }, color: "1E40AF", fontSize: 8.5 } },
      ],
    ];

    if (sOngoing.length === 0) {
      ongoingTableRows.push([
        { text: "No ongoing items recorded for this period", options: { fontSize: 8, color: C_SLATE_700 } } as any,
        { text: "-", options: { fontSize: 8 } },
        { text: "-", options: { fontSize: 8 } },
        { text: "-", options: { fontSize: 8 } },
      ]);
    } else {
      sOngoing.slice(0, 5).forEach((item) => {
        ongoingTableRows.push([
          { text: `${item.unitName} - ${item.area}`, options: { fontSize: 8, bold: true, color: C_SLATE_800 } },
          { text: item.floorName, options: { fontSize: 8, color: C_SLATE_800 } },
          { text: item.work + (item.notes ? ` (${item.notes})` : ""), options: { fontSize: 8, color: C_SLATE_800 } },
          { text: item.trade || "General", options: { fontSize: 8, bold: true, color: C_BLUE } },
        ]);
      });
    }

    siteSlide2.addTable(ongoingTableRows as any, {
      x: 0.55,
      y: ongoingY + 0.25,
      w: 8.85,
      colW: [2.5, 1.2, 3.8, 1.35],
      border: { pt: 0.5, color: C_SLATE_200 },
      fill: { color: C_WHITE },
      margin: 2.5,
    });

    // -----------------------------------------------------------------------
    // SLIDE C: PROGRESS PHOTOGRAPHIC EVIDENCE WITH NEAT DESIGN & BOLD CAPTIONS!
    // -----------------------------------------------------------------------
    if (includePhotos) {
      const sitePhotos = (selectedPhotos || []).filter((p) => p.siteName === siteName);

      if (sitePhotos.length > 0) {
        // Chunk photos 2 per slide for high picture quality & clean layout
        const photoChunks: typeof sitePhotos[] = [];
        for (let i = 0; i < sitePhotos.length; i += 2) {
          photoChunks.push(sitePhotos.slice(i, i + 2));
        }

        photoChunks.forEach((chunk, chunkIdx) => {
          const photoSlide = pptx.addSlide();
          photoSlide.background = { color: C_SLATE_50 };
          createSlideHeader(
            photoSlide,
            `Photographic Evidence: ${siteName.toUpperCase()} (Part ${chunkIdx + 1})`,
            `High-definition progress documentation with verified site inspections`
          );

          chunk.forEach((photo, pIdx) => {
            const pX = pIdx === 0 ? 0.65 : 5.15;
            const pY = 1.1;
            const pW = 4.2;
            const imgH = 2.45;
            const cardH = 3.95;

            // Photo Container Card
            photoSlide.addShape(pptx.ShapeType.rect, {
              x: pX,
              y: pY,
              w: pW,
              h: cardH,
              fill: { color: C_WHITE },
              line: { color: C_SLATE_200, width: 1.5 },
            });

            // The Image
            if (photo.photoUrl) {
              photoSlide.addImage({
                path: photo.photoUrl,
                x: pX + 0.1,
                y: pY + 0.1,
                w: pW - 0.2,
                h: imgH,
                sizing: { type: "cover", w: pW - 0.2, h: imgH },
              });
            }

            // ================= BOLD CAPTION BANNER =================
            const capY = pY + imgH + 0.15;

            // Caption Header Strip: Unit & Floor in Bold Navy
            photoSlide.addShape(pptx.ShapeType.rect, {
              x: pX + 0.1,
              y: capY,
              w: pW - 0.2,
              h: 0.3,
              fill: { color: C_NAVY },
            });

            photoSlide.addText(
              `${photo.unitName.toUpperCase()} • ${photo.floorName.toUpperCase()} • ${photo.area.toUpperCase()}`,
              {
                x: pX + 0.15,
                y: capY + 0.04,
                w: pW - 0.3,
                h: 0.22,
                fontSize: 8.5,
                fontFace: "Arial",
                bold: true,
                color: C_WHITE,
              }
            );

            // Trade & Status Badge Row
            const badgeY = capY + 0.33;
            photoSlide.addShape(pptx.ShapeType.rect, {
              x: pX + 0.1,
              y: badgeY,
              w: pW - 0.2,
              h: 0.25,
              fill: { color: "F1F5F9" },
              line: { color: C_SLATE_200, width: 0.8 },
            });

            const statusColor = photo.status === "Completed" ? C_GREEN : C_BLUE;
            photoSlide.addText(
              `TRADE: ${photo.trade.toUpperCase()}   |   STATUS: ${photo.status.toUpperCase()}`,
              {
                x: pX + 0.15,
                y: badgeY + 0.03,
                w: pW - 0.3,
                h: 0.2,
                fontSize: 8,
                fontFace: "Arial",
                bold: true,
                color: statusColor,
              }
            );

            // Bold Work Description / Caption
            const descY = badgeY + 0.28;
            photoSlide.addText(
              photo.description || photo.work || "Progress inspection photograph.",
              {
                x: pX + 0.15,
                y: descY,
                w: pW - 0.3,
                h: 0.65,
                fontSize: 8.5,
                fontFace: "Arial",
                bold: true,
                color: C_SLATE_800,
              }
            );
          });
        });
      }
    }
  }

  // =========================================================================
  // FINAL SLIDE: SIGN-OFF, CERTIFICATION & GOVERNANCE APPROVALS
  // =========================================================================
  const finalSlide = pptx.addSlide();
  finalSlide.background = { color: C_NAVY };

  // Luxury gold top border
  finalSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.12,
    fill: { color: C_GOLD },
  });

  // Title
  finalSlide.addText("PROJECT QUALITY CERTIFICATION & MANAGEMENT SIGN-OFF", {
    x: 0.8,
    y: 0.6,
    w: 8.4,
    h: 0.5,
    fontSize: 18,
    fontFace: "Arial",
    bold: true,
    color: C_WHITE,
    align: "center",
  });

  finalSlide.addText(
    "Formal review and authorization by the Project Coordination and Executive Directorate",
    {
      x: 0.8,
      y: 1.1,
      w: 8.4,
      h: 0.3,
      fontSize: 11,
      fontFace: "Arial",
      color: C_GOLD_LIGHT,
      align: "center",
    }
  );

  // Two Signature Cards
  const sigW = 4.0;
  const sigH = 2.4;
  const sigY = 1.7;

  // Box 1: Prepared By
  finalSlide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: sigY,
    w: sigW,
    h: sigH,
    fill: { color: C_NAVY_LIGHT },
    line: { color: C_GOLD, width: 1.5 },
  });

  finalSlide.addText("PREPARED BY (SITE COORDINATOR / ENGINEER)", {
    x: 1.0,
    y: sigY + 0.2,
    w: 3.6,
    h: 0.3,
    fontSize: 10,
    fontFace: "Arial",
    bold: true,
    color: C_GOLD,
  });

  finalSlide.addText(`Officer Name: ${preparedBy || "Site Coordination Team"}\nTitle: Lead Site Architect / Engineer\nDate: ${endDate}\nStatus: Certified Complete & Accurate`, {
    x: 1.0,
    y: sigY + 0.55,
    w: 3.6,
    h: 0.9,
    fontSize: 9.5,
    fontFace: "Arial",
    color: C_WHITE,
    lineSpacing: 16,
  });

  finalSlide.addShape(pptx.ShapeType.line, {
    x: 1.0,
    y: sigY + 1.85,
    w: 3.6,
    h: 0,
    line: { color: C_GOLD, width: 1.2 },
  });

  finalSlide.addText("Authorized Site Signature", {
    x: 1.0,
    y: sigY + 1.95,
    w: 3.6,
    h: 0.25,
    fontSize: 8.5,
    fontFace: "Arial",
    color: C_GOLD_LIGHT,
  });

  // Box 2: Approved By
  finalSlide.addShape(pptx.ShapeType.rect, {
    x: 5.2,
    y: sigY,
    w: sigW,
    h: sigH,
    fill: { color: C_NAVY_LIGHT },
    line: { color: C_GOLD, width: 1.5 },
  });

  finalSlide.addText("APPROVED BY (PROJECT DIRECTOR / LEAD)", {
    x: 5.4,
    y: sigY + 0.2,
    w: 3.6,
    h: 0.3,
    fontSize: 10,
    fontFace: "Arial",
    bold: true,
    color: C_GOLD,
  });

  finalSlide.addText(`Director Name: ${projectManager || "Executive Directorate"}\nTitle: Executive Project Director\nDate: ${endDate}\nDecision: Formally Endorsed`, {
    x: 5.4,
    y: sigY + 0.55,
    w: 3.6,
    h: 0.9,
    fontSize: 9.5,
    fontFace: "Arial",
    color: C_WHITE,
    lineSpacing: 16,
  });

  finalSlide.addShape(pptx.ShapeType.line, {
    x: 5.4,
    y: sigY + 1.85,
    w: 3.6,
    h: 0,
    line: { color: C_GOLD, width: 1.2 },
  });

  finalSlide.addText("Executive Authorization Signature", {
    x: 5.4,
    y: sigY + 1.95,
    w: 3.6,
    h: 0.25,
    fontSize: 8.5,
    fontFace: "Arial",
    color: C_GOLD_LIGHT,
  });

  // Logo in bottom center
  finalSlide.addImage({
    data: logoDataUrl,
    x: 4.1,
    y: 4.3,
    w: 1.8,
    h: 0.9,
  });

  finalSlide.addText("GMH LUXURY • 11 YEARS • BUILT BY VISION, SUSTAINED BY TRUST", {
    x: 0.5,
    y: 5.3,
    w: 9.0,
    h: 0.25,
    fontSize: 8.5,
    fontFace: "Arial",
    color: C_GOLD,
    align: "center",
  });

  // Export presentation file
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${cleanTitle}_${startDate}_to_${endDate}.pptx`;
  await pptx.writeFile({ fileName });
}
