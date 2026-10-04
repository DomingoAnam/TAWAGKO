/**
 * Generates the TAWAGKO launcher icon + splash image (PNG).
 *
 *   node scripts/generate-icons.js
 *
 * Draws the same mark used in-app: an indigo rounded square with a white
 * cellphone emitting amber vibration arcs on both sides — an alert going out.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const PRIMARY = [0x2f, 0x3e, 0x9e];
const ACCENT = [0xf2, 0xa0, 0x3d];
const WHITE = [0xff, 0xff, 0xff];

const OUT_DIR = path.join(__dirname, '..', 'assets');

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** Signed distance to a rounded rectangle centred on (cx, cy). */
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/** Distance to a line segment, used for the phone outline strokes. */
function sdSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  return Math.hypot(wx - vx * t, wy - vy * t);
}

/**
 * Distance to an arc centred on (cx, cy) of the given radius, spanning
 * `halfAngle` radians either side of the horizontal. Used for the vibration
 * waves either side of the handset.
 */
function sdArc(px, py, cx, cy, radius, halfAngle) {
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.hypot(dx, dy);

  // Fold the angle onto the horizontal axis so the arc reads the same on both
  // sides: angles near 0 stay, angles near +/-pi wrap down to 0.
  let a = Math.atan2(dy, dx);
  if (a > Math.PI / 2) a -= Math.PI;
  if (a < -Math.PI / 2) a += Math.PI;

  // Distance to the chord joining the two arc endpoints. Used only OUTSIDE the
  // angular span. It must never be combined with `dist - radius`, which is
  // negative for every point inside the arc and would flood the interior into a
  // solid disc; nor may it be merged inside the span, which would draw a
  // vertical bar through each wave.
  const ex = cx + Math.cos(halfAngle) * radius;
  const eyTop = cy + Math.sin(halfAngle) * radius;
  const eyBottom = cy - Math.sin(halfAngle) * radius;

  if (Math.abs(a) <= halfAngle) {
    return Math.abs(dist - radius);
  }
  return sdSegment(px, py, ex, eyTop, ex, eyBottom);
}

function drawMark(size, { padding = 0, rounded = true, tile = true } = {}) {
  const png = new PNG({ width: size, height: size });

  const inset = size * padding;
  const box = size - inset * 2;
  const radius = rounded ? box * 0.235 : 0;
  const cx = size / 2;
  const cy = size / 2;

  // Handset geometry, slightly narrower than before to leave room for the arcs.
  const bodyW = box * 0.26;
  const bodyH = box * 0.48;
  const bodyR = bodyW * 0.24;
  const stroke = box * 0.042;

  const bx = cx - bodyW / 2;
  const by = cy - bodyH / 2;
  const bodyCx = bx + bodyW / 2;
  const bodyCy = by + bodyH / 2;

  // Vibration waves: two per side, mirrored about the handset. The radii are
  // spaced wider than the stroke width so the pair stays legible as two waves.
  const arcW = box * 0.03;
  const arcHalf = 0.7; // radians either side of horizontal
  const arcRadii = [bodyW * 0.78 + box * 0.075, bodyW * 0.78 + box * 0.175];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2;
      const px = x + 0.5;
      const py = y + 0.5;

      let colour = [0, 0, 0];
      let alpha = 0;

      // 1. Indigo rounded tile (skipped for adaptive foreground layers)
      const tileSd = sdRoundRect(px, py, cx, cy, box / 2, box / 2, radius);
      const onTile = tile ? tileSd <= 0 : false;

      if (onTile) {
        colour = PRIMARY;
        alpha = 255;
      }

      // 2. Vibration arcs (amber), drawn under the handset body. The left side
      //    reuses the right-side distance with x mirrored about the handset.
      for (const r of arcRadii) {
        const dRight = sdArc(px, py, bodyCx, bodyCy, r, arcHalf);
        const dLeft = sdArc(bodyCx * 2 - px, py, bodyCx, bodyCy, r, arcHalf);
        if (Math.min(dRight, dLeft) <= arcW / 2) {
          colour = ACCENT;
          alpha = 255;
          break;
        }
      }

      // 3. White handset: solid body with the screen cut out.
      const body = sdRoundRect(px, py, bodyCx, bodyCy, bodyW / 2, bodyH / 2, bodyR);

      const screenInset = stroke * 1.35;
      const screen = sdRoundRect(
        px,
        py,
        bodyCx,
        bodyCy,
        bodyW / 2 - screenInset,
        bodyH / 2 - screenInset * 2.2,
        Math.max(1, bodyR * 0.55)
      );

      const speaker = sdSegment(
        px,
        py,
        bx + bodyW * 0.37,
        by + stroke * 1.45,
        bx + bodyW * 0.63,
        by + stroke * 1.45
      );

      const homeBar = sdSegment(
        px,
        py,
        bx + bodyW * 0.38,
        by + bodyH - stroke * 1.5,
        bx + bodyW * 0.62,
        by + bodyH - stroke * 1.5
      );

      const cutout = screen <= 0 || speaker <= stroke * 0.5 || homeBar <= stroke * 0.5;

      if (body <= 0) {
        if (cutout) {
          // Screen punch-out shows the tile colour, or nothing when transparent.
          colour = PRIMARY;
          alpha = tile ? 255 : 0;
        } else {
          colour = WHITE;
          alpha = 255;
        }
      }

      png.data[i] = colour[0];
      png.data[i + 1] = colour[1];
      png.data[i + 2] = colour[2];
      png.data[i + 3] = alpha;
    }
  }

  return png;
}

function write(file, png) {
  const target = path.join(OUT_DIR, file);
  fs.writeFileSync(target, PNG.sync.write(png));
  console.log('wrote', path.relative(process.cwd(), target));
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// iOS / generic app icon: full-bleed rounded tile.
write('icon.png', drawMark(1024, { padding: 0, rounded: true }));

// Android adaptive foreground: glyphs only, transparent, inside the safe zone.
write(
  'android-icon-foreground.png',
  drawMark(1024, { padding: 0.16, rounded: false, tile: false })
);

// Android adaptive background: flat indigo (tile omitted).
const bg = new PNG({ width: 1024, height: 1024 });
for (let i = 0; i < bg.data.length; i += 4) {
  bg.data[i] = PRIMARY[0];
  bg.data[i + 1] = PRIMARY[1];
  bg.data[i + 2] = PRIMARY[2];
  bg.data[i + 3] = 255;
}
write('android-icon-background.png', bg);

// Monochrome: white artwork on transparent (themed icons).
const mono = drawMark(1024, { padding: 0.16, rounded: false, tile: false });
for (let i = 0; i < mono.data.length; i += 4) {
  const on = mono.data[i + 3] > 0;
  mono.data[i] = 255;
  mono.data[i + 1] = 255;
  mono.data[i + 2] = 255;
  mono.data[i + 3] = on ? 255 : 0;
}
write('android-icon-monochrome.png', mono);

// Splash artwork: mark only, transparent background.
write('splash-icon.png', drawMark(512, { padding: 0, rounded: true }));

// Favicon.
write('favicon.png', drawMark(48, { padding: 0, rounded: true }));