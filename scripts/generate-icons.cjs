const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// 1. Vector SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071D49" />
      <stop offset="100%" stop-color="#04122E" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCEBA6" />
      <stop offset="40%" stop-color="#E5C158" />
      <stop offset="70%" stop-color="#C59B27" />
      <stop offset="100%" stop-color="#8E6510" />
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="104" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="488" height="488" rx="92" fill="none" stroke="url(#goldGrad)" stroke-width="3" opacity="0.4" />

  <!-- Monogram & Tower Elements -->
  <g transform="translate(64, 56) scale(0.75)" filter="url(#goldGlow)">
    <!-- Tower Left Pillar ("1") -->
    <path d="M 120,380 L 120,120 L 70,160 L 50,135 L 140,60 L 175,60 L 175,380 Z" fill="url(#goldGrad)" />
    <!-- Tower Right Pillar ("1" with architectural windows) -->
    <path d="M 210,380 L 210,80 L 290,135 L 290,380 Z" fill="url(#goldGrad)" />
    <!-- Windows inside right tower -->
    <rect x="230" y="140" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="256" y="140" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="230" y="180" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="256" y="180" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="230" y="220" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="256" y="220" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="230" y="260" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="256" y="260" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="230" y="300" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />
    <rect x="256" y="300" width="16" height="24" rx="2" fill="#071D49" opacity="0.8" />

    <!-- Architectural Base Line -->
    <rect x="40" y="392" width="430" height="8" rx="4" fill="url(#goldGrad)" />

    <!-- Brand Typography "GMH LUXURY" -->
    <text x="256" y="440" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="900" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="6">GMH LUXURY</text>
    <text x="256" y="475" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#E5C158" text-anchor="middle" letter-spacing="4" opacity="0.9">WORKS TRACKER</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(outDir, 'icon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), svgContent, 'utf8');

// CRC32 helper
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Generate raster PNG buffer
function generateAppPng(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  // Navy background colors
  const bgR1 = 7, bgG1 = 29, bgB1 = 73; // #071D49
  const bgR2 = 4, bgG2 = 18, bgB2 = 46; // #04122E

  // Gold colors
  const goldR = 212, goldG = 175, goldB = 55; // #D4AF37
  const goldLightR = 245, goldLightG = 225, goldLightB = 140; // #F5E18C

  const pad = isMaskable ? 0.20 : 0.08;
  const safeLeft = Math.floor(width * pad);
  const safeRight = Math.floor(width * (1 - pad));
  const safeTop = Math.floor(height * pad);
  const safeBottom = Math.floor(height * (1 - pad));
  const safeW = safeRight - safeLeft;
  const safeH = safeBottom - safeTop;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter type 0

    const tY = y / height;
    const curBgR = Math.round(bgR1 * (1 - tY) + bgR2 * tY);
    const curBgG = Math.round(bgG1 * (1 - tY) + bgG2 * tY);
    const curBgB = Math.round(bgB1 * (1 - tY) + bgB2 * tY);

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      let r = curBgR;
      let g = curBgG;
      let b = curBgB;
      let a = 255;

      // Check if inside safe content zone
      if (x >= safeLeft && x <= safeRight && y >= safeTop && y <= safeBottom) {
        const nx = (x - safeLeft) / safeW; // 0..1
        const ny = (y - safeTop) / safeH; // 0..1

        // Draw Left Tower "1" (nx around 0.22 to 0.44, ny around 0.15 to 0.75)
        const inLeftTower = nx >= 0.24 && nx <= 0.40 && ny >= 0.18 && ny <= 0.75;
        const inLeftBevel = ny >= 0.18 && ny <= 0.32 && nx >= (0.24 - (0.32 - ny) * 0.8) && nx <= 0.24;

        // Draw Right Tower "1" (nx around 0.46 to 0.74, ny around 0.12 to 0.75)
        const inRightTower = nx >= 0.48 && nx <= 0.72 && ny >= 0.12 && ny <= 0.75;

        // Base foundation bar (ny around 0.78 to 0.82)
        const inBase = nx >= 0.15 && nx <= 0.85 && ny >= 0.78 && ny <= 0.82;

        // Bottom Brand Accent bar (ny around 0.88 to 0.91)
        const inSubBase = nx >= 0.25 && nx <= 0.75 && ny >= 0.87 && ny <= 0.90;

        // Windows cut-out in right tower
        let isWindow = false;
        if (inRightTower) {
          const winCol1 = nx >= 0.53 && nx <= 0.58;
          const winCol2 = nx >= 0.62 && nx <= 0.67;
          if (winCol1 || winCol2) {
            for (let row = 0; row < 6; row++) {
              const winTop = 0.22 + row * 0.085;
              const winBottom = winTop + 0.055;
              if (ny >= winTop && ny <= winBottom) {
                isWindow = true;
                break;
              }
            }
          }
        }

        if ((inLeftTower || inLeftBevel || inRightTower || inBase || inSubBase) && !isWindow) {
          // Gold gradient shading
          const goldFactor = (nx * 0.5 + (1 - ny) * 0.5);
          r = Math.round(goldR * (1 - goldFactor) + goldLightR * goldFactor);
          g = Math.round(goldG * (1 - goldFactor) + goldLightG * goldFactor);
          b = Math.round(goldB * (1 - goldFactor) + goldLightB * goldFactor);
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const idat = zlib.deflateSync(rawData);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = chunk('IHDR', ihdrData);
  const idatChunk = chunk('IDAT', idat);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idatChunk, iend]);
}

// Generate and write all standard PWA icons
console.log('Generating 192x192 icon...');
fs.writeFileSync(path.join(outDir, 'icon-192.png'), generateAppPng(192, false));

console.log('Generating 512x512 icon...');
fs.writeFileSync(path.join(outDir, 'icon-512.png'), generateAppPng(512, false));

console.log('Generating 512x512 maskable icon...');
fs.writeFileSync(path.join(outDir, 'icon-maskable.png'), generateAppPng(512, true));

console.log('Generating 180x180 Apple Touch Icon...');
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generateAppPng(180, false));
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), generateAppPng(180, false));

console.log('All PWA icons successfully generated in /public/icons');
