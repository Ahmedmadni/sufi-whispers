"use strict";
// Read-only loopback static server. Never expose library assets to the LAN.
// All documents, fonts, pages and the Quran are served from verified resources.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const MIME = Object.freeze({
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json",
  ".pdf":"application/pdf", ".wasm":"application/wasm", ".webp":"image/webp",
  ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".svg":"image/svg+xml",
  ".ico":"image/x-icon", ".ttf":"font/ttf", ".woff":"font/woff", ".woff2":"font/woff2",
  ".mp4":"video/mp4", ".webm":"video/webm", ".txt":"text/plain; charset=utf-8",
});
const CSP = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
const loopback = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
function isWithin(root, target) {
  // Windows fs.realpathSync and fs.promises.realpath can differ in their
  // \\?\ drive prefix; compare both in the same canonical namespace.
  const from = process.platform === "win32" ? path.toNamespacedPath(root) : root;
  const to = process.platform === "win32" ? path.toNamespacedPath(target) : target;
  const rel = path.relative(from, to);
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel));
}

function createDesktopServer(directory) {
  const root = fs.realpathSync(directory);
  if (!fs.statSync(path.join(root, "index.html")).isFile()) {
    throw new Error("Missing bundled offline frontend: index.html");
  }
  const server = http.createServer(async (req, res) => {
    function fail(code, value) {
      res.writeHead(code, {
        "Content-Type":"text/plain; charset=utf-8",
        "X-Content-Type-Options":"nosniff",
        "Cache-Control":"no-store",
      });res.end(value);
    }
    if (!loopback.has(req.socket.remoteAddress)) { if (process.env.RIHAB_DIAGNOSTICS === "1") console.warn("Reject remote:",req.socket.remoteAddress); return fail(403,"Forbidden"); }
    if (req.method !== "GET" && req.method !== "HEAD") return fail(405, "Method Not Allowed");
    let requested;
    try {
      const host = req.headers.host || "";
      if (!/^127\.0\.0\.1:\d+$/.test(host)) return fail(403, "Forbidden");
      requested = decodeURIComponent(new URL(req.url || "/", "http://" + host).pathname);
      if (requested.includes("\0") || requested.includes("\\")) return fail(403, "Forbidden");
    } catch { return fail(400, "Bad Request"); }
    let file = path.resolve(root, "." + (requested === "/" ? "/index.html" : requested));
    if (!isWithin(root, file)) { if (process.env.RIHAB_DIAGNOSTICS === "1") console.warn("Reject path:",root,file); return fail(403, "Forbidden"); }
    let stat;
    try {
      const actual = await fs.promises.realpath(file);
      if (!isWithin(root, actual)) { if (process.env.RIHAB_DIAGNOSTICS === "1") console.warn("Reject resolved:",root,actual); return fail(403, "Forbidden"); }
      file = actual;
      stat = await fs.promises.stat(file);
      if (!stat.isFile()) return fail(404, "Not Found");
    } catch {
      // SPA navigation only. Do not turn missing JS/PDF/images into HTML.
      if (path.extname(requested) || !String(req.headers.accept || "").includes("text/html"))
        return fail(404, "Not Found");
      file = path.join(root,"index.html");
      stat = await fs.promises.stat(file);
    }
    const ext = path.extname(file).toLowerCase();
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Security-Policy": CSP,
      "X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"no-referrer",
      "Cache-Control":"private, max-age=0",
      "Accept-Ranges":"bytes",
    };
    const range = req.headers.range;
    let start = 0, end = stat.size - 1, code = 200;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        res.writeHead(416, { "Content-Range":`bytes */${stat.size}` });return res.end();
      }
      if (!match[1]) {
        const suffix = Number(match[2]);
        if (!Number.isSafeInteger(suffix) || suffix < 1) { res.writeHead(416);return res.end(); }
        start = Math.max(0, stat.size - suffix);
      } else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(stat.size - 1, Number(match[2]));
      }
      if (start > end || start >= stat.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
        res.writeHead(416, { "Content-Range":`bytes */${stat.size}` });return res.end();
      }
      code = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers["Content-Length"] = end - start + 1;
    res.writeHead(code, headers);
    if (req.method === "HEAD") return res.end();
    const stream = fs.createReadStream(file,{start,end});
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  });
  return new Promise((resolve,reject) => {
    server.once("error",reject);
    server.listen(0,"127.0.0.1", () => {
      server.off("error",reject);
      resolve({server,url:`http://127.0.0.1:${server.address().port}/`});
    });
  });
}
module.exports = { createDesktopServer, isWithin, CSP };
