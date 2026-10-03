// GMH Luxury 11 Years Logo Graphic Utility

export const GMH_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#041228" />
      <stop offset="50%" stop-color="#081c3b" />
      <stop offset="100%" stop-color="#030d1d" />
    </linearGradient>

    <!-- Gold Gradients -->
    <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCEBA2" />
      <stop offset="25%" stop-color="#E5C158" />
      <stop offset="50%" stop-color="#C29738" />
      <stop offset="75%" stop-color="#E5C158" />
      <stop offset="100%" stop-color="#9C7522" />
    </linearGradient>

    <linearGradient id="goldGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF5C2" />
      <stop offset="50%" stop-color="#DFBA56" />
      <stop offset="100%" stop-color="#AA8026" />
    </linearGradient>

    <linearGradient id="goldDivider" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#DFBA56" stop-opacity="0" />
      <stop offset="30%" stop-color="#DFBA56" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#FFF2A3" stop-opacity="1" />
      <stop offset="70%" stop-color="#DFBA56" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#DFBA56" stop-opacity="0" />
    </linearGradient>

    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Deep Navy Luxury Background -->
  <rect width="1200" height="600" fill="url(#bgGrad)" />

  <!-- Center Vertical Light Beam Divider -->
  <line x1="600" y1="50" x2="600" y2="550" stroke="url(#goldDivider)" stroke-width="2.5" />
  <circle cx="600" cy="270" r="4" fill="#FFF9DF" filter="url(#goldGlow)" />

  <!-- ================= LEFT SIDE: GMH LUXURY ================= -->
  <g transform="translate(140, 160)">
    <!-- GMH Lettering -->
    <!-- G -->
    <path d="M 120 120 C 105 155, 60 160, 25 130 C -15 95, -15 30, 25 -5 C 65 -35, 110 -25, 125 10 L 95 25 C 85 5, 55 -5, 30 15 C 8 35, 8 85, 30 105 C 55 125, 85 120, 95 100 L 70 100 L 70 75 L 125 75 Z" fill="url(#goldGrad1)" />

    <!-- M -->
    <path d="M 140 145 L 140 -20 L 175 -20 L 210 70 L 245 -20 L 280 -20 L 280 145 L 250 145 L 250 35 L 220 110 L 200 110 L 170 35 L 170 145 Z" fill="url(#goldGrad1)" />

    <!-- H with Architectural House Peak -->
    <path d="M 300 145 L 300 -20 L 330 -20 L 330 45 L 390 45 L 390 -20 L 420 -20 L 420 145 L 390 145 L 390 75 L 330 75 L 330 145 Z" fill="url(#goldGrad1)" />

    <!-- House Roof over H Bar -->
    <polygon points="360,25 320,60 326,67 360,37 394,67 400,60" fill="url(#goldGradLight)" />
    <!-- House Window inside H (4 panes) -->
    <rect x="348" y="52" width="10" height="10" fill="#081c3b" stroke="url(#goldGrad1)" stroke-width="1.5" />
    <rect x="362" y="52" width="10" height="10" fill="#081c3b" stroke="url(#goldGrad1)" stroke-width="1.5" />
    <rect x="348" y="66" width="10" height="10" fill="#081c3b" stroke="url(#goldGrad1)" stroke-width="1.5" />
    <rect x="362" y="66" width="10" height="10" fill="#081c3b" stroke="url(#goldGrad1)" stroke-width="1.5" />

    <!-- LUXURY Banner Box -->
    <g transform="translate(45, 185)">
      <rect x="0" y="0" width="285" height="50" rx="4" fill="url(#goldGrad1)" />
      <text x="142" y="34" font-family="'Cinzel', 'Trajan Pro', 'Georgia', serif" font-size="24" font-weight="900" fill="#041228" letter-spacing="12" text-anchor="middle">
        LUXURY
      </text>
    </g>
  </g>

  <!-- ================= RIGHT SIDE: 11 YEARS ARCHITECTURAL ================= -->
  <g transform="translate(660, 100)">
    <!-- First 1 -->
    <polygon points="80,20 10,80 10,120 45,95 45,340 10,340 10,360 90,360 90,340 80,340 80,20" fill="url(#goldGrad1)" />

    <!-- Second 1 with High-Rise Windows Cutouts -->
    <polygon points="175,35 110,95 110,135 145,110 145,340 110,340 110,360 195,360 195,35" fill="url(#goldGrad1)" />

    <!-- Building Window Cutouts on Stem of 2nd "1" -->
    <rect x="155" y="145" width="8" height="16" rx="1" fill="#081c3b" />
    <rect x="175" y="145" width="8" height="16" rx="1" fill="#081c3b" />

    <rect x="175" y="180" width="8" height="16" rx="1" fill="#081c3b" />

    <rect x="155" y="215" width="8" height="16" rx="1" fill="#081c3b" />
    <rect x="175" y="215" width="8" height="16" rx="1" fill="#081c3b" />

    <rect x="155" y="250" width="8" height="16" rx="1" fill="#081c3b" />
    <rect x="175" y="250" width="8" height="16" rx="1" fill="#081c3b" />

    <rect x="155" y="285" width="8" height="16" rx="1" fill="#081c3b" />
    <rect x="175" y="285" width="8" height="16" rx="1" fill="#081c3b" />

    <!-- Building Arch Doorway -->
    <rect x="162" y="325" width="16" height="25" rx="3" fill="#081c3b" />

    <!-- "YEARS" Text -->
    <text x="200" y="352" font-family="'Trajan Pro', 'Georgia', serif" font-size="28" font-weight="bold" fill="url(#goldGradLight)" letter-spacing="4">
      YEARS
    </text>

    <!-- Bottom Gold Rule Line -->
    <line x1="0" y1="380" x2="310" y2="380" stroke="url(#goldGrad1)" stroke-width="2.5" />

    <!-- Subtitle Motto: "BUILT BY VISION, SUSTAINED BY TRUST" -->
    <text x="155" y="415" font-family="'Montserrat', 'Arial', sans-serif" font-size="16" font-weight="700" fill="url(#goldGradLight)" letter-spacing="5" text-anchor="middle">
      BUILT BY VISION,
    </text>
    <text x="155" y="442" font-family="'Montserrat', 'Arial', sans-serif" font-size="16" font-weight="700" fill="url(#goldGradLight)" letter-spacing="5" text-anchor="middle">
      SUSTAINED BY TRUST
    </text>
  </g>
</svg>
`;

let cachedDataUrl: string | null = null;

// Convert SVG to high-res PNG Data URL for use in PPTX, PDF, and DOCX
export async function getGmhLogoDataUrl(): Promise<string> {
  if (cachedDataUrl) return cachedDataUrl;

  try {
    const svgBlob = new Blob([GMH_LOGO_SVG], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create 2d context");

    ctx.drawImage(img, 0, 0, 1200, 600);
    URL.revokeObjectURL(url);

    cachedDataUrl = canvas.toDataURL("image/png");
    return cachedDataUrl;
  } catch (err) {
    console.warn("Failed to rasterize GMH Logo SVG to PNG, fallback to SVG data URI:", err);
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(GMH_LOGO_SVG)))}`;
  }
}
