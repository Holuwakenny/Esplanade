import { SiteTrackerData, WorkItem } from "../types";

// Helper to generate ordinal floor labels
export function getFloorName(index: number): string {
  if (index === 0) return "Ground Floor";
  if (index === 1) return "First Floor";
  if (index === 2) return "Second Floor";
  if (index === 3) return "Third Floor";
  if (index === 4) return "Fourth Floor";
  if (index === 5) return "Fifth Floor";
  if (index === 6) return "Sixth Floor";
  if (index === 7) return "Seventh Floor";
  if (index === 8) return "Eighth Floor";
  return `Floor ${index}`;
}

// Esplanade 6: 6 Units, 3 Floors each
export function createEsplanade6Template(): SiteTrackerData {
  const data: SiteTrackerData = {};
  for (let u = 1; u <= 6; u++) {
    const unitName = `Unit ${u}`;
    data[unitName] = {
      "Ground Floor": [],
      "First Floor": [],
      "Second Floor": [],
      "General / All Floors": [],
    };
  }

  // Pre-populate initial work items for Esplanade 6 sample
  data["Unit 1"]["Ground Floor"] = [
    {
      id: "esp-101",
      area: "Living Room Entrance",
      work: "Porcelain floor tile grouting & perimeter silicone seal",
      trade: "Tiler",
      status: "In Progress",
      priority: "High",
      notes: "Requires anti-fungal grey grout",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "esp-102",
      area: "Kitchen Area",
      work: "Install dual sink plumbing trap and test water pressure",
      trade: "Plumber",
      status: "Pending",
      priority: "Critical",
      notes: "Awaiting angle valve delivery",
      updatedAt: new Date().toISOString(),
    },
  ];

  data["Unit 1"]["First Floor"] = [
    {
      id: "esp-103",
      area: "Master Bedroom",
      work: "Fix pop ceiling LED strip lighting and dimmer switch",
      trade: "Electrician",
      status: "Completed",
      priority: "Medium",
      notes: "Tested warm white illumination",
      updatedAt: new Date().toISOString(),
    },
  ];

  data["Unit 2"]["Ground Floor"] = [
    {
      id: "esp-201",
      area: "Guest Toilet",
      work: "Wall tiling touch-up behind vanity mirror",
      trade: "Tiler",
      status: "Pending",
      priority: "Medium",
      updatedAt: new Date().toISOString(),
    },
  ];

  return data;
}

// EGC3: 4 Units, 8 Floors each
export function createEGC3Template(): SiteTrackerData {
  const data: SiteTrackerData = {};

  const egcFloors = [
    "Ground Floor",
    "First Floor",
    "Second Floor",
    "Third Floor",
    "Fourth Floor",
    "Fifth Floor",
    "Sixth Floor",
    "Seventh Floor",
    "General / All Floors",
  ];

  for (let u = 1; u <= 4; u++) {
    const unitName = `Unit ${u}`;
    data[unitName] = {};
    egcFloors.forEach((f) => {
      data[unitName][f] = [];
    });
  }

  // Pre-populate initial work items for EGC3 sample
  data["Unit 1"]["Ground Floor"] = [
    {
      id: "egc-101",
      area: "Reception Lobby",
      work: "Granite flooring polishing & brass strip inset clean",
      trade: "Tiler",
      status: "In Progress",
      priority: "High",
      notes: "High foot traffic prep zone",
      updatedAt: new Date().toISOString(),
    },
  ];

  data["Unit 1"]["Third Floor"] = [
    {
      id: "egc-102",
      area: "Balcony Deck",
      work: "Apply waterproof screed compound and test flood seal",
      trade: "Mason / Builder",
      status: "Pending",
      priority: "Critical",
      notes: "Inspection scheduled for Friday",
      updatedAt: new Date().toISOString(),
    },
  ];

  data["Unit 2"]["Fifth Floor"] = [
    {
      id: "egc-201",
      area: "Utility Closet",
      work: "Mount 3-phase sub-distribution panel and label circuit breakers",
      trade: "Electrician",
      status: "Pending",
      priority: "High",
      updatedAt: new Date().toISOString(),
    },
  ];

  return data;
}

// Custom structure generator
export function createCustomSiteTemplate(unitCount: number, floorCount: number): SiteTrackerData {
  const data: SiteTrackerData = {};
  const validUnits = Math.max(1, Math.min(30, unitCount));
  const validFloors = Math.max(1, Math.min(20, floorCount));

  for (let u = 1; u <= validUnits; u++) {
    const unitName = `Unit ${u}`;
    data[unitName] = {};
    for (let f = 0; f < validFloors; f++) {
      const floorLabel = getFloorName(f);
      data[unitName][floorLabel] = [];
    }
    data[unitName]["General / All Floors"] = [];
  }
  return data;
}
