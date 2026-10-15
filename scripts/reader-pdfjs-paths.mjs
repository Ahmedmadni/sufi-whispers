/**
 * React-PDF pins its own PDF.js API version; the standalone pdfjs-dist package
 * can be newer. Always resolve assets relative to React-PDF, never to the
 * top-level pdfjs-dist dependency. Otherwise API/Worker versions diverge.
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const requireFromReactPdf = createRequire(require.resolve("react-pdf"));
export function readerPdfjsAssets() {
  const pdfModule = requireFromReactPdf.resolve("pdfjs-dist/build/pdf.mjs");
  const packageRoot = resolve(dirname(pdfModule), "..");
  const workerFile = resolve(packageRoot, "build/pdf.worker.min.mjs");
  const version = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8")).version;
  if (!/^5\.\d+\.\d+$/.test(version)) throw new Error("Unexpected React-PDF PDF.js version");
  return { packageRoot, workerFile, version };
}
