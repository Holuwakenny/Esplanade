import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  convertInchesToTwip,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { WorkItem, SitesMap } from "../types";
import { getSitePlans } from "../lib/plansUtils";

export interface SiteQuestionData {
  q1WhereAreWe?: string;
  q2WhereShouldWeBe?: string;
  q3WhyDifference?: string;
  q4WhatDoingAboutIt?: string;
  q5NeedFromManagement?: string;
}

export interface DocxReportOptions {
  reportType: "weekly" | "monthly" | "daily";
  title: string;
  selectedSites: string[];
  sites: SitesMap;
  startDate: string;
  endDate: string;
  preparedBy: string;
  projectManager: string;
  managementRecipient: string;
  // Global/fallback questions
  q1WhereAreWe?: string;
  q2WhereShouldWeBe?: string;
  q3WhyDifference?: string;
  q4WhatDoingAboutIt?: string;
  q5NeedFromManagement?: string;
  // Per-site 5-Point Word Summary
  siteSummaries?: Record<string, SiteQuestionData>;
  // Photographic evidence
  includePhotos: boolean;
  selectedPhotos: Array<{
    siteName: string;
    unitName: string;
    floorName: string;
    area: string;
    work: string;
    trade: string;
    status: string;
    photoUrl: string;
    description: string;
  }>;
}

// Convert base64 data URL to Uint8Array for docx ImageRun
async function base64ToUint8Array(dataUrl: string): Promise<Uint8Array | null> {
  try {
    if (!dataUrl || !dataUrl.includes(",")) return null;
    const base64Str = dataUrl.split(",")[1];
    const binaryStr = window.atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn("[DocxGenerator] Failed to convert base64 image:", err);
    return null;
  }
}

