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
  // The 5 Core Questions
  q1WhereAreWe: string;
  q2WhereShouldWeBe: string;
  q3WhyDifference: string;
  q4WhatDoingAboutIt: string;
  q5NeedFromManagement: string;
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

  // Build photo elements
  const photoParagraphs: Paragraph[] = [];
  if (includePhotos && selectedPhotos && selectedPhotos.length > 0) {
    for (let i = 0; i < selectedPhotos.length; i++) {
      const pInfo = selectedPhotos[i];
      const imageBytes = await base64ToUint8Array(pInfo.photoUrl);

      photoParagraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [
            new TextRun({
              text: `Photograph ${i + 1}: ${pInfo.siteName} – ${pInfo.unitName} (${pInfo.floorName})`,
              bold: true,
              size: 21,
              color: "1E3A8A",
              font: "Arial",
            }),
          ],
        })
      );

      if (imageBytes) {
        photoParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 80 },
            children: [
              new ImageRun({
                data: imageBytes,
                transformation: {
                  width: 480,
                  height: 320,
                },
                type: "jpg",
              } as any),
            ],
          })
        );
      }

      photoParagraphs.push(
        new Paragraph({
          spacing: { before: 40, after: 180 },
          children: [
            new TextRun({
              text: `Location / Area: `,
              bold: true,
              size: 18,
              font: "Arial",
            }),
            new TextRun({
              text: `${pInfo.area} | `,
              size: 18,
              font: "Arial",
            }),
            new TextRun({
              text: `Trade: `,
              bold: true,
              size: 18,
              font: "Arial",
            }),
            new TextRun({
              text: `${pInfo.trade} | `,
              size: 18,
              font: "Arial",
            }),
            new TextRun({
              text: `Status: `,
              bold: true,
              size: 18,
              font: "Arial",
            }),
            new TextRun({
              text: `${pInfo.status}\n`,
              size: 18,
              font: "Arial",
            }),
            new TextRun({
              text: `Description / Work Progress: `,
              bold: true,
              size: 18,
              color: "334155",
              font: "Arial",
            }),
            new TextRun({
              text: pInfo.description || pInfo.work || "Progress photographic record.",
              size: 18,
              italics: true,
              color: "475569",
              font: "Arial",
            }),
          ],
        })
      );
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
          // Header / Title Banner
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({
                text: title.toUpperCase(),
                bold: true,
                size: 32,
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
                size: 20,
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

          // ================= QUESTION 1 =================
          ...createQuestionHeading(
            1,
            "Where are we? – Current Progress & Status of Work",
            "Comprehensive breakdown of current progress, completed deliverables, and ongoing site operations."
          ),

          new Paragraph({
            spacing: { before: 60, after: 140 },
            children: [
              new TextRun({
                text: q1WhereAreWe || `Currently, the overall progress across the selected site(s) (${selectedSites.join(", ")}) stands at ${overallPct}% completion. A total of ${completed} work items have been fully completed and signed off, while ${inProgress} items are currently actively ongoing on site.`,
                size: 21,
                font: "Arial",
                color: "1E293B",
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: `A. Completed Work Items in this Period (${completedItems.length} items):`,
                bold: true,
                size: 20,
                color: "15803D", // Green
                font: "Arial",
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: completedRows,
          }),

          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: `B. Active Ongoing Work Items (${ongoingItems.length} items):`,
                bold: true,
                size: 20,
                color: "2563EB", // Blue
                font: "Arial",
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: ongoingRows,
          }),

          new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),

          // ================= QUESTION 2 =================
          ...createQuestionHeading(
            2,
            "Where should we be? – Planned Progress Based on Approved Programme",
            "Target schedule milestones, baseline program expectations, and planned deliverables for the period."
          ),

          new Paragraph({
            spacing: { before: 60, after: 140 },
            children: [
              new TextRun({
                text: q2WhereShouldWeBe || `According to the approved schedule and target milestones for ${reportType === "weekly" ? "this week" : "this month"}, all primary wet trades, floor screeding, ceiling POP, and initial fixture fittings were targeted to reach key completion benchmarks across all units.`,
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
                      text: "Programme Target Commitments Logged:",
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

          new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),

          // ================= QUESTION 3 =================
          ...createQuestionHeading(
            3,
            "Why is there a difference? – Variance, Delays, and Reasons",
            "Root cause analysis of schedule variances, on-site blockers, trade dependencies, and material delivery factors."
          ),

          new Paragraph({
            spacing: { before: 60, after: 140 },
            children: [
              new TextRun({
                text: q3WhyDifference || `Identified variances and schedule gaps during this period are primarily attributed to trade sequencing dependencies, material deliveries, and artisan attendance.`,
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
                      text: "Logged Site Issues & Challenge Items:",
                      bold: true,
                      size: 20,
                      color: "B91C1C", // Red
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

          new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),

          // ================= QUESTION 4 =================
          ...createQuestionHeading(
            4,
            "What are we doing about it? – Corrective Actions & Recovery Measures",
            "Immediate intervention steps, reallocated artisan resources, revised task sequencing, and recovery schedule."
          ),

          new Paragraph({
            spacing: { before: 60, after: 140 },
            children: [
              new TextRun({
                text: q4WhatDoingAboutIt || `To mitigate identified delays and recover lost time, the site coordination team has activated corrective measures including re-assigning dedicated artisan gangs, accelerating inspection sign-offs, and parallelizing finishing activities.`,
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

          new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),

          // ================= QUESTION 5 =================
          ...createQuestionHeading(
            5,
            "What do we need from Management? – Decisions, Approvals & Resources",
            "Explicit approvals, procurement clearances, contractor disbursements, or interventions required from Management."
          ),

          new Paragraph({
            spacing: { before: 60, after: 140 },
            children: [
              new TextRun({
                text: q5NeedFromManagement || `The site execution team requests Management review and expedited approval on: (1) Timely approval for pending material procurement requisitions; (2) Release of stage milestone payments for specialized subcontractors; (3) Final design confirmation on custom fittings.`,
                size: 21,
                font: "Arial",
                color: "1E293B",
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 240, after: 80 }, children: [] }),

          // ================= PHOTOGRAPHIC EVIDENCE =================
          ...(includePhotos && selectedPhotos && selectedPhotos.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 280, after: 80 },
                  children: [
                    new TextRun({
                      text: "6. Progress Photographic Evidence & Site Documentation",
                      bold: true,
                      size: 26,
                      color: "1E3A8A",
                      font: "Arial",
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 140 },
                  children: [
                    new TextRun({
                      text: "Verified visual documentation of physical progress achieved during the reporting period.",
                      italics: true,
                      size: 19,
                      color: "64748B",
                      font: "Arial",
                    }),
                  ],
                }),
                ...photoParagraphs,
              ]
            : []),

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
