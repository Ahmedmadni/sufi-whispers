/**
 * Live CDN verification for the original, approved 604 printed Mushaf pages.
 * Runs in GitHub Actions, never inside the visitor's web browser.
 */
import { createHash } from "node:crypto";

const BASE = "https://raw.githubusercontent.com/Ahmedmadni/sufi-whispers/mushaf-pages";
const EXPECTED_SOURCE = "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28";
const TOTAL_PAGES = 604;

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const abort = setTimeout(() => controller.abort(), 22000);
    try {
      const result = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (!result.ok) throw new Error(`HTTP ${result.status} from ${url}`);
      return result;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1700));
    } finally { clearTimeout(abort); }
  }
}

const manifest = await (await get(`${BASE}/manifest.json`)).json();
if (manifest.sourceSha256 !== EXPECTED_SOURCE ||
    manifest.printedPages !== TOTAL_PAGES ||
    Object.keys(manifest.pages ?? {}).length !== TOTAL_PAGES) {
  throw new Error("Mushaf CDN manifest differs from the approved PDF");
}
for (let page = 1; page <= TOTAL_PAGES; page++) {
  const name = `${String(page).padStart(3, "0")}.png`;
  const entry = manifest.pages[name];
  if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.bytes <= 0 || entry.pdfPage !== page + 3) {
    throw new Error(`Original PNG manifest missing or invalid at page ${page}`);
  }
}

for (const page of [1, 2, 50, 187, 604]) {
  const name = `${String(page).padStart(3, "0")}.png`;
  const response = await get(`${BASE}/pages/${name}`);
  const data = Buffer.from(await response.arrayBuffer());
  const sha = createHash("sha256").update(data).digest("hex");
  if (data.length !== manifest.pages[name].bytes || sha !== manifest.pages[name].sha256) {
    throw new Error(`CDN page ${page} bytes no longer match original PNG`);
  }
  console.log(`[mushaf] page ${page}: original PNG verified (${data.length} bytes)`);
}
console.log(`[mushaf] PASS: all ${TOTAL_PAGES} pages indexed; representative original images reachable and unmodified.`);