export async function generateExecutiveDocxReport(options: DocxReportOptions): Promise<void> {
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

  // Collect items across all selected sites
  interface ItemWithLoc extends WorkItem {
    siteName: string;
    unitName: string;
    floorName: string;
  }

  const allItems: ItemWithLoc[] = [];
  const completedItems: ItemWithLoc[] = [];
  const ongoingItems: ItemWithLoc[] = [];
  const pendingItems: ItemWithLoc[] = [];
  const tradeCounts: Record<string, { total: number; completed: number }> = {};

  selectedSites.forEach((siteName) => {
    const siteData = sites[siteName] || {};
    Object.entries(siteData).forEach(([unitName, unitData]) => {
      if (unitName.startsWith("_")) return;
      Object.entries(unitData).forEach(([floorName, floorItems]) => {
        (floorItems as WorkItem[]).forEach((item) => {
          const itemLoc: ItemWithLoc = { ...item, siteName, unitName, floorName };
          allItems.push(itemLoc);

          const tr = item.trade || "General";
          if (!tradeCounts[tr]) tradeCounts[tr] = { total: 0, completed: 0 };
          tradeCounts[tr].total++;

          if (item.status === "Completed") {
            completedItems.push(itemLoc);
            tradeCounts[tr].completed++;
          } else if (item.status === "In Progress") {
            ongoingItems.push(itemLoc);
          } else {
            pendingItems.push(itemLoc);
          }
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

  // Aggregated site action plans
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

  const primaryColor = "1E293B"; // Slate 900
  const accentColor = "312E81"; // Indigo 900
  const headerBg = "F1F5F9"; // Slate 100
  const borderColor = "CBD5E1"; // Slate 300

  // Helpers for table cells
  const createCell = (
    text: string,
    isHeader = false,
    widthPct = 25,
    bold = false,
    align: any = AlignmentType.LEFT
  ) => {
    return new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: isHeader ? { fill: "1E293B", type: ShadingType.CLEAR } : undefined,
      children: [
        new Paragraph({
          alignment: align,
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text,
              bold: isHeader || bold,
              color: isHeader ? "FFFFFF" : "1E293B",
              size: isHeader ? 20 : 18, // 10pt / 9pt
              font: "Arial",
            }),
          ],
        }),
      ],
    });
  };

  // Helper for question title block
  const createQuestionHeading = (num: number, titleText: string, subtitleText: string) => {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 80 },
        children: [
          new TextRun({
            text: `${num}. ${titleText}`,
            bold: true,
            size: 26,
            color: "1E3A8A", // Deep blue
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 140 },
        children: [
          new TextRun({
            text: subtitleText,
            italics: true,
            size: 19,
            color: "64748B",
            font: "Arial",
          }),
        ],
      }),
    ];
  };

  // Prepare table rows for completed works
  const completedRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell("Site / Unit", true, 20),
        createCell("Floor & Location", true, 25),
        createCell("Completed Scope of Work", true, 35),
        createCell("Trade / Artisan", true, 20),
      ],
    }),
  ];

  if (completedItems.length === 0) {
    completedRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: "No items marked as Completed in this reporting cycle.", italics: true, color: "64748B", font: "Arial" })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    completedItems.slice(0, 50).forEach((item) => {
      completedRows.push(
        new TableRow({
          children: [
            createCell(`${item.siteName} - ${item.unitName}`, false, 20, true),
            createCell(`${item.floorName} / ${item.area}`, false, 25),
            createCell(item.work, false, 35),
            createCell(item.trade || "General", false, 20),
          ],
        })
      );
    });
  }

  // Prepare table rows for ongoing works
  const ongoingRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell("Site / Unit", true, 20),
        createCell("Floor & Location", true, 25),
        createCell("Active Work Scope & Notes", true, 35),
        createCell("Trade / Priority", true, 20),
      ],
    }),
  ];

  if (ongoingItems.length === 0) {
    ongoingRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: "No ongoing work items currently logged.", italics: true, color: "64748B", font: "Arial" })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    ongoingItems.slice(0, 50).forEach((item) => {
      ongoingRows.push(
        new TableRow({
          children: [
            createCell(`${item.siteName} - ${item.unitName}`, false, 20, true),
            createCell(`${item.floorName} / ${item.area}`, false, 25),
            createCell(`${item.work}${item.notes ? ` (${item.notes})` : ""}`, false, 35),
            createCell(`${item.trade || "General"} [${item.priority || "Medium"}]`, false, 20),
          ],
        })
      );
    });
  }

  // Build 5-Point Word Summary organized by Site with site-categorized photos
  const siteSectionElements: any[] = [];

  for (let siteIdx = 0; siteIdx < selectedSites.length; siteIdx++) {
    const siteName = selectedSites[siteIdx];
    const siteItems = allItems.filter((i) => i.siteName === siteName);
    const siteCompleted = siteItems.filter((i) => i.status === "Completed");
    const siteOngoing = siteItems.filter((i) => i.status === "In Progress");
    const sitePending = siteItems.filter((i) => i.status === "Pending");
    const siteTotal = siteItems.length;
    const sitePct = siteTotal > 0 ? Math.round((siteCompleted.length / siteTotal) * 100) : 0;

    const siteSummary = siteSummaries?.[siteName] || {};
    const sQ1 =
      siteSummary.q1WhereAreWe ||
      (selectedSites.length === 1 ? q1WhereAreWe : "") ||
      `Current project execution on site ${siteName} stands at ${sitePct}% physical completion. A total of ${siteCompleted.length} work items have been completely finished and inspected, ${siteOngoing.length} items are actively ongoing across units and floors, and ${sitePending.length} items remain in the preparatory pipeline.`;
    const sQ2 =
      siteSummary.q2WhereShouldWeBe ||
      (selectedSites.length === 1 ? q2WhereShouldWeBe : "") ||
      `According to the approved schedule and target milestones for ${siteName}, primary trade works, floor finishes, and surface preparation were planned to reach key progress benchmarks for this period.`;
    const sQ3 =
      siteSummary.q3WhyDifference ||
      (selectedSites.length === 1 ? q3WhyDifference : "") ||
      `Schedule variances and on-site delays for ${siteName} during this period were primarily driven by material deliveries, sequencing between specialized trades, and artisan attendance.`;
    const sQ4 =
      siteSummary.q4WhatDoingAboutIt ||
      (selectedSites.length === 1 ? q4WhatDoingAboutIt : "") ||
      `To recover time and attain milestones on ${siteName}, the site team has deployed immediate corrective interventions, reallocated parallel artisan gangs, and prioritized critical path units.`;
    const sQ5 =
      siteSummary.q5NeedFromManagement ||
      (selectedSites.length === 1 ? q5NeedFromManagement : "") ||
      `To sustain momentum on ${siteName} without disruption, the site team requests Management review and clearance on pending procurement requisitions and stage disbursements.`;

    const sitePlans = getSitePlans(sites, siteName);
    const sIssues = sitePlans.issuesAndChallenges || [];
    const sNextDay = sitePlans.nextDayPlan || [];
    const sWeekly = sitePlans.weeklyPlan || [];
    const sMonthly = sitePlans.monthlyPlan || [];
    const sPlanned = reportType === "monthly" ? sMonthly : sWeekly;

    // Completed rows for this site
    const siteCompletedRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell("Unit / Area", true, 25),
          createCell("Floor Level", true, 20),
          createCell("Completed Scope of Work", true, 35),
          createCell("Trade / Artisan", true, 20),
        ],
      }),
    ];

    if (siteCompleted.length === 0) {
      siteCompletedRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 4,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 100 },
                  children: [new TextRun({ text: `No completed items logged for ${siteName} in this period.`, italics: true, color: "64748B", font: "Arial" })],
                }),
              ],
            }),
          ],
        })
      );
    } else {
      siteCompleted.slice(0, 50).forEach((item) => {
        siteCompletedRows.push(
          new TableRow({
            children: [
              createCell(`${item.unitName} - ${item.area}`, false, 25, true),
              createCell(item.floorName, false, 20),
              createCell(item.work, false, 35),
              createCell(item.trade || "General", false, 20),
            ],
          })
        );
      });
    }

    // Ongoing rows for this site
    const siteOngoingRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell("Unit / Area", true, 25),
          createCell("Floor Level", true, 20),
          createCell("Active Work Scope & Notes", true, 35),
          createCell("Trade / Priority", true, 20),
        ],
      }),
    ];

    if (siteOngoing.length === 0) {
      siteOngoingRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 4,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 100 },
                  children: [new TextRun({ text: `No ongoing items currently logged for ${siteName}.`, italics: true, color: "64748B", font: "Arial" })],
                }),
              ],
            }),
          ],
        })
      );
    } else {
      siteOngoing.slice(0, 50).forEach((item) => {
        siteOngoingRows.push(
          new TableRow({
            children: [
              createCell(`${item.unitName} - ${item.area}`, false, 25, true),
              createCell(item.floorName, false, 20),
              createCell(`${item.work}${item.notes ? ` (${item.notes})` : ""}`, false, 35),
              createCell(`${item.trade || "General"} [${item.priority || "Medium"}]`, false, 20),
            ],
          })
        );
      });
    }

    // Push Site Section
    siteSectionElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: siteIdx === 0 ? 200 : 360, after: 100 },
        children: [
          new TextRun({
            text: `SITE 5-POINT WORK SUMMARY: ${siteName.toUpperCase()}`,
            bold: true,
            size: 26,
            color: "1E293B",
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: `Executive 5-point close-out report and milestones specifically for ${siteName}.`,
            italics: true,
            size: 19,
            color: "64748B",
            font: "Arial",
          }),
        ],
      }),
      // Site KPI Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createCell("Site Category", true, 20, false, AlignmentType.CENTER),
              createCell("Total Scope", true, 20, false, AlignmentType.CENTER),
              createCell("Completed", true, 20, false, AlignmentType.CENTER),
              createCell("Ongoing", true, 20, false, AlignmentType.CENTER),
              createCell("Completion Rate", true, 20, false, AlignmentType.CENTER),
            ],
          }),
          new TableRow({
            children: [
              createCell(siteName, false, 20, true, AlignmentType.CENTER),
              createCell(`${siteTotal}`, false, 20, true, AlignmentType.CENTER),
              createCell(`${siteCompleted.length}`, false, 20, true, AlignmentType.CENTER),
              createCell(`${siteOngoing.length}`, false, 20, true, AlignmentType.CENTER),
              createCell(`${sitePct}%`, false, 20, true, AlignmentType.CENTER),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),

      // Point 1
      ...createQuestionHeading(
        1,
        `Where are we on ${siteName}? – Current Progress & Status`,
        `Progress breakdown, completed deliverables, and ongoing work for ${siteName}.`
      ),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [new TextRun({ text: sQ1, size: 21, font: "Arial", color: "1E293B" })],
      }),
      new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({
            text: `A. Completed Work Items on ${siteName} (${siteCompleted.length} items):`,
            bold: true,
            size: 20,
            color: "15803D",
            font: "Arial",
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: siteCompletedRows,
      }),
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: `B. Active Ongoing Work Items on ${siteName} (${siteOngoing.length} items):`,
            bold: true,
            size: 20,
            color: "2563EB",
            font: "Arial",
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: siteOngoingRows,
      }),
      new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),

      // Point 2
      ...createQuestionHeading(
        2,
        `Where should we be on ${siteName}? – Planned Programme Milestones`,
        `Baseline program targets and expected milestones for ${siteName}.`
      ),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [new TextRun({ text: sQ2, size: 21, font: "Arial", color: "1E293B" })],
      }),
      ...(sPlanned.length > 0
        ? [
            new Paragraph({
              spacing: { before: 80, after: 60 },
              children: [
                new TextRun({
                  text: `Programme Targets Logged for ${siteName}:`,
                  bold: true,
                  size: 20,
                  color: "334155",
                  font: "Arial",
                }),
              ],
            }),
            ...sPlanned.map(
              (plan) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({ text: plan.title, bold: true, size: 19, font: "Arial" }),
                    new TextRun({ text: plan.notes ? ` – ${plan.notes}` : "", size: 19, font: "Arial" }),
                  ],
                })
            ),
          ]
        : []),
      new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),

      // Point 3
      ...createQuestionHeading(
        3,
        `Why is there a difference on ${siteName}? – Variances, Delays & Reasons`,
        `Root cause analysis of schedule variances and site challenges on ${siteName}.`
      ),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [new TextRun({ text: sQ3, size: 21, font: "Arial", color: "1E293B" })],
      }),
      ...(sIssues.length > 0
        ? [
            new Paragraph({
              spacing: { before: 80, after: 60 },
              children: [
                new TextRun({
                  text: `Logged Issues & Blockers for ${siteName}:`,
                  bold: true,
                  size: 20,
                  color: "B91C1C",
                  font: "Arial",
                }),
              ],
            }),
            ...sIssues.map(
              (issue) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({ text: issue.title, bold: true, size: 19, color: "991B1B", font: "Arial" }),
                    new TextRun({ text: issue.notes ? ` – ${issue.notes}` : "", size: 19, font: "Arial" }),
                  ],
                })
            ),
          ]
        : []),
      new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),

      // Point 4
      ...createQuestionHeading(
        4,
        `What are we doing about it on ${siteName}? – Recovery Interventions`,
        `Corrective measures, redeployed artisan gangs, and recovery timeline for ${siteName}.`
      ),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [new TextRun({ text: sQ4, size: 21, font: "Arial", color: "1E293B" })],
      }),
      ...(sNextDay.length > 0
        ? [
            new Paragraph({
              spacing: { before: 80, after: 60 },
              children: [
                new TextRun({
                  text: `Immediate Action Plans for ${siteName}:`,
                  bold: true,
                  size: 20,
                  color: "1E293B",
                  font: "Arial",
                }),
              ],
            }),
            ...sNextDay.map(
              (action) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 40, after: 40 },
                  children: [
                    new TextRun({ text: action.title, bold: true, size: 19, font: "Arial" }),
                    new TextRun({ text: action.notes ? ` – ${action.notes}` : "", size: 19, font: "Arial" }),
                  ],
                })
            ),
          ]
        : []),
      new Paragraph({ spacing: { before: 180, after: 60 }, children: [] }),

      // Point 5
      ...createQuestionHeading(
        5,
        `What do we need from Management for ${siteName}? – Approvals & Decisions`,
        `Management support, procurement clearances, and critical approvals required for ${siteName}.`
      ),
      new Paragraph({
        spacing: { before: 60, after: 140 },
        children: [new TextRun({ text: sQ5, size: 21, font: "Arial", color: "1E293B" })],
      }),
      new Paragraph({ spacing: { before: 240, after: 60 }, children: [] })
    );

    // Photographic Evidence specifically categorized for this Site
    const sitePhotos =
      includePhotos && selectedPhotos
        ? selectedPhotos.filter((p) => p.siteName === siteName)
        : [];

    if (sitePhotos.length > 0) {
      siteSectionElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 80 },
          children: [
            new TextRun({
              text: `6. Photographic Evidence & Visual Records: ${siteName} (${sitePhotos.length} Photo${sitePhotos.length > 1 ? "s" : ""})`,
              bold: true,
              size: 24,
              color: "1E3A8A",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 120 },
          children: [
            new TextRun({
              text: `Verified physical progress photographs recorded specifically for ${siteName}.`,
              italics: true,
              size: 18,
              color: "64748B",
              font: "Arial",
            }),
          ],
        })
      );

      for (let pIdx = 0; pIdx < sitePhotos.length; pIdx++) {
        const photo = sitePhotos[pIdx];
        const imgBytes = await base64ToUint8Array(photo.photoUrl);

        if (imgBytes) {
          siteSectionElements.push(
            new Paragraph({
              spacing: { before: 120, after: 60 },
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: imgBytes,
                  type: photo.photoUrl.startsWith("data:image/png") ? "png" : "jpg",
                  transformation: {
                    width: 340,
                    height: 230,
                  },
                }),
              ],
            })
          );
        }

        siteSectionElements.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell(
                    `Photo ${pIdx + 1}: ${photo.siteName} – ${photo.unitName} (${photo.floorName} - ${photo.area})   |   Trade: ${photo.trade || "General"}   |   Status: ${photo.status}`,
                    true,
                    100,
                    false
                  ),
                ],
              }),
              new TableRow({
                children: [
                  createCell(
                    `Work / Caption: ${photo.description || photo.work || "Progress record."}`,
                    false,
                    100,
                    false
                  ),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 80, after: 140 }, children: [] })
        );
      }
    }
  }

  // Create Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `SITE WORK PROGRESS REPORT | ${selectedSites.join(", ")}`,
                    size: 16,
                    color: "94A3B8",
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: `Confidential - For Management Review Only   |   Page `,
                    size: 16,
                    color: "94A3B8",
                    font: "Arial",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "94A3B8",
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // GMH Luxury Executive Branding Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({
                text: "GMH LUXURY • 11 YEARS",
                bold: true,
                size: 26,
                color: "071D49",
                font: "Arial",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 140 },
            children: [
              new TextRun({
                text: "BUILT BY VISION, SUSTAINED BY TRUST",
                bold: true,
                size: 16,
                color: "B8860B",
                font: "Arial",
              }),
            ],
          }),

          // Header / Title Banner
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: title.toUpperCase(),
                bold: true,
                size: 30,
                color: "0F172A",
                font: "Arial",
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            children: [
              new TextRun({
                text: `EXECUTIVE 5-QUESTION PROGRESS SUMMARY & DETAILED SITE AUDIT`,
                bold: true,
                size: 19,
                color: "4F46E5",
                font: "Arial",
              }),
            ],
          }),

          // Metadata Grid Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell("Project / Sites:", true, 25),
                  createCell(selectedSites.join(", "), false, 75, true),
                ],
              }),
              new TableRow({
                children: [
                  createCell("Reporting Period:", true, 25),
                  createCell(`${reportType.toUpperCase()} REPORT (${startDate} to ${endDate})`, false, 75),
                ],
              }),
              new TableRow({
                children: [
                  createCell("Prepared By:", true, 25),
                  createCell(preparedBy || "Site Coordination Team", false, 75),
                ],
              }),
              new TableRow({
                children: [
                  createCell("Submitted To:", true, 25),
                  createCell(managementRecipient || "Executive Project Management & Directors", false, 75),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),

          // Executive KPI Summary Table
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 140, after: 80 },
            children: [
              new TextRun({
                text: "Executive Progress Dashboard Metrics",
                bold: true,
                size: 24,
                color: "0F172A",
                font: "Arial",
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell("Total Scope Items", true, 20, false, AlignmentType.CENTER),
                  createCell("Completed Items", true, 20, false, AlignmentType.CENTER),
                  createCell("Ongoing / In-Progress", true, 20, false, AlignmentType.CENTER),
                  createCell("Pending Scope", true, 20, false, AlignmentType.CENTER),
                  createCell("Overall Completion", true, 20, false, AlignmentType.CENTER),
                ],
              }),
              new TableRow({
                children: [
                  createCell(`${total}`, false, 20, true, AlignmentType.CENTER),
                  createCell(`${completed}`, false, 20, true, AlignmentType.CENTER),
                  createCell(`${inProgress}`, false, 20, true, AlignmentType.CENTER),
                  createCell(`${pending}`, false, 20, true, AlignmentType.CENTER),
                  createCell(`${overallPct}%`, false, 20, true, AlignmentType.CENTER),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),

          // When multiple sites are selected, include Part I: Consolidated Executive 5-Point Portfolio Overview
          ...(selectedSites.length > 1
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 280, after: 120 },
                  children: [
                    new TextRun({
                      text: "PART I: CONSOLIDATED EXECUTIVE 5-POINT OVERVIEW",
                      bold: true,
                      size: 26,
                      color: "1E3A8A",
                      font: "Arial",
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 200 },
                  children: [
                    new TextRun({
                      text: `Consolidated progress assessment across all ${selectedSites.length} project sites (${selectedSites.join(", ")}). Detailed unit-by-unit work tables are provided in Part II below.`,
                      italics: true,
                      size: 19,
                      color: "64748B",
                      font: "Arial",
                    }),
                  ],
                }),

                // ================= QUESTION 1 =================
                ...createQuestionHeading(
                  1,
                  "Where are we across all sites? – Progress & Status",
                  "Consolidated execution status and aggregate physical completion."
                ),
                new Paragraph({
                  spacing: { before: 60, after: 140 },
                  children: [
                    new TextRun({
                      text:
                        q1WhereAreWe ||
                        `Currently, the overall progress across all selected sites (${selectedSites.join(", ")}) stands at ${overallPct}% completion. A total of ${completed} work items have been fully completed, while ${inProgress} items are actively ongoing on site.`,
                      size: 21,
                      font: "Arial",
                      color: "1E293B",
                    }),
                  ],
                }),

                new Paragraph({ spacing: { before: 200, after: 80 }, children: [] }),

                // ================= QUESTION 2 =================
                ...createQuestionHeading(
                  2,
                  "Where should we be? – Programme Milestones",
                  "Baseline commitments and scheduled milestones across all sites."
                ),
                new Paragraph({
                  spacing: { before: 60, after: 140 },
                  children: [
                    new TextRun({
                      text:
                        q2WhereShouldWeBe ||
                        `According to the approved schedule and target milestones for ${reportType === "weekly" ? "this week" : "this month"}, primary trades and floor finishes were targeted to reach key completion benchmarks across all units.`,
                      size: 21,
                      font: "Arial",
                      color: "1E293B",
                    }),
                  ],
                }),

                ...(allWeekly.length > 0 || allMonthly.length > 0
                  ? [
                      new Paragraph({
                        spacing: { before: 100, after: 60 },
                        children: [
                          new TextRun({
                            text: "Portfolio Milestone Commitments Logged:",
                            bold: true,
                            size: 20,
                            color: "334155",
                            font: "Arial",
                          }),
                        ],
                      }),
                      ...(reportType === "monthly" ? allMonthly : allWeekly).map(
                        (plan) =>
                          new Paragraph({
                            bullet: { level: 0 },
                            spacing: { before: 40, after: 40 },
                            children: [
                              new TextRun({
                                text: `[${plan.site}] ${plan.title}`,
                                bold: true,
                                size: 19,
                                font: "Arial",
                              }),
                              new TextRun({
                                text: plan.notes ? ` – ${plan.notes}` : "",
                                size: 19,
                                font: "Arial",
                              }),
                            ],
                          })
                      ),
                    ]
                  : []),

                new Paragraph({ spacing: { before: 200, after: 80 }, children: [] }),

                // ================= QUESTION 3 =================
                ...createQuestionHeading(
                  3,
                  "Why is there a difference? – Variances & Reasons",
                  "Root causes of delays and schedule deviations."
                ),
                new Paragraph({
                  spacing: { before: 60, after: 140 },
                  children: [
                    new TextRun({
                      text:
                        q3WhyDifference ||
                        `Identified variances during this period are primarily attributed to material delivery sequence, trade overlaps, and specialized artisan attendance.`,
                      size: 21,
                      font: "Arial",
                      color: "1E293B",
                    }),
                  ],
                }),

                ...(allIssues.length > 0
                  ? [
                      new Paragraph({
                        spacing: { before: 100, after: 60 },
                        children: [
                          new TextRun({
                            text: "Logged Site Blockers & Challenges:",
                            bold: true,
                            size: 20,
                            color: "B91C1C",
                            font: "Arial",
                          }),
                        ],
                      }),
                      ...allIssues.map(
                        (issue) =>
                          new Paragraph({
                            bullet: { level: 0 },
                            spacing: { before: 40, after: 40 },
                            children: [
                              new TextRun({
                                text: `[${issue.site}] ${issue.title}`,
                                bold: true,
                                size: 19,
                                color: "991B1B",
                                font: "Arial",
                              }),
                              new TextRun({
                                text: issue.notes ? ` – ${issue.notes}` : "",
                                size: 19,
                                font: "Arial",
                              }),
                            ],
                          })
                      ),
                    ]
                  : []),

                new Paragraph({ spacing: { before: 200, after: 80 }, children: [] }),

                // ================= QUESTION 4 =================
                ...createQuestionHeading(
                  4,
                  "What are we doing about it? – Recovery Interventions",
                  "Corrective measures and parallel gang allocations."
                ),
                new Paragraph({
                  spacing: { before: 60, after: 140 },
                  children: [
                    new TextRun({
                      text:
                        q4WhatDoingAboutIt ||
                        `To recover lost time, corrective actions have been activated including re-assigning dedicated artisan gangs and accelerating milestone inspections.`,
                      size: 21,
                      font: "Arial",
                      color: "1E293B",
                    }),
                  ],
                }),

                ...(allNextDay.length > 0
                  ? [
                      new Paragraph({
                        spacing: { before: 100, after: 60 },
                        children: [
                          new TextRun({
                            text: "Immediate Action Work Plans:",
                            bold: true,
                            size: 20,
                            color: "1E293B",
                            font: "Arial",
                          }),
                        ],
                      }),
                      ...allNextDay.map(
                        (action) =>
                          new Paragraph({
                            bullet: { level: 0 },
                            spacing: { before: 40, after: 40 },
                            children: [
                              new TextRun({
                                text: `[${action.site}] ${action.title}`,
                                bold: true,
                                size: 19,
                                font: "Arial",
                              }),
                              new TextRun({
                                text: action.notes ? ` – ${action.notes}` : "",
                                size: 19,
                                font: "Arial",
                              }),
                            ],
                          })
                      ),
                    ]
                  : []),

                new Paragraph({ spacing: { before: 200, after: 80 }, children: [] }),

                // ================= QUESTION 5 =================
                ...createQuestionHeading(
                  5,
                  "What do we need from Management? – Decisions & Approvals",
                  "Procurement clearances and management authorizations required."
                ),
                new Paragraph({
                  spacing: { before: 60, after: 140 },
                  children: [
                    new TextRun({
                      text:
                        q5NeedFromManagement ||
                        `The site execution team requests Management review and expedited approval on material procurement requisitions and stage disbursements.`,
                      size: 21,
                      font: "Arial",
                      color: "1E293B",
                    }),
                  ],
                }),

                new Paragraph({ spacing: { before: 260, after: 80 }, children: [] }),

                // Divider Header for Part II
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 280, after: 120 },
                  children: [
                    new TextRun({
                      text: "PART II: SITE-BY-SITE 5-POINT WORK SUMMARIES & AUDITS",
                      bold: true,
                      size: 26,
                      color: "1E3A8A",
                      font: "Arial",
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 200 },
                  children: [
                    new TextRun({
                      text:
                        "Detailed 5-point close-out report, milestone status, and work tables categorized individually for each site.",
                      italics: true,
                      size: 19,
                      color: "64748B",
                      font: "Arial",
                    }),
                  ],
                }),
              ]
            : []),

          // Site-categorized sections (for single site: this is the entire complete report; for multiple sites: this is Part II)
          ...siteSectionElements,

          new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),

          // Sign-off block
          new Paragraph({ spacing: { before: 300, after: 100 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell("Prepared By (Site Engineer / Coordinator)", true, 50),
                  createCell("Approved By (Project Director / Lead)", true, 50),
                ],
              }),
              new TableRow({
                children: [
                  createCell(`Name: ${preparedBy}\nSignature: __________________\nDate: ${endDate}`, false, 50),
                  createCell(`Name: ${projectManager || "Project Management"}\nSignature: __________________\nDate: ${endDate}`, false, 50),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Pack and download .docx
  const blob = await Packer.toBlob(doc);
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${cleanTitle}_${startDate}_to_${endDate}.docx`;
  saveAs(blob, fileName);
}
