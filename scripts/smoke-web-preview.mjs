/**
 * Lovable/TanStack SSR smoke test.
 * A successful TypeScript/build cannot detect an SSR crash in the preview.
 * Start the same Vite dev script used by Lovable, request actual routes,
 * print startup/response diagnostics, and exit with a failure on a 5xx.
 * This does not fetch or modify Quran data or PDF binary files.
 */
import { spawn } from "node:child_process";

const HOST = "127.0.0.1";
const PORT = 4177;
const BASE = `http://${HOST}:${PORT}`;
const DEADLINE_MS = 115_000;
const ROUTES = ["/", "/quran", "/quran/printed?page=1", "/library", "/dhikr"];
const output = [];
const record = (chunk) => {
  const line = String(chunk);
  process.stdout.write(line);
  output.push(line);
  if (output.length > 100) output.shift();
};

const child = spawn("bun", ["run", "dev", "--host", HOST, "--port", String(PORT), "--strictPort"], {
  stdio: ["ignore", "pipe", "pipe"],
  detached: process.platform !== "win32",
  env: { ...process.env, CI: "1", BROWSER: "none" },
});
child.stdout.on("data", record);
child.stderr.on("data", record);
let exited = false;
child.on("exit", (code, signal) => {
  exited = true;
  record(`\n[smoke] Dev server exited (code=${code}, signal=${signal})\n`);
});

async function probe(url) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 13_000);
  try {
    return await fetch(url, { signal: ctrl.signal, redirect: "follow", cache: "no-store" });
  } finally { clearTimeout(timeout); }
}

async function waitForServer() {
  const until = Date.now() + DEADLINE_MS;
  while (Date.now() < until && !exited) {
    try {
      const response = await probe(BASE + "/");
      if (response.status >= 500) {
        const body = (await response.text()).slice(0, 1800);
        throw new Error(`Homepage SSR returned ${response.status}: ${body}`);
      }
      if (response.ok) return;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Homepage SSR returned")) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  throw new Error(`Preview server didn't start within ${DEADLINE_MS / 1000} seconds. Recent output:\n${output.join("").slice(-4500)}`);
}

async function main() {
  try {
    await waitForServer();
    for (const route of ROUTES) {
      const response = await probe(BASE + route);
      const html = await response.text();
      const hasShell = html.includes("<html") || html.includes("<!DOCTYPE");
      const failureText = html.slice(0, 2200);
      record(`\n[smoke] ${route}: HTTP ${response.status}, HTML shell=${hasShell}, bytes=${html.length}\n`);
      if (!response.ok || !hasShell || html.includes('{"unhandled":true,"message":"HTTPError"')) {
        throw new Error(`SSR preview failed ${route}: HTTP ${response.status}; body ${failureText}\nRecent logs:\n${output.join("").slice(-5500)}`);
      }
    }
    record("\n[smoke] PASS: all Lovable-style SSR routes returned HTML successfully.\n");
  } finally {
    // The dev server may be spawned via a shell; kill its full process group.
    if (!exited) {
      try {
        if (process.platform !== "win32") process.kill(-child.pid, "SIGTERM");
        else child.kill("SIGTERM");
      } catch { child.kill("SIGTERM"); }
    }
  }
}

main().catch((err) => {
  process.stderr.write(`\n[smoke] FAIL: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
