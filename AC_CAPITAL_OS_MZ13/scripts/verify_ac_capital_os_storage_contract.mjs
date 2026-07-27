import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function exists(p) {
  return fs.existsSync(p);
}

function findRoots(start) {
  const opsFromRepo = path.join(start, "apps", "ops-web");
  if (exists(opsFromRepo)) return { mode: "repository-root", repoRoot: start, opsRoot: opsFromRepo };
  if (exists(path.join(start, "app")) && exists(path.join(start, "package.json"))) {
    return { mode: "ops-web-root", repoRoot: path.resolve(start, "..", ".."), opsRoot: start };
  }
  throw new Error("Run from repo root or apps/ops-web");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { mode, repoRoot, opsRoot } = findRoots(cwd);

const storageFile = path.join(opsRoot, "lib", "ac-capital-os", "server", "storage.ts");
const flagsFile = path.join(opsRoot, "lib", "ac-capital-os", "server", "feature-flags.ts");
const uploadRoute = path.join(opsRoot, "app", "api", "ac-capital-os", "data-room", "upload", "route.ts");
const documentsRoute = path.join(opsRoot, "app", "api", "ac-capital-os", "data-room", "documents", "route.ts");

assert(exists(storageFile), "storage.ts missing");
assert(exists(flagsFile), "feature-flags.ts missing");
assert(exists(uploadRoute), "data-room upload route missing");
assert(exists(documentsRoute), "data-room documents route missing");

const storageContent = fs.readFileSync(storageFile, "utf8");
const flagsContent = fs.readFileSync(flagsFile, "utf8");
const combined = storageContent + "\n" + flagsContent;

for (const token of [
  "ac-capital-data-room",
  "AC_CAPITAL_DATA_ROOM_BUCKET",
  "FILE_TYPE_BLOCKED",
  "FILE_TOO_LARGE",
  "storage_not_configured",
  "supabaseStorageUpload",
  "uploadDataRoomFile",
  "founderApprovalRequired",
]) {
  assert(combined.includes(token), `storage contract missing token: ${token}`);
}

assert(storageContent.includes("flags.storageBucket"), "storage.ts must consume the governed bucket from feature flags.");
assert(!storageContent.includes("publicUrl"), "storage.ts should not use public URL by default.");
assert(!storageContent.includes("createSignedUrl"), "signed URL generation must remain explicit future scope.");

console.log("AC_CAPITAL_OS_STORAGE_CONTRACT_VERIFIED");
console.log(`Detected mode: ${mode}`);
console.log("Storage contract verified across storage.ts + feature-flags.ts.");
console.log("Private bucket expectation: ac-capital-data-room");
