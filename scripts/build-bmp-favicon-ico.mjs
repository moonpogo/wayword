#!/usr/bin/env node
/**
 * Writes favicon.ico using BMP (DIB) bitmaps — Safari historically rejects PNG-in-ICO.
 * Reads favicon-16x16.png and favicon-32x32.png from repo root (RGBA PNG).
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function decodePngRgba(buf) {
  if (buf.slice(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("not png");
  let o = 8;
  let width;
  let height;
  const idats = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o);
    o += 4;
    const type = buf.slice(o, o + 4).toString("ascii");
    o += 4;
    const data = buf.slice(o, o + len);
    o += len;
    o += 4;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    }
    if (type === "IDAT") idats.push(data);
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4;
  const stride = width * bpp;
  const rgba = Buffer.alloc(height * stride);
  let pos = 0;
  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const row = raw.slice(pos, pos + stride);
    pos += stride;
    const outRow = y * stride;
    for (let x = 0; x < stride; x++) {
      let v = row[x];
      if (filter === 1) v += x >= bpp ? rgba[outRow + x - bpp] : 0;
      else if (filter === 2) v += y > 0 ? rgba[outRow - stride + x] : 0;
      else if (filter === 3) {
        const left = x >= bpp ? rgba[outRow + x - bpp] : 0;
        const up = y > 0 ? rgba[outRow - stride + x] : 0;
        v += Math.floor((left + up) / 2);
      } else if (filter === 4) {
        const left = x >= bpp ? rgba[outRow + x - bpp] : 0;
        const up = y > 0 ? rgba[outRow - stride + x] : 0;
        const ul = x >= bpp && y > 0 ? rgba[outRow - stride + x - bpp] : 0;
        v += paeth(left, up, ul);
      }
      rgba[outRow + x] = v & 255;
    }
  }
  return { width, height, rgba };
}

/** One ICO image: BITMAPINFOHEADER + bottom-up BGRA XOR + AND mask (all opaque). */
function dib32ForIco(width, height, rgbaTopDown) {
  const biSize = 40;
  const header = Buffer.alloc(biSize);
  header.writeUInt32LE(40, 0);
  header.writeUInt32LE(width, 4);
  header.writeUInt32LE(height * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(width * height * 4, 20);
  header.writeInt32LE(0, 24);
  header.writeInt32LE(0, 28);
  header.writeUInt32LE(0, 32);
  header.writeUInt32LE(0, 36);

  const xor = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row++) {
    const srcY = height - 1 - row;
    for (let x = 0; x < width; x++) {
      const si = (srcY * width + x) * 4;
      const di = (row * width + x) * 4;
      xor[di] = rgbaTopDown[si + 2];
      xor[di + 1] = rgbaTopDown[si + 1];
      xor[di + 2] = rgbaTopDown[si];
      xor[di + 3] = rgbaTopDown[si + 3];
    }
  }

  const maskRowBytes = ((width + 31) >> 5) << 2;
  const andMask = Buffer.alloc(maskRowBytes * height);

  return Buffer.concat([header, xor, andMask]);
}

function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + count * 16;
  for (const { width, height, dib } of images) {
    const e = Buffer.alloc(16);
    e[0] = width >= 256 ? 0 : width;
    e[1] = height >= 256 ? 0 : height;
    e[2] = 0;
    e[3] = 0;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(dib.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += dib.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.dib)]);
}

const sizes = [16, 32];
const images = [];
for (const s of sizes) {
  const pngPath = path.join(root, `favicon-${s}x${s}.png`);
  const { width, height, rgba } = decodePngRgba(fs.readFileSync(pngPath));
  if (width !== s || height !== s) throw new Error(`expected ${s}x${s}, got ${width}x${height}`);
  images.push({ width, height, dib: dib32ForIco(width, height, rgba) });
}

const ico = buildIco(images);
const outPath = path.join(root, "favicon.ico");
fs.writeFileSync(outPath, ico);
console.log("wrote", outPath, ico.length, "bytes");
