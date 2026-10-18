import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const ref = JSON.parse(read("config/quran-hafs-independent-reference.json"));
test("approved Hafs source SHA-256 is exact and publisher-derived independently pinned", () => {
  assert.match(ref.sha256, /^[a-f0-9]{64}$/);
  assert.equal(ref.filename, "hafsData_v2-0.json");
  assert.equal(ref.bytes, 3594552);
  assert.equal(ref.gitBlobSha1, "19bb7462d41b2c0d987967457f8dd0b95e61ae59");
  assert.equal(ref.pinnedCommit, "11a5c201c0994f22bae7e2863d0aac17fcad9bc9");
});
test("actual signed release gates digest through validated separate pinned Quran bytes", () => {
  const workflow = read(".github/workflows/android-release.yml");
  const verifier = read("scripts/verify-quran-independent-reference.mjs");
  assert.match(workflow, /node scripts\/verify-quran-independent-reference\.mjs --export-github-env/);
  assert.doesNotMatch(workflow, /secrets\.QURAN_EXPECTED_SHA256/);
  assert.match(verifier, /reference\.equals\(appOriginal\)/);
  assert.match(verifier, /gitBlobSha1 !== GIT_BLOB_SHA1/);
  assert.match(verifier, /independent\.sha256 !== sha256/);
  assert.match(verifier, /appendFileSync\(output/);
});
