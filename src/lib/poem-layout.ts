import type { Poem, Verse } from "@/data/poems";

export type FlatLine = { text: string; sourceVerseId: number };

export type Stanza = {
  pairs: [[FlatLine, FlatLine], [FlatLine, FlatLine]];
  tail: FlatLine;
};

export type PoemLayout =
  | { kind: "couplets"; verses: Verse[] }
  | { kind: "mukhammas"; stanzas: Stanza[] };

const JUNK_PATTERNS = [
  /^ج+$/,
  /height=/i,
  /^\s*$/,
];

function isJunk(s: string | undefined | null): boolean {
  if (!s) return true;
  const t = s.trim();
  if (!t) return true;
  return JUNK_PATTERNS.some((rx) => rx.test(t));
}

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function wordCount(s: string | undefined | null): number {
  return normalize(s ?? "").split(/\s+/).filter(Boolean).length;
}

function withText(v: Omit<Verse, "text"> & { text?: string }): Verse {
  return {
    ...v,
    text: v.text ?? (v.ajuz ? `${v.sadr} ... ${v.ajuz}` : v.sadr),
  };
}

function mergeWrappedCouplets(verses: Verse[]): Verse[] {
  const merged: Verse[] = [];

  for (let i = 0; i < verses.length; i += 1) {
    let current = verses[i];
    const next = verses[i + 1];

    while (
      next &&
      current.ajuz &&
      next.ajuz &&
      !isJunk(next.sadr) &&
      !isJunk(next.ajuz) &&
      !isRefrain(current.sadr) &&
      !isRefrain(current.ajuz) &&
      !isRefrain(next.sadr) &&
      !isRefrain(next.ajuz) &&
      wordCount(current.sadr) >= 3 &&
      wordCount(current.ajuz) >= 3 &&
      wordCount(next.sadr) <= 2 &&
      wordCount(next.ajuz) <= 2
    ) {
      current = withText({
        ...current,
        sadr: normalize(`${current.sadr} ${next.sadr}`),
        ajuz: normalize(`${current.ajuz} ${next.ajuz}`),
      });
      i += 1;
      break;
    }

    merged.push(current);
  }

  return merged;
}

/** A "refrain" line is one that contains an obvious repeated marker like
 * "الله .. الله .. الله .." which marks the 5th line of a stanza. */
function isRefrain(s: string): boolean {
  const t = normalize(s);
  // 3+ repetitions of "الله" separated by dots/spaces
  const matches = t.match(/الله/g);
  return !!matches && matches.length >= 3;
}

/** Flatten poem into clean sequence of lines, dropping junk fragments. */
function flatten(poem: Poem): FlatLine[] {
  const out: FlatLine[] = [];
  for (const v of poem.verses) {
    if (!isJunk(v.sadr)) out.push({ text: normalize(v.sadr), sourceVerseId: v.id });
    if (!isJunk(v.ajuz)) out.push({ text: normalize(v.ajuz!), sourceVerseId: v.id });
  }
  return out;
}

export function groupPoemVerses(poem: Poem): PoemLayout {
  const flat = flatten(poem);

  // Detect mukhammas: refrain lines should appear roughly every 5 lines.
  const refrainIdx = flat
    .map((l, i) => (isRefrain(l.text) ? i : -1))
    .filter((i) => i >= 0);

  let isMukhammas = false;
  if (refrainIdx.length >= 2) {
    // Each refrain marks the 5th line in its stanza → positions should be 4, 9, 14, ...
    // Check that gaps are mostly 5.
    const gaps = refrainIdx.slice(1).map((v, i) => v - refrainIdx[i]);
    const fives = gaps.filter((g) => g === 5).length;
    if (fives >= Math.max(1, Math.floor(gaps.length * 0.6))) {
      isMukhammas = true;
    }
  }

  if (!isMukhammas) {
    return { kind: "couplets", verses: mergeWrappedCouplets(poem.verses) };
  }

  // Anchor stanza boundaries on refrain positions: refrain is index 4 of stanza.
  // Take first refrain, walk backward to find stanza start, then chunk by 5.
  const firstRefrain = refrainIdx[0];
  const start = firstRefrain - 4;
  const usable = start >= 0 ? flat.slice(start) : flat;
  const offset = start >= 0 ? 0 : 0;
  void offset;

  const stanzas: Stanza[] = [];
  for (let i = 0; i + 5 <= usable.length; i += 5) {
    const chunk = usable.slice(i, i + 5);
    stanzas.push({
      pairs: [
        [chunk[0], chunk[1]],
        [chunk[2], chunk[3]],
      ],
      tail: chunk[4],
    });
  }

  if (stanzas.length === 0) {
    return { kind: "couplets", verses: poem.verses };
  }

  return { kind: "mukhammas", stanzas };
}

export function buildPoemPlainText(poem: Poem, layout: PoemLayout): string {
  const lines: string[] = [poem.title, ""];
  if (layout.kind === "couplets") {
    for (const v of poem.verses) {
      const sadr = v.sadr?.trim() ?? "";
      const ajuz = v.ajuz?.trim() ?? "";
      if (!sadr && !ajuz) continue;
      lines.push(ajuz ? `${sadr}  ―  ${ajuz}` : sadr);
    }
  } else {
    for (const st of layout.stanzas) {
      lines.push(`${st.pairs[0][0].text}  ―  ${st.pairs[0][1].text}`);
      lines.push(`${st.pairs[1][0].text}  ―  ${st.pairs[1][1].text}`);
      lines.push(st.tail.text);
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd();
}
