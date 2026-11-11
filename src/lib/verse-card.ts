/** Verse card: turns pasted verses into couplets and paints a shareable image.
 * Book pages are original scans, so the reader types or pastes the verses. */

export type VerseLine = { right: string; left?: string };
export type VerseCardTheme = "emerald" | "paper" | "night";
export type VerseCardFormat = "square" | "story";

export const VERSE_CARD_MAX_LINES = 8;

// صدر and عجز may be separated by a bar, stars, an ellipsis, a tab or 3+ spaces.
const HEMISTICH_SPLIT = /\s*(?:\||\*{2,}|…+|\.{3,}|\t+)\s*|\s{3,}/;

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

/** Each line is one verse. When no line carries a separator, consecutive
 * lines are paired as صدر then عجز. A leftover line stays centred alone. */
export function parseVerses(input: string): VerseLine[] {
  const raw = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!raw.length) return [];
  const anySeparator = raw.some(line => HEMISTICH_SPLIT.test(line));
  const result: VerseLine[] = [];
  if (anySeparator) {
    for (const line of raw) {
      const parts = line.split(HEMISTICH_SPLIT).map(clean).filter(Boolean);
      if (parts.length >= 2) result.push({ right: parts[0], left: parts.slice(1).join(" ") });
      else result.push({ right: clean(line) });
    }
  } else {
    for (let i = 0; i < raw.length; i += 2) {
      const right = clean(raw[i]);
      const left = raw[i + 1] ? clean(raw[i + 1]) : undefined;
      result.push(left ? { right, left } : { right });
    }
  }
  return result.slice(0, VERSE_CARD_MAX_LINES);
}

/** Plain text for copying/sharing: hemistichs joined by a wide gap. */
export function versesToText(lines: VerseLine[], source?: string): string {
  const body = lines.map(l => l.left ? `${l.right}    ${l.left}` : l.right).join("\n");
  return source ? `${body}\n\n— ${source}` : body;
}

export const VERSE_CARD_SIZES: Record<VerseCardFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

// Exported image palettes (painted pixels, not page styling).
const PALETTES: Record<VerseCardTheme, { bg: string; glow: string; ink: string; accent: string; muted: string; frame: string }> = {
  emerald: { bg: "#0d2a24", glow: "#1d4a3e", ink: "#f6efdc", accent: "#d8b45a", muted: "#bfae84", frame: "#c9a24a" },
  paper: { bg: "#f4ecd8", glow: "#fffaf0", ink: "#2b241a", accent: "#8a6420", muted: "#7a6a4d", frame: "#a77d2c" },
  night: { bg: "#0f1422", glow: "#1e2740", ink: "#f2ecdf", accent: "#e0bf6a", muted: "#a9a28f", frame: "#c8a656" },
};

export type VerseCardOptions = {
  lines: VerseLine[];
  theme: VerseCardTheme;
  format: VerseCardFormat;
  title?: string;
  source?: string;
  logo?: HTMLImageElement | null;
};

const VERSE_FONT = "Amiri";
const LABEL_FONT = "'IBM Plex Sans Arabic', 'Cairo', sans-serif";

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
  ctx.closePath(); ctx.fill();
}

function ornament(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - 18, y); ctx.moveTo(cx + 18, y); ctx.lineTo(cx + half, y); ctx.stroke();
  diamond(ctx, cx, y, 9);
  diamond(ctx, cx - half, y, 4); diamond(ctx, cx + half, y, 4);
  ctx.restore();
}

