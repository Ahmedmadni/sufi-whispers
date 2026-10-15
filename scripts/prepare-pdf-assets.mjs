/**
 * Stage the worker, CMaps and standard fonts from the exact PDF.js copy used
 * by react-pdf's <Document>/<Page> API, including on the offline Android SPA.
 */
import { cpSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { readerPdfjsAssets } from "./reader-pdfjs-paths.mjs";

const { packageRoot, workerFile, version } = readerPdfjsAssets();
const destination = resolve("public/pdfjs");
mkdirSync(destination, { recursive: true });
cpSync(workerFile, join(destination, "pdf.worker.min.mjs"));
for (const folder of ["cmaps", "standard_fonts"]) {
  mkdirSync(join(destination, folder), { recursive: true });
  cpSync(join(packageRoot, folder), join(destination, folder), {
    recursive: true,
    force: true,
  });
}
console.log(`Prepared bundled PDF.js ${version} worker, CMaps and fonts from the same React-PDF dependency.`);
