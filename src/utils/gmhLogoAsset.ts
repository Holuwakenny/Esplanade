/**
 * GMH LUXURY 11-YEARS ANNIVERSARY LOGO ASSET
 * Vector representation & high-resolution PNG generator for PPTX, PDF, and HTML reports.
 * Colors: Deep Navy (#071d49 / #061537) & Metallic Gold (#E5C058, #D4AF37, #996515, #F9E79F).
 */

export const GMH_NAVY = "#071D49";
export const GMH_NAVY_DARK = "#040F27";
export const GMH_GOLD = "#D4AF37";
export const GMH_GOLD_LIGHT = "#F9E79F";
export const GMH_GOLD_DARK = "#AA7C11";

/**
 * Clean SVG string of the official GMH Luxury 11-Years Logo
 */
export const GMH_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="1000" height="500">
  <defs>
    <linearGradient id="gmhGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCEBA6"/>
      <stop offset="25%" stop-color="#E5C058"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="75%" stop-color="#B8860B"/>
      <stop offset="100%" stop-color="#E5C058"/>
    </linearGradient>

    <linearGradient id="gmhPlateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C59A27"/>
      <stop offset="35%" stop-color="#F9E79F"/>
      <stop offset="70%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#B38012"/>
    </linearGradient>

    <linearGradient id="dividerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.1"/>
      <stop offset="45%" stop-color="#FDF4C8" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="1"/>
      <stop offset="55%" stop-color="#FDF4C8" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#D4AF37" stop-opacity="0.1"/>
    </linearGradient>

    <radialGradient id="centerFlare" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFF2A3" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#D4AF37" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#071D49" stop-opacity="0"/>
    </radialGradient>

    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Deep Luxury Navy Background -->
  <rect width="1000" height="500" fill="#071D49"/>

  <!-- Subtle Radial Ambient Lighting behind logo -->
  <circle cx="500" cy="245" r="320" fill="url(#centerFlare)" opacity="0.25"/>

  <!-- ================= LEFT: GMH LUXURY ================= -->
  <!-- "G" -->
  <path d="M 235 242 C 228 262 208 274 182 274 C 145 274 122 245 122 205 C 122 165 147 136 186 136 C 215 136 232 150 238 168 L 222 173 C 217 159 204 150 186 150 C 157 150 138 172 138 205 C 138 238 156 260 184 260 C 205 260 219 248 223 234 L 195 234 L 195 221 L 235 221 Z" fill="url(#gmhGoldGrad)"/>

  <!-- "M" -->
  <path d="M 252 138 L 273 138 L 297 228 L 321 138 L 342 138 L 342 272 L 327 272 L 327 167 L 303 256 L 291 256 L 267 167 L 267 272 L 252 272 Z" fill="url(#gmhGoldGrad)"/>

  <!-- "H" with House Motif -->
  <!-- Left Column -->
  <rect x="357" y="138" width="16" height="134" fill="url(#gmhGoldGrad)"/>
  <!-- Right Column -->
  <rect x="424" y="138" width="16" height="134" fill="url(#gmhGoldGrad)"/>
  <!-- Crossbar Structure -->
  <rect x="373" y="210" width="51" height="14" fill="url(#gmhGoldGrad)"/>
  <!-- Roof Gable over H -->
  <path d="M 353 194 L 398.5 160 L 444 194 L 439 200 L 398.5 169 L 358 200 Z" fill="url(#gmhGoldGrad)"/>
  <!-- Little House Body inside H -->
  <path d="M 382 195 L 415 195 L 415 226 L 382 226 Z" fill="#071D49"/>
  <rect x="382" y="195" width="33" height="31" fill="none" stroke="url(#gmhGoldGrad)" stroke-width="2.5"/>
  <!-- 4-Pane Window inside House -->
  <rect x="388" y="201" width="9" height="9" fill="url(#gmhGoldGrad)"/>
  <rect x="400" y="201" width="9" height="9" fill="url(#gmhGoldGrad)"/>
  <rect x="388" y="213" width="9" height="9" fill="url(#gmhGoldGrad)"/>
  <rect x="400" y="213" width="9" height="9" fill="url(#gmhGoldGrad)"/>

  <!-- "LUXURY" Gold Plate -->
  <rect x="160" y="294" width="240" height="36" rx="2" fill="url(#gmhPlateGrad)" filter="url(#goldGlow)"/>
  <text x="280" y="319" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="20" font-weight="900" letter-spacing="8" fill="#071D49" text-anchor="middle">LUXURY</text>

  <!-- ================= CENTER: ELEGANT VERTICAL GOLD SEPARATOR ================= -->
  <line x1="500" y1="50" x2="500" y2="450" stroke="url(#dividerGlow)" stroke-width="1.8"/>
  <ellipse cx="500" cy="235" rx="5" ry="12" fill="#FFFFFF" opacity="0.95"/>
  <ellipse cx="500" cy="235" rx="15" ry="30" fill="url(#centerFlare)" opacity="0.7"/>

  <!-- ================= RIGHT: 11 YEARS TOWER EMBLEM ================= -->
  <!-- First Tower "1" -->
  <path d="M 552 135 L 628 85 L 628 335 L 580 335 L 580 148 L 552 166 Z" fill="url(#gmhGoldGrad)"/>
  <!-- Second Tower "1" (Building with Windows) -->
  <path d="M 636 135 L 712 85 L 712 335 L 672 335 L 672 138 L 636 162 Z" fill="url(#gmhGoldGrad)"/>

  <!-- Architectural Tower Windows on the "1"s -->
  <!-- Windows on Tower 1/2 Column -->
  <rect x="636" y="172" width="7" height="15" fill="#071D49"/>
  <rect x="653" y="172" width="7" height="15" fill="#071D49"/>
  <rect x="653" y="202" width="7" height="15" fill="#071D49"/>
  <rect x="636" y="232" width="7" height="15" fill="#071D49"/>
  <rect x="653" y="232" width="7" height="15" fill="#071D49"/>
  <rect x="636" y="262" width="7" height="15" fill="#071D49"/>
  <rect x="653" y="262" width="7" height="15" fill="#071D49"/>
  <rect x="636" y="292" width="7" height="15" fill="#071D49"/>
  <rect x="643" y="318" width="16" height="17" fill="#071D49"/>

  <!-- "YEARS" Text -->
  <text x="746" y="328" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="25" font-weight="700" letter-spacing="4" fill="url(#gmhGoldGrad)">YEARS</text>

  <!-- Bottom Horizontal Baseline under 11 Years -->
  <line x1="550" y1="344" x2="752" y2="344" stroke="url(#gmhGoldGrad)" stroke-width="2"/>

  <!-- Slogan: "BUILT BY VISION, SUSTAINED BY TRUST" -->
  <text x="651" y="375" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="14.5" font-weight="600" letter-spacing="4.5" fill="url(#gmhGoldGrad)" text-anchor="middle">BUILT BY VISION,</text>
  <text x="651" y="398" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="14.5" font-weight="600" letter-spacing="4.5" fill="url(#gmhGoldGrad)" text-anchor="middle">SUSTAINED BY TRUST</text>
</svg>
`.trim();

let cachedGmhLogoPng: string | null = null;

/**
 * Returns a high-definition PNG base64 string of the GMH Luxury Logo for PPTX & PDF exports
 */
export async function getGmhLogoDataUrl(): Promise<string> {
  if (cachedGmhLogoPng) {
    return cachedGmhLogoPng;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([GMH_LOGO_SVG], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1600;
          canvas.height = 800;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#071D49";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/png", 0.95);
            cachedGmhLogoPng = dataUrl;
            URL.revokeObjectURL(url);
            resolve(dataUrl);
            return;
          }
        } catch (e) {
          console.warn("Canvas rasterization error:", e);
        }
        URL.revokeObjectURL(url);
        resolve(`data:image/svg+xml;utf8,${encodeURIComponent(GMH_LOGO_SVG)}`);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(`data:image/svg+xml;utf8,${encodeURIComponent(GMH_LOGO_SVG)}`);
      };

      img.src = url;
    } catch (err) {
      console.warn("Error creating GMH logo data url:", err);
      resolve(`data:image/svg+xml;utf8,${encodeURIComponent(GMH_LOGO_SVG)}`);
    }
  });
}
