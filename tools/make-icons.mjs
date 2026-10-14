// Erzeugt die App-Icons (PNG) ohne Abhängigkeiten: node tools/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const BG1 = hex('#140B2B'), BG2 = hex('#3A1060');
const YEL = hex('#FFD23F'), ORA = hex('#FF9F43'), MAG = hex('#FF2E88'), VIO = hex('#B14CFF');

function draw(size, scale) {
  const px = new Uint8Array(size * size * 3);
  const c = size / 2;
  const horizon = c + 0.18 * size * scale;
  const sunY = horizon - 0.02 * size * scale, sunR = 0.3 * size * scale;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = mix(BG1, BG2, Math.min(1, y / horizon));
      if (y > horizon) {
        col = mix(BG2, BG1, Math.min(1, (y - horizon) / (size - horizon) * 1.6));
        // Perspektivisches Raster: Querlinien werden zum Horizont dichter, Längslinien laufen zusammen.
        const d = (y - horizon) / (size * scale);
        const z = 1 / (d + 0.02);
        const hLine = Math.abs(((z * 0.9) % 1) - 0.5) > 0.5 - 0.035 * z * d * 6;
        const vx = (x - c) / ((y - horizon) + 1e-3) * 0.9;
        const vLine = Math.abs(vx - Math.round(vx)) < 0.04 + 0.6 / (y - horizon + 2);
        if (hLine || vLine) col = mix(col, hLine ? MAG : VIO, Math.min(1, 0.35 + d * 2));
      } else {
        const dx = x - c, dy = y - sunY;
        if (dx * dx + dy * dy < sunR * sunR) {
          const t = (y - (sunY - sunR)) / sunR; // 0 oben … 1 Horizont
          const stripe = t > 0.45 && Math.sin((t - 0.45) * 26) > 0.35 - t * 0.6;
          if (!stripe) col = t < 0.5 ? mix(YEL, ORA, t * 2) : mix(ORA, MAG, (t - 0.5) * 2);
        }
      }
      px.set(col, (y * size + x) * 3);
    }
  }
  return px;
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function png(size, px) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) Buffer.from(px.buffer, y * size * 3, size * 3).copy(raw, y * (size * 3 + 1) + 1);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('icons', { recursive: true });
for (const [name, size, scale] of [['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['maskable-512.png', 512, 0.78]]) {
  writeFileSync(`icons/${name}`, png(size, draw(size, scale)));
  console.log('wrote', name);
}
