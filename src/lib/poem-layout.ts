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

export function groupPoemVerses(poem: Poem): PoemLayout {
  const flat = flatten(poem);
  const hasRefrain = flat.some((l) => isRefrain(l.text));

  if (hasRefrain) {
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
