import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { canonicalJson } = require("../src/runtime/security.cjs");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "release", "artifacts.json");
const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : path.join(root, "release", "update-manifest.generated.json");
if (!fs.existsSync(inputPath)) { console.error(`Artifact inventory not found: ${inputPath}`); process.exit(1); }
const inventory = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const platforms = {};
for (const artifact of inventory.artifacts || []) {
  const file = path.resolve(artifact.path);
  if (!fs.existsSync(file)) throw new Error(`Artifact not found: ${file}`);
  const buffer = fs.readFileSync(file);
  platforms[artifact.platform] ||= {};
  platforms[artifact.platform][artifact.arch] = { url: artifact.url, filename: path.basename(file), size: buffer.length, sha256: crypto.createHash("sha256").update(buffer).digest("hex") };
}
let manifest = { schemaVersion: 1, product: "ANGELCARE Desktop", version: packageJson.version, buildNumber: Number(process.env.ANGELCARE_DESKTOP_BUILD_NUMBER || 140), channel: process.env.ANGELCARE_DESKTOP_RELEASE_CHANNEL || "stable", releaseDate: new Date().toISOString(), minimumSupportedVersion: process.env.ANGELCARE_DESKTOP_MINIMUM_VERSION || "1.3.0", mandatory: process.env.ANGELCARE_DESKTOP_MANDATORY_UPDATE === "1", releaseNotes: process.env.ANGELCARE_DESKTOP_RELEASE_NOTES || "Production hardening, secure diagnostics, controlled updates and installer readiness.", platforms };
if (process.env.ANGELCARE_DESKTOP_UPDATE_PRIVATE_KEY_FILE) {
  const key = fs.readFileSync(process.env.ANGELCARE_DESKTOP_UPDATE_PRIVATE_KEY_FILE, "utf8");
  manifest.signature = crypto.sign(null, Buffer.from(canonicalJson(manifest)), key).toString("base64");
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Release manifest written to ${outputPath}`);
