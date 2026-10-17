/** License-compliant, pinned local Arabic calligraphy for the Shaykh's hero.
 * Source: google/fonts (SIL OFL 1.1), immutable commit and exact byte count.
 * Install into public/fonts so both web and fully offline Android use it.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const upstream = "https://raw.githubusercontent.com/google/fonts/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/arefruqaaink";
const targets = [resolve("public/fonts"), resolve("mobile/.public/fonts")];
const files = [
  { path: "ArefRuqaaInk-Regular.ttf", name: "aref-ruqaa-ink-regular.ttf", size: 568056 },
  { path: "OFL.txt", name: "aref-ruqaa-ink-OFL.txt" },
];
for (const file of files) {
  const response = await fetch(`${upstream}/${file.path}`, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Pinned font unavailable: ${file.path}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (file.size && (bytes.length !== file.size ||
      !["00010000", "4f54544f"].includes(bytes.subarray(0,4).toString("hex")))) {
    throw new Error(`Pinned calligraphy font changed: ${bytes.length}`);
  }
  if (!file.size && !bytes.toString("utf8").includes("SIL OPEN FONT LICENSE")) {
    throw new Error("Font redistribution license is missing");
  }
  for (const dir of targets) {
    mkdirSync(dir, { recursive: true });
    const target = resolve(dir, file.name);
    if (!existsSync(target) || !readFileSync(target).equals(bytes)) writeFileSync(target, bytes);
  }
}
console.log("Calligraphic font and OFL license prepared locally for web and offline Android.");
