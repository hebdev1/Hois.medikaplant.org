/**
 * Derives the web brand assets from the master Hoïs logo PNG.
 *
 *   node scripts/make-brand-assets.mjs
 *
 * Outputs:
 *   public/logo-hois.png   wordmark for the header/sidebar (width-capped)
 *   app/icon.png           square favicon — the "H" glyph (Next.js App Router
 *                          picks this up automatically)
 *   app/apple-icon.png     180x180 on a cream plate (iOS ignores alpha)
 */
import sharp from 'sharp';
import fs from 'node:fs';

const SRC = 'public/Hois logo orange.png.png';
if (!fs.existsSync(SRC)) {
  console.error('Master logo not found at', SRC);
  process.exit(1);
}

// 1. Tight-crop the transparent margin off the master once.
const trimmed = await sharp(SRC).trim().png().toBuffer();
const meta = await sharp(trimmed).metadata();
console.log(`trimmed master: ${meta.width} x ${meta.height}`);

// 2. Wordmark for the header — cap the width, keep alpha, compress.
await sharp(trimmed)
  .resize({ width: 1200, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/logo-hois.png');

// 3. Favicon: the leading "H" glyph. Take the left slice, re-trim to the
//    glyph's own bounds, then centre it on a square transparent canvas.
const slice = Math.round(meta.width * 0.29);
const glyph = await sharp(trimmed)
  .extract({ left: 0, top: 0, width: slice, height: meta.height })
  .trim()
  .png()
  .toBuffer();
const g = await sharp(glyph).metadata();
console.log(`H glyph: ${g.width} x ${g.height}`);

// sharp runs resize BEFORE composite, so the glyph must be scaled to its
// final size first and then placed on an already-square canvas.
async function makeIcon(size, background, out) {
  const inner = Math.round(size * 0.76); // ~12% breathing room each side
  const scaled = await sharp(glyph)
    .resize({
      width: inner,
      height: inner,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: scaled, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(out);
}

// Favicon — transparent so it sits on any browser chrome.
await makeIcon(512, { r: 0, g: 0, b: 0, alpha: 0 }, 'app/icon.png');
// Apple touch icon — cream plate (iOS flattens transparency to black).
await makeIcon(180, { r: 254, g: 252, b: 246, alpha: 1 }, 'app/apple-icon.png');

for (const f of ['public/logo-hois.png', 'app/icon.png', 'app/apple-icon.png']) {
  console.log(`${(fs.statSync(f).size / 1024).toFixed(1)} KB  ${f}`);
}
