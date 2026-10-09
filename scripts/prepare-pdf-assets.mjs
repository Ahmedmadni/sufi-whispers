/**
 * Copy the PDF.js character maps and standard fonts into local public assets.
 * They must be available when reading in an offline Android WebView.
 * This is safe to rerun before development or production builds.
 */
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageRoot = resolve(dirname(require.resolve("pdfjs-dist/build/pdf.mjs")), "..");
const destination = resolve("public/pdfjs");

for (const folder of ["cmaps", "standard_fonts"]) {
  mkdirSync(join(destination, folder), { recursive: true });
  cpSync(join(packageRoot, folder), join(destination, folder), {
    recursive: true,
    force: true,
  });
}
console.log("Prepared local PDF.js CMaps and standard fonts.");
