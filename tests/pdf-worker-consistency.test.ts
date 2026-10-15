import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { readerPdfjsAssets } from "../scripts/reader-pdfjs-paths.mjs";

describe("Book reader PDF.js API/worker integrity", () => {
  test("resolves the PDF worker from react-pdf's own dependency", () => {
    const { workerFile, version } = readerPdfjsAssets();
    expect(existsSync(workerFile)).toBe(true);
    const lock = readFileSync(new URL("../bun.lock", import.meta.url), "utf8");
    expect(lock).toContain(`"react-pdf/pdfjs-dist": ["pdfjs-dist@${version}"`);
  });
  test("reader never imports a different root PDF.js worker", () => {
    const source = readFileSync(new URL("../src/components/PdfBookViewer.tsx", import.meta.url), "utf8");
    expect(source).toContain('workerSrc = "/pdfjs/pdf.worker.min.mjs"');
    expect(source).not.toContain('from "pdfjs-dist/build/pdf.worker');
  });
});
