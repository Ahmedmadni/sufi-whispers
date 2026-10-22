"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
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
for (const [name, size, expectedSha256] of [
  ["hizb-1.mp3", 9357687, "92f50015584fe52add33cc919e4371785957e9bacb54131597294b4a61a095c1"],
  ["hizb-2.mp3", 11343344, "e973da3691fd34f60f7047028c646226d9c205245ae7c5a819f6469a40b5abaf"],
]) {
  const relative = path.join("audio", "wird", name);
  assert(fs.existsSync(file(relative)), "Missing original Wird recording: " + relative);
  const audio = fs.readFileSync(file(relative));
  assert.equal(audio.length, size, "Incorrect offline audio byte length: " + name);
  assert.equal(crypto.createHash("sha256").update(audio).digest("hex"), expectedSha256,
    "Wird audio digest mismatch: " + name);
}
console.log("PASS: complete 604-page Quran, 1040 book pages, original principal PDF, worker, Arabic fonts and both verified original audio tracks.");
