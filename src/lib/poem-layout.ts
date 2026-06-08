import type { Poem, Verse } from "@/data/poems";

export type FlatLine = { text: string; sourceVerseId: number };

export type Stanza = {
  pairs: [[FlatLine, FlatLine], [FlatLine, FlatLine]];
  tail: FlatLine;
};

export type StreamRow =
  | { type: "pair"; a: FlatLine; b: FlatLine }
  | { type: "single"; a: FlatLine }
  | { type: "refrain"; text: FlatLine };

export type PoemLayout =
  | { kind: "couplets"; verses: Verse[] }
  | { kind: "mukhammas"; stanzas: Stanza[] }
  | { kind: "stream"; rows: StreamRow[] };

const JUNK_PATTERNS = [/^ج+$/, /height=/i, /^\s*$/];

function isJunk(s: string | undefined | null): boolean {
  if (!s) return true;
  const t = s.trim();
  if (!t) return true;
  return JUNK_PATTERNS.some((rx) => rx.test(t));
}

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** A "refrain" line: 3+ repetitions of "الله" (separated by dots/spaces). */
function isRefrain(s: string): boolean {
  const t = normalize(s);
  const matches = t.match(/الله/g);
  return !!matches && matches.length >= 3;
}

/** Flatten poem into clean sequence of lines, dropping junk. */
function flatten(poem: Poem): FlatLine[] {
  const out: FlatLine[] = [];
  for (const v of poem.verses) {
    if (!isJunk(v.sadr)) out.push({ text: normalize(v.sadr), sourceVerseId: v.id });
    if (v.ajuz != null && !isJunk(v.ajuz)) {
      out.push({ text: normalize(v.ajuz), sourceVerseId: v.id });
    }
  }
  return out;
}

function buildStream(lines: FlatLine[]): StreamRow[] {
  const rows: StreamRow[] = [];
  let buf: FlatLine[] = [];

  const flushBuf = () => {
    if (buf.length === 2) {
      rows.push({ type: "pair", a: buf[0], b: buf[1] });
    } else if (buf.length === 1) {
      rows.push({ type: "single", a: buf[0] });
    }
    buf = [];
  };

  for (const line of lines) {
    if (isRefrain(line.text)) {
      flushBuf();
      rows.push({ type: "refrain", text: line });
    } else {
      buf.push(line);
      if (buf.length === 2) {
        rows.push({ type: "pair", a: buf[0], b: buf[1] });
        buf = [];
      }
    }
  }
  flushBuf();
  return rows;
}

function buildMukhammas(poem: Poem): Stanza[] | null {
  // Column-major reconstruction: sadr column and ajuz column are separate
  // streams. The refrain only appears in the sadr column; ajuz cells that
  // sit next to a junk sadr (e.g. sadr="ج", ajuz="الممات") are merged
  // back into the previous ajuz as a wrapped continuation.
  const sadrs: FlatLine[] = [];
  const ajuzs: FlatLine[] = [];
  let refrains = 0;

  for (const v of poem.verses) {
    const sadrJunk = isJunk(v.sadr);
    const sadrIsRefrain = !sadrJunk && isRefrain(v.sadr);

    if (sadrIsRefrain) {
      refrains++;
    } else if (!sadrJunk) {
      sadrs.push({ text: normalize(v.sadr), sourceVerseId: v.id });
    }

    const ajuzRaw = v.ajuz;
    if (ajuzRaw && !isJunk(ajuzRaw) && !isRefrain(ajuzRaw)) {
      const t = normalize(ajuzRaw);
      if (sadrJunk && ajuzs.length > 0) {
        const prev = ajuzs[ajuzs.length - 1];
        ajuzs[ajuzs.length - 1] = {
          text: `${prev.text} ${t}`,
          sourceVerseId: prev.sourceVerseId,
        };
      } else {
        ajuzs.push({ text: t, sourceVerseId: v.id });
      }
    }
  }

  if (refrains === 0) return null;

  const stanzas: Stanza[] = [];
  for (let i = 0; i < refrains; i++) {
    const a1 = sadrs[i * 2];
    const a2 = ajuzs[i * 2];
    const b1 = sadrs[i * 2 + 1];
    const b2 = ajuzs[i * 2 + 1];
    if (!a1 || !a2 || !b1 || !b2) return null;
    stanzas.push({
      pairs: [[a1, a2], [b1, b2]],
      tail: {
        text: "الله .. الله .. الله .. الله .. الله",
        sourceVerseId: 0,
      },
    });
  }
  return stanzas;
}

export function groupPoemVerses(poem: Poem): PoemLayout {
  const flat = flatten(poem);
  const hasRefrain = flat.some((l) => isRefrain(l.text));

  if (hasRefrain) {
    const stanzas = buildMukhammas(poem);
    if (stanzas && stanzas.length > 0) {
      return { kind: "mukhammas", stanzas };
    }
    return { kind: "stream", rows: buildStream(flat) };
  }

  return { kind: "couplets", verses: poem.verses };
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
  } else if (layout.kind === "mukhammas") {
    for (const st of layout.stanzas) {
      lines.push(`${st.pairs[0][0].text}  ―  ${st.pairs[0][1].text}`);
      lines.push(`${st.pairs[1][0].text}  ―  ${st.pairs[1][1].text}`);
      lines.push(st.tail.text);
      lines.push("");
    }
  } else {
    for (const r of layout.rows) {
      if (r.type === "pair") lines.push(`${r.a.text}  ―  ${r.b.text}`);
      else if (r.type === "single") lines.push(r.a.text);
      else {
        lines.push(r.text.text);
        lines.push("");
      }
    }
  }
  return lines.join("\n").trimEnd();
}
