"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(process.argv[2] || "dist-mobile");
const file = p => path.join(root, p);
assert(fs.statSync(file("index.html")).isFile(), "Missing desktop entry");
assert(fs.statSync(file("book.pdf")).size > 1000000, "Missing original Jami PDF");
assert(fs.statSync(file("pdfjs/pdf.worker.min.mjs")).size > 1000, "Missing local PDF worker");
const quran = JSON.parse(fs.readFileSync(file("printed-mushaf/manifest.json"),"utf8"));
assert.equal(quran.pageCount,604);
assert.equal(Object.keys(quran.pages).length,604);
assert.equal(quran.pixelIntegrity, "every decoded RGBA pixel equals source original PNG");
const books = JSON.parse(fs.readFileSync(file("offline-books/manifest.json"),"utf8"));
assert.equal(Object.keys(books.books).length,7);
assert.equal(Object.values(books.books).reduce((n,b)=>n+b.pageCount,0),1040);
for (const [name,entry] of Object.entries(books.books)) {
  assert.equal(entry.pages.length,entry.pageCount);
  for (const p of entry.pages) assert(fs.existsSync(file(path.join("offline-books",name,p.name))),"Missing "+name+"/"+p.name);
}
assert(fs.existsSync(file("mobile-assets/fonts/ibm-regular.ttf")));
assert(fs.existsSync(file("mobile-assets/fonts/noto-kufi-variable.ttf")));
console.log("PASS: complete 604-page Quran, 1040 book pages, original principal PDF, worker and Arabic offline fonts.");
