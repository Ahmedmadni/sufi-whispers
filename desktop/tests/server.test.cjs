"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {createDesktopServer,isWithin,CSP} = require("../server.cjs");

test("loopback server serves complete local assets with correct MIME, ranges and CSP", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),"rihab-offline-"));
  fs.writeFileSync(path.join(root,"index.html"),"<html>مكتبة</html>");
  fs.writeFileSync(path.join(root,"book.pdf"),"0123456789abcdefghij");
  fs.writeFileSync(path.join(root,"app.js"),"console.log('Rihab')");
  fs.mkdirSync(path.join(root, "audio", "wird"), {recursive:true});
  fs.writeFileSync(path.join(root, "audio", "wird", "hizb-1.mp3"), Buffer.from("ID3-EXAMPLE-RECORDED-AUDIO"));
  const {server,url} = await createDesktopServer(root);
  t.after(() => {server.close();fs.rmSync(root,{recursive:true,force:true});});
  const home = await fetch(url);
  assert.equal(home.status,200);
  assert.match(await home.text(),/مكتبة/);
  assert.match(home.headers.get("content-security-policy"),/object-src 'none'/);
  assert.match(CSP,/connect-src 'self'/);
  const range = await fetch(new URL("book.pdf",url), {headers:{range:"bytes=2-5"}});
  assert.equal(range.status,206);
  assert.equal(await range.text(),"2345");
  assert.equal(range.headers.get("content-range"),"bytes 2-5/20");
  const recordingUrl = new URL("audio/wird/hizb-1.mp3", url);
  const audioResponse = await fetch(recordingUrl);
  assert.equal(audioResponse.status, 200);
  assert.equal(audioResponse.headers.get("content-type"), "audio/mpeg");
  assert.equal(audioResponse.headers.get("accept-ranges"), "bytes");
  assert.equal(await audioResponse.text(), "ID3-EXAMPLE-RECORDED-AUDIO");
  const audioRange = await fetch(recordingUrl, {headers: {range: "bytes=4-10"}});
  assert.equal(audioRange.status, 206);
  assert.equal(audioRange.headers.get("content-type"), "audio/mpeg");
  assert.equal(audioRange.headers.get("content-range"), "bytes 4-10/26");
  assert.equal(await audioRange.text(), "EXAMPLE");
  const audioHead = await fetch(recordingUrl, {method: "HEAD"});
  assert.equal(audioHead.status, 200);
  assert.equal(audioHead.headers.get("content-type"), "audio/mpeg");
  const missing=await fetch(new URL("missing.pdf",url));
  assert.equal(missing.status,404);
  const spa=await fetch(new URL("books/ward",url),{headers:{accept:"text/html"}});
  assert.equal(spa.status,200);
  const bad=await fetch(url,{method:"POST"});
  assert.equal(bad.status,405);
  const missingRange=await fetch(new URL("book.pdf",url),{headers:{range:"bytes=900-"}});
  assert.equal(missingRange.status,416);
});

test("path and symlink escape prevention excludes ancestors",()=>{
 const root=path.resolve(os.tmpdir(),"rihab-root");
 assert.equal(isWithin(root,path.join(root,"books","page.webp")),true);
 assert.equal(isWithin(root,path.join(root,"..","password.txt")),false);
 assert.equal(isWithin(root,path.join(root+"-fake","index.html")),false);
});

test("Windows namespaced realpaths cannot falsely escape the trusted app root",()=>{
  if (process.platform !== "win32") return;
  const root = path.resolve("C:\\temp\\rihab-library");
  const target = path.toNamespacedPath(path.join(root,"index.html"));
  assert.equal(isWithin(root,target),true);
  assert.equal(isWithin(root,path.toNamespacedPath(path.resolve(root,"..","private.bin"))),false);
});
