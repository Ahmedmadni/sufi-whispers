/**
 * Android fonts must be bundled, never loaded from Google Fonts at runtime.
 * Pin upstream fonts to immutable Google Fonts commit and verify byte length
 * and TrueType/OpenType signature; keep OFL licenses in the APK assets.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const COMMIT = "bd8f81ddb5c74d5c8897b36ad88b440266245103";
const base = `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl`;
const target = resolve("mobile/.public/mobile-assets/fonts");
mkdirSync(target, { recursive: true });

const sources = [
  ["ibmplexsansarabic/IBMPlexSansArabic-Light.ttf", "ibm-light.ttf", 238564],
  ["ibmplexsansarabic/IBMPlexSansArabic-Regular.ttf", "ibm-regular.ttf", 235924],
  ["ibmplexsansarabic/IBMPlexSansArabic-Medium.ttf", "ibm-medium.ttf", 242100],
  ["ibmplexsansarabic/IBMPlexSansArabic-SemiBold.ttf", "ibm-semibold.ttf", 244616],
  ["ibmplexsansarabic/IBMPlexSansArabic-Bold.ttf", "ibm-bold.ttf", 246992],
  ["cairo/Cairo%5Bslnt%2Cwght%5D.ttf", "cairo-variable.ttf", 599548],
  ["amiri/Amiri-Regular.ttf", "amiri-regular.ttf", 431116],
  ["amiri/Amiri-Bold.ttf", "amiri-bold.ttf", 413480],
];
const faces = [];
const families = [
  ["IBM Plex Sans Arabic", "ibm-light.ttf", "300"],
  ["IBM Plex Sans Arabic", "ibm-regular.ttf", "400"],
  ["IBM Plex Sans Arabic", "ibm-medium.ttf", "500"],
  ["IBM Plex Sans Arabic", "ibm-semibold.ttf", "600"],
  ["IBM Plex Sans Arabic", "ibm-bold.ttf", "700"],
  ["Cairo", "cairo-variable.ttf", "200 1000"],
  ["Amiri", "amiri-regular.ttf", "400"],
  ["Amiri", "amiri-bold.ttf", "700"],
];

for (const [path, name, expectedBytes] of sources) {
  const response = await fetch(`${base}/${path}`, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`Unable to retrieve pinned font ${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== expectedBytes || !["00010000", "4f54544f"].includes(bytes.subarray(0,4).toString("hex"))) {
    throw new Error(`Pinned Arabic font ${name} is unexpectedly different: ${bytes.length}`);
  }
  writeFileSync(resolve(target, name), bytes);
  console.log(`Verified offline Arabic font: ${name} (${bytes.length} bytes)`);
}
for (const family of ["ibmplexsansarabic","cairo","amiri"]) {
  const response=await fetch(`${base}/${family}/OFL.txt`,{signal:AbortSignal.timeout(45000)});
  if(!response.ok) throw new Error(`Missing license for ${family}`);
  const text=await response.text();
  if(!text.includes("SIL OPEN FONT LICENSE")) throw new Error(`Wrong font license: ${family}`);
  writeFileSync(resolve(target, `${family}-OFL.txt`),text);
}
for (const [family, file, weight] of families) {
  faces.push(`@font-face{font-family:"${family}";src:url("/mobile-assets/fonts/${file}") format("truetype");font-weight:${weight};font-style:normal;font-display:swap;}`);
}
writeFileSync(resolve(target,"fonts.css"), faces.join("\n")+"\n");
console.log("Offline IBM, Cairo and Amiri typography prepared for Android.");
