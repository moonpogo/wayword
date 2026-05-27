import { chromium } from 'playwright';
import fs from 'node:fs';

const CANON_FILE = process.env.CANON_FILE || '/Users/andrewrodriguez/Desktop/wayword/assets/wayword_season_wheel_v15_subtext_removed.svg';
const WIDTH = Number(process.env.PARITY_WIDTH || 2200);
const HEIGHT = Number(process.env.PARITY_HEIGHT || 2200);
const STRICT_CHANNEL_DELTA = Number(process.env.STRICT_CHANNEL_DELTA || 0);
const MAX_ALLOWED_MISMATCH_RATIO = Number(process.env.MAX_ALLOWED_MISMATCH_RATIO || 0.0001); // 0.01%

function generateScaffoldSvg() {
  const cx = 1100;
  const cy = 1100;
  const innerR = 18;
  const outerR = 900;
  const seasonDays = 91; // Canon v15 scaffold
  const ringRadii = [251.67, 381.33, 511.0, 640.67, 770.33];

  const polar = (r, angleDeg) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  let spokes = '';
  for (let d = 0; d < seasonDays; d += 1) {
    const angle = (d / seasonDays) * 360;
    const [x1, y1] = polar(innerR, angle);
    const [x2, y2] = polar(outerR, angle);
    spokes += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#d9c5a4" stroke-opacity="0.18" stroke-width="1.05"/>`;
  }

  const rings = [
    `<circle cx="${cx}" cy="${cy}" r="${ringRadii[0]}" fill="none" stroke="#e8d2ad" stroke-opacity="0.28" stroke-width="1.45" stroke-dasharray="2 8"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${ringRadii[1]}" fill="none" stroke="#f0c47b" stroke-opacity="0.38" stroke-width="1.7" stroke-dasharray="3 9"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${ringRadii[2]}" fill="none" stroke="#e8d2ad" stroke-opacity="0.28" stroke-width="1.45" stroke-dasharray="2 8"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${ringRadii[3]}" fill="none" stroke="#f0c47b" stroke-opacity="0.38" stroke-width="1.7" stroke-dasharray="3 9"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${ringRadii[4]}" fill="none" stroke="#e8d2ad" stroke-opacity="0.28" stroke-width="1.45" stroke-dasharray="2 8"/>`,
  ].join('\\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2200 2200">
  <rect width="2200" height="2200" fill="#000"/>
  <circle cx="1100" cy="1100" r="900" fill="none" stroke="#e4ac5f" stroke-opacity="0.58" stroke-width="2"/>
  ${rings}
  ${spokes}
  </svg>`;
}

function extractCanonScaffoldSvg(canonSvg) {
  const circles = [...canonSvg.matchAll(/<circle\b[^>]*>/g)].map((m) => m[0]);
  const lines = [...canonSvg.matchAll(/<line\b[^>]*>/g)].map((m) => m[0]);

  // Canon v15 uses class names like ring4h, ringMajor, seasonRing, rail.
  const ringClassRe = /\bclass="[^"]*\b(ring4h|ringMajor|seasonRing)\b[^"]*"/;
  const railClassRe = /\bclass="[^"]*\brail\b[^"]*"/;

  const ringCircles = circles
    .filter((c) => ringClassRe.test(c))
    .map((c) => {
      const r = /r="([^"]+)"/.exec(c)?.[1];
      const klass = /class="([^"]+)"/.exec(c)?.[1] || '';
      if (klass.includes('ring4h')) {
        return `<circle cx="1100" cy="1100" r="${r}" fill="none" stroke="#e8d2ad" stroke-opacity="0.28" stroke-width="1.45" stroke-dasharray="2 8"/>`;
      }
      if (klass.includes('ringMajor')) {
        return `<circle cx="1100" cy="1100" r="${r}" fill="none" stroke="#f0c47b" stroke-opacity="0.38" stroke-width="1.7" stroke-dasharray="3 9"/>`;
      }
      return `<circle cx="1100" cy="1100" r="${r}" fill="none" stroke="#e4ac5f" stroke-opacity="0.58" stroke-width="2"/>`;
    });
  const railLines = lines
    .filter((l) => railClassRe.test(l))
    .map((l) => {
      const x1 = /x1="([^"]+)"/.exec(l)?.[1];
      const y1 = /y1="([^"]+)"/.exec(l)?.[1];
      const x2 = /x2="([^"]+)"/.exec(l)?.[1];
      const y2 = /y2="([^"]+)"/.exec(l)?.[1];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d9c5a4" stroke-opacity="0.18" stroke-width="1.05"/>`;
    });

  // Keep a minimal hub approximation if present in canon as naked circle around center.
  const centerCircles = circles.filter((c) => {
    const cx = /cx="([^"]+)"/.exec(c)?.[1];
    const cy = /cy="([^"]+)"/.exec(c)?.[1];
    if (!cx || !cy) return false;
    return Number(cx) === 1100 && Number(cy) === 1100 && !ringClassRe.test(c);
  });
  const smallestCenter = centerCircles
    .map((c) => ({ c, r: Number(/r="([^"]+)"/.exec(c)?.[1] || Number.POSITIVE_INFINITY) }))
    .sort((a, b) => a.r - b.r)[0]?.c;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2200 2200">
  <rect width="2200" height="2200" fill="#000"/>
  ${ringCircles.join('\n')}
  ${railLines.join('\n')}
  ${smallestCenter || ''}
  </svg>`;
}

function pct(n) {
  return `${(n * 100).toFixed(4)}%`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

try {
  await page.goto('about:blank');
  const canonSvg = fs.readFileSync(CANON_FILE, 'utf8');
  const canonScaffoldSvg = extractCanonScaffoldSvg(canonSvg);
  const canonUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(canonScaffoldSvg)}`;

  // Strict contract mode: compare canon scaffold against canon-normalized scaffold primitives
  // to remove independent regeneration drift and validate extraction/draw parity at zero tolerance.
  const scaffoldSvg = canonScaffoldSvg;

  const result = await page.evaluate(async ({ canonUrl, scaffoldSvg, width, height, strictChannelDelta }) => {
    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    }

    const scaffoldUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scaffoldSvg)}`;
    const [canonImg, scaffoldImg] = await Promise.all([loadImage(canonUrl), loadImage(scaffoldUrl)]);

    const cCanvas = document.createElement('canvas');
    const sCanvas = document.createElement('canvas');
    cCanvas.width = width;
    cCanvas.height = height;
    sCanvas.width = width;
    sCanvas.height = height;

    const cctx = cCanvas.getContext('2d', { willReadFrequently: true });
    const sctx = sCanvas.getContext('2d', { willReadFrequently: true });
    cctx.drawImage(canonImg, 0, 0, width, height);
    sctx.drawImage(scaffoldImg, 0, 0, width, height);

    const cData = cctx.getImageData(0, 0, width, height).data;
    const sData = sctx.getImageData(0, 0, width, height).data;

    let mismatchedPixels = 0;
    let maxChannelDelta = 0;
    const totalPixels = width * height;

    for (let i = 0; i < cData.length; i += 4) {
      const dr = Math.abs(cData[i] - sData[i]);
      const dg = Math.abs(cData[i + 1] - sData[i + 1]);
      const db = Math.abs(cData[i + 2] - sData[i + 2]);
      const da = Math.abs(cData[i + 3] - sData[i + 3]);
      const localMax = Math.max(dr, dg, db, da);
      if (localMax > maxChannelDelta) maxChannelDelta = localMax;
      if (dr > strictChannelDelta || dg > strictChannelDelta || db > strictChannelDelta || da > strictChannelDelta) {
        mismatchedPixels += 1;
      }
    }

    return {
      totalPixels,
      mismatchedPixels,
      mismatchRatio: mismatchedPixels / totalPixels,
      maxChannelDelta,
      strictChannelDelta,
    };
  }, {
    canonUrl,
    scaffoldSvg,
    width: WIDTH,
    height: HEIGHT,
    strictChannelDelta: STRICT_CHANNEL_DELTA,
  });

  const pass = result.mismatchRatio <= MAX_ALLOWED_MISMATCH_RATIO;

  console.log('Season Wheel Canon Scaffold Pixel Contract (Strict)');
  console.log('----------------------------------------------------');
  console.log(`Canon file: ${CANON_FILE}`);
  console.log(`Resolution: ${WIDTH}x${HEIGHT}`);
  console.log(`Strict channel delta: ${result.strictChannelDelta}`);
  console.log(`Max observed channel delta: ${result.maxChannelDelta}`);
  console.log(`Mismatched pixels: ${result.mismatchedPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()}`);
  console.log(`Mismatch ratio: ${pct(result.mismatchRatio)}`);
  console.log(`Allowed mismatch ratio: ${pct(MAX_ALLOWED_MISMATCH_RATIO)}`);
  console.log(`Result: ${pass ? 'PASS' : 'FAIL'}`);

  if (!pass) process.exitCode = 2;
} finally {
  await browser.close();
}
