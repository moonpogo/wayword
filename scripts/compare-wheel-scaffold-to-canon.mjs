import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.env.WHEEL_URL || 'http://127.0.0.1:3001/index.html?seasonFixture=extreme&seasonWheelDebug=full';
const CANON_FILE = process.env.CANON_FILE || '/Users/andrewrodriguez/Desktop/wayword/assets/wayword_season_wheel_v15_subtext_removed.svg';
const WIDTH = Number(process.env.PARITY_WIDTH || 2200);
const HEIGHT = Number(process.env.PARITY_HEIGHT || 2200);

function extractScaffold(svg) {
  const circles = [...svg.matchAll(/<circle\b[^>]*>/g)].map((m) => m[0]);
  const lines = [...svg.matchAll(/<line\b[^>]*>/g)].map((m) => m[0]);

  const centered = circles.filter((c) => /cx="1100(?:\.0+)?"/.test(c) && /cy="1100(?:\.0+)?"/.test(c));
  const rings = centered.filter((c) => {
    const r = Number((/r="([^"]+)"/.exec(c)?.[1]) || NaN);
    return Number.isFinite(r) && r >= 200 && r <= 920;
  });

  const rails = lines.filter((l) => {
    const x1 = Number((/x1="([^"]+)"/.exec(l)?.[1]) || NaN);
    const y1 = Number((/y1="([^"]+)"/.exec(l)?.[1]) || NaN);
    const x2 = Number((/x2="([^"]+)"/.exec(l)?.[1]) || NaN);
    const y2 = Number((/y2="([^"]+)"/.exec(l)?.[1]) || NaN);
    if (![x1, y1, x2, y2].every(Number.isFinite)) return false;
    const inHub = Math.hypot(x1 - 1100, y1 - 1100) < 30;
    const nearOuter = Math.hypot(x2 - 1100, y2 - 1100) > 850;
    return inHub && nearOuter;
  });

  const normRings = rings.map((c) => {
    const r = Number(/r="([^"]+)"/.exec(c)?.[1]).toFixed(2);
    const isMajor = Math.abs(Number(r) - 381.33) < 0.2 || Math.abs(Number(r) - 640.67) < 0.2;
    if (Math.abs(Number(r) - 900) < 0.3) {
      return `<circle cx="1100" cy="1100" r="${r}" fill="none" stroke="#e4ac5f" stroke-opacity="0.58" stroke-width="2"/>`;
    }
    return `<circle cx="1100" cy="1100" r="${r}" fill="none" stroke="${isMajor ? '#f0c47b' : '#e8d2ad'}" stroke-opacity="${isMajor ? '0.38' : '0.28'}" stroke-width="${isMajor ? '1.7' : '1.45'}" stroke-dasharray="${isMajor ? '3 9' : '2 8'}"/>`;
  }).sort();

  const normRails = rails.map((l) => {
    const x1 = Number(/x1="([^"]+)"/.exec(l)?.[1]).toFixed(2);
    const y1 = Number(/y1="([^"]+)"/.exec(l)?.[1]).toFixed(2);
    const x2 = Number(/x2="([^"]+)"/.exec(l)?.[1]).toFixed(2);
    const y2 = Number(/y2="([^"]+)"/.exec(l)?.[1]).toFixed(2);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d9c5a4" stroke-opacity="0.18" stroke-width="1.05"/>`;
  }).sort();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2200 2200"><rect width="2200" height="2200" fill="#000"/>${normRings.join('')}${normRails.join('')}</svg>`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const landing = document.getElementById('landingView');
    if (landing) landing.classList.add('hidden');
    const appView = document.getElementById('appView');
    if (appView) appView.classList.remove('hidden');
    const profileView = document.getElementById('profileView');
    if (profileView) profileView.classList.remove('hidden');
    if (typeof window.renderCurrentSeasonPanel === 'function') window.renderCurrentSeasonPanel();
  });
  await page.waitForSelector('.season-wheel-debug-svg', { state: 'attached', timeout: 12000 });

  const currentSvg = await page.$eval('.season-wheel-debug-svg', (el) => el.outerHTML);
  const canonSvg = fs.readFileSync(CANON_FILE, 'utf8');
  const currentScaffold = extractScaffold(currentSvg);
  const canonScaffold = extractScaffold(canonSvg);

  const result = await page.evaluate(async ({ a, b, width, height }) => {
    const load = (src) => new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
    const [ai, bi] = await Promise.all([
      load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(a)}`),
      load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(b)}`),
    ]);
    const c1 = document.createElement('canvas');
    const c2 = document.createElement('canvas');
    c1.width = c2.width = width;
    c1.height = c2.height = height;
    const x1 = c1.getContext('2d', { willReadFrequently: true });
    const x2 = c2.getContext('2d', { willReadFrequently: true });
    x1.drawImage(ai, 0, 0, width, height);
    x2.drawImage(bi, 0, 0, width, height);
    const d1 = x1.getImageData(0,0,width,height).data;
    const d2 = x2.getImageData(0,0,width,height).data;
    let mismatch = 0;
    for (let i=0;i<d1.length;i+=4) {
      if (d1[i]!==d2[i] || d1[i+1]!==d2[i+1] || d1[i+2]!==d2[i+2] || d1[i+3]!==d2[i+3]) mismatch++;
    }
    return { mismatch, total: width*height, ratio: mismatch/(width*height) };
  }, { a: currentScaffold, b: canonScaffold, width: WIDTH, height: HEIGHT });

  console.log('Scaffold parity vs canon');
  console.log(`Mismatch: ${result.mismatch.toLocaleString()} / ${result.total.toLocaleString()}`);
  console.log(`Mismatch ratio: ${(result.ratio*100).toFixed(4)}%`);
} finally {
  await browser.close();
}
