/**
 * Browser-level regression for the ACTUAL Vite mobile bundle (not SSR).
 * Exercises lazy book imports, Android-style hash routes, local image/PDF
 * transport and tablets. Fails on TanStack route error boundaries.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
const require = createRequire(join(process.env.RIHAB_BROWSER_TOOLS || process.cwd(), "package.json"));
const { chromium } = require("playwright-core");
const HOST = "127.0.0.1", PORT = 4181, BASE = `http://${HOST}:${PORT}`;
const out = "mobile-book-smoke-results";
mkdirSync(out, { recursive: true });
const server = spawn("bun", ["run", "mobile:preview", "--host", HOST, "--port", String(PORT), "--strictPort"], {
  env: { ...process.env, CI: "1" }, stdio: ["ignore", "pipe", "pipe"],
  detached: process.platform !== "win32",
});
server.stdout.on("data", chunk => process.stdout.write(chunk));
server.stderr.on("data", chunk => process.stderr.write(chunk));
async function waitReady() {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(BASE + "/")).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Mobile preview did not start");
}
const BOOKS = ["ward","sirah","kashf","nafahat-khaliliyya","murabbi","manaqib","manahil","nafahat"];
let browser;
let errorsFound = 0;
try {
  await waitReady();
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  for (const size of [{ width: 360, height: 800 }, { width: 1280, height: 800 }]) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on("pageerror", e => consoleErrors.push("pageerror: " + (e.stack || e.message)));
    page.on("console", m => { if(m.type() === "error") consoleErrors.push("console: " + m.text()); });
    // IMPORTANT: use real TanStack Link clicks. A direct page.goto reloads
    // the entire SPA and can hide reader chunk failures during in-app navigation.
    await page.goto(BASE + "/#/library", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator('a[href*="books/"]').first().waitFor({ timeout: 30000 });
    for (const book of BOOKS) {
      consoleErrors.length = 0;
      const link = page.locator('a[href$="/books/' + book + '"]').first();
      await link.click({ timeout: 30000 });
      await page.waitForTimeout(3800);
      const state = await page.evaluate(() => ({
        title: document.title,
        body: document.body.innerText.slice(0, 1300),
        imgs: document.querySelectorAll(".offline-book-stage img").length,
        canvas: document.querySelectorAll(".react-pdf__Page canvas").length,
        errorPage: document.body.innerText.includes("لم نتمكن من تحميل هذه الصفحة"),
        reader: !!document.querySelector(".book-reader-layout"),
        imageLoaded: [...document.querySelectorAll(".offline-book-stage img")].some(x => x.complete && x.naturalWidth > 0),
      }));
      console.log(JSON.stringify({ size, book, ...state, errors: consoleErrors.slice(0, 8) }));
      if (state.errorPage || !state.reader || consoleErrors.some(s => s.startsWith("pageerror:"))) {
        errorsFound++;
        const path = join(out, `failed-${size.width}-${book}.png`);
        await page.screenshot({ path, fullPage: false }).catch(()=>{});
        console.error(`FAIL ${book} at ${size.width}x${size.height}: route error or no reader`);
      }
      // Return through the actual navigation bar; never a hard browser reload.
      const libraryLink = page.locator('a[href$="/library"]').first();
      await libraryLink.click({ timeout: 30000 });
      await page.locator('a[href$="/books/' + book + '"]').first().waitFor({ timeout: 30000 });
    }
    await page.close();
  }
} finally {
  await browser?.close();
  if(process.platform !== "win32") { try { process.kill(-server.pid, "SIGTERM"); } catch { server.kill(); } }
  else server.kill();
}
if(errorsFound) {
  console.error(`FAIL: ${errorsFound} book reader views failed in real Chromium.`);
  process.exit(1);
}
console.log("PASS: All eight Android-mobile book routes rendered in portrait and tablet landscape.");
