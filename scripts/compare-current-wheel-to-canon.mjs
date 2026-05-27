import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.env.WHEEL_URL || 'http://127.0.0.1:3001/index.html?seasonFixture=extreme&seasonWheelDebug=full';
const CANON_FILE = process.env.CANON_FILE || '/Users/andrewrodriguez/Desktop/wayword/assets/wayword_season_wheel_v15_subtext_removed.svg';
const WIDTH = Number(process.env.PARITY_WIDTH || 2200);
const HEIGHT = Number(process.env.PARITY_HEIGHT || 2200);
const STRICT_CHANNEL_DELTA = Number(process.env.STRICT_CHANNEL_DELTA || 0);

function pct(n) {
  return `${(n * 100).toFixed(4)}%`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(URL, { waitUntil: 'networkidle' });
  const ensureWheelVisible = async () => {
    const already = await page.$('.season-wheel-debug-svg');
    if (already) return;
    await page.evaluate(() => {
      const landing = document.getElementById('landingView');
      if (landing) landing.classList.add('hidden');
      const appView = document.getElementById('appView');
      if (appView) {
        appView.removeAttribute('aria-hidden');
        appView.classList.remove('hidden');
      }
      const profileView = document.getElementById('profileView');
      if (profileView) profileView.classList.remove('hidden');
      document.body.classList.add('patterns-open');
      if (typeof window.renderCurrentSeasonPanel === 'function') {
        window.renderCurrentSeasonPanel();
      }
    });
  };

  await ensureWheelVisible();
  await page.waitForSelector('.season-wheel-debug-svg, .current-season-canon-exact-mount svg, .current-season-canon-tile__image', { timeout: 12000, state: 'attached' });

  const currentSvg = await page.evaluate(async () => {
    const directSvg = document.querySelector('.season-wheel-debug-svg, .current-season-canon-exact-mount svg');
    if (directSvg) return directSvg.outerHTML;
    const img = document.querySelector('.current-season-canon-tile__image');
    if (img && img.tagName.toLowerCase() === 'img') {
      const src = img.getAttribute('src') || '';
      if (src) {
        const res = await fetch(src, { cache: 'no-store' });
        if (res.ok) return await res.text();
      }
    }
    return '';
  });
  if (!currentSvg) throw new Error('Could not resolve current wheel SVG markup from page');
  const canonSvg = fs.readFileSync(CANON_FILE, 'utf8');

  const result = await page.evaluate(async ({ currentSvg, canonSvg, width, height, strictChannelDelta }) => {
    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}...`));
        img.src = src;
      });
    }

    const currentUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(currentSvg)}`;
    const canonUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(canonSvg)}`;
    const [currentImg, canonImg] = await Promise.all([loadImage(currentUrl), loadImage(canonUrl)]);

    const aCanvas = document.createElement('canvas');
    const bCanvas = document.createElement('canvas');
    aCanvas.width = width;
    aCanvas.height = height;
    bCanvas.width = width;
    bCanvas.height = height;

    const actx = aCanvas.getContext('2d', { willReadFrequently: true });
    const bctx = bCanvas.getContext('2d', { willReadFrequently: true });

    actx.drawImage(currentImg, 0, 0, width, height);
    bctx.drawImage(canonImg, 0, 0, width, height);

    const aData = actx.getImageData(0, 0, width, height).data;
    const bData = bctx.getImageData(0, 0, width, height).data;

    let mismatchedPixels = 0;
    let maxChannelDelta = 0;
    const totalPixels = width * height;

    for (let i = 0; i < aData.length; i += 4) {
      const dr = Math.abs(aData[i] - bData[i]);
      const dg = Math.abs(aData[i + 1] - bData[i + 1]);
      const db = Math.abs(aData[i + 2] - bData[i + 2]);
      const da = Math.abs(aData[i + 3] - bData[i + 3]);
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
  }, { currentSvg, canonSvg, width: WIDTH, height: HEIGHT, strictChannelDelta: STRICT_CHANNEL_DELTA });

  console.log('Current Wheel vs Canon SVG Pixel Diff');
  console.log('------------------------------------');
  console.log(`URL: ${URL}`);
  console.log(`Canon file: ${CANON_FILE}`);
  console.log(`Resolution: ${WIDTH}x${HEIGHT}`);
  console.log(`Strict channel delta: ${result.strictChannelDelta}`);
  console.log(`Max observed channel delta: ${result.maxChannelDelta}`);
  console.log(`Mismatched pixels: ${result.mismatchedPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()}`);
  console.log(`Mismatch ratio: ${pct(result.mismatchRatio)}`);
} finally {
  await browser.close();
}