/** Paint the card on a canvas. Fonts must be loaded first (see loadVerseCardFonts). */
export function drawVerseCard(canvas: HTMLCanvasElement, opts: VerseCardOptions) {
  const { width: W, height: H } = VERSE_CARD_SIZES[opts.format];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const p = PALETTES[opts.theme];

  // Background with a soft central glow.
  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, p.glow); g.addColorStop(1, p.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Double frame with corner diamonds.
  const m = 44;
  ctx.strokeStyle = p.frame; ctx.lineWidth = 3; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.lineWidth = 1.2; ctx.strokeRect(m + 14, m + 14, W - 2 * (m + 14), H - 2 * (m + 14));
  ctx.fillStyle = p.frame;
  for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) diamond(ctx, x, y, 12);

  ctx.direction = "rtl";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // Header: logo + title.
  let top = m + 60;
  if (opts.logo && opts.logo.naturalWidth) {
    const lh = opts.format === "story" ? 170 : 120;
    const lw = lh * (opts.logo.naturalWidth / opts.logo.naturalHeight);
    ctx.drawImage(opts.logo, (W - lw) / 2, top, lw, lh);
    top += lh + 24;
  }
  if (opts.title) {
    ctx.fillStyle = p.accent;
    ctx.font = `700 ${opts.format === "story" ? 44 : 38}px ${VERSE_FONT}`;
    ctx.fillText(opts.title, W / 2, top + 20, W - 2 * m - 80);
    top += 60;
  }
  ornament(ctx, W / 2, top + 6, 170, p.frame);
  top += 40;

  // Footer.
  const footerH = 130;
  const bottom = H - m - footerH;
  ornament(ctx, W / 2, bottom + 14, 170, p.frame);
  if (opts.source) {
    ctx.fillStyle = p.muted;
    ctx.font = `500 30px ${LABEL_FONT}`;
    ctx.fillText(`— ${opts.source}`, W / 2, bottom + 62, W - 2 * m - 80);
  }
  ctx.fillStyle = p.accent;
  ctx.font = `600 26px ${LABEL_FONT}`;
  ctx.fillText("رحاب الخليلية", W / 2, bottom + 104);

  // Verses: one shared size for all hemistichs so the poem reads evenly.
  const lines = opts.lines.length ? opts.lines : [{ right: "اكتب الأبيات لتظهر هنا" }];
  const inner = W - 2 * m - 100;
  const gap = 56;
  const half = (inner - gap) / 2;
  const area = bottom - top - 20;
  const maxSize = opts.format === "story" ? 64 : 56;
  const measure = (text: string, size: number) => { ctx.font = `700 ${size}px ${VERSE_FONT}`; return ctx.measureText(text).width; };

  const sideBySideSize = (() => {
    let size = maxSize;
    for (const l of lines) {
      for (const t of [l.right, l.left].filter(Boolean) as string[]) {
        const limit = l.left ? half : inner;
        const w = measure(t, maxSize);
        if (w > limit) size = Math.min(size, Math.floor(maxSize * limit / w));
      }
    }
    return size;
  })();
  // Narrow cards stack صدر above عجز when side by side would be too small.
  const stacked = sideBySideSize < 38;
  let size = stacked
    ? Math.min(maxSize, ...lines.flatMap(l => [l.right, l.left].filter(Boolean).map(t => Math.floor(maxSize * Math.min(1, (inner * 0.92) / measure(t as string, maxSize))))))
    : sideBySideSize;
  const rowsPerVerse = stacked ? 2 : 1;
  const totalRows = lines.reduce((n, l) => n + (l.left ? rowsPerVerse : 1), 0);
  const leading = (s: number) => s * (stacked ? 1.75 : 2.1);
  size = Math.max(22, Math.min(size, Math.floor(area / (totalRows * (stacked ? 1.75 : 2.1)))));
  const rowH = leading(size);
  let y = top + 10 + (area - totalRows * rowH) / 2 + rowH / 2;

  ctx.fillStyle = p.ink;
  ctx.font = `700 ${size}px ${VERSE_FONT}`;
  const right = W / 2 + inner / 2;
  const left = W / 2 - inner / 2;
  for (const l of lines) {
    if (!l.left) {
      ctx.textAlign = "center"; ctx.fillText(l.right, W / 2, y, inner); y += rowH; continue;
    }
    if (stacked) {
      ctx.textAlign = "right"; ctx.fillText(l.right, right, y, inner); y += rowH;
      ctx.textAlign = "left"; ctx.fillText(l.left, left, y, inner); y += rowH;
    } else {
      ctx.textAlign = "center";
      ctx.fillText(l.right, right - half / 2, y, half);
      ctx.fillText(l.left, left + half / 2, y, half);
      ctx.fillStyle = p.frame; diamond(ctx, W / 2, y, 5); ctx.fillStyle = p.ink;
      y += rowH;
    }
  }
}

export async function loadVerseCardFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`700 48px ${VERSE_FONT}`, "بيت"),
    document.fonts.load(`500 30px 'IBM Plex Sans Arabic'`, "بيت"),
    document.fonts.load(`600 26px 'IBM Plex Sans Arabic'`, "بيت"),
  ]);
}
