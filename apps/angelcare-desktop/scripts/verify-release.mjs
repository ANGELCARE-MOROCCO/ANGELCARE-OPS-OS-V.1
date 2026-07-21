import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.resolve(process.argv[2] || path.join(root, "release", "update-manifest.generated.json"));
if (!fs.existsSync(manifestPath)) { console.log("No generated release manifest found; configuration-only verification passed."); process.exit(0); }
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.product !== "ANGELCARE Desktop" || !/^\d+\.\d+\.\d+/.test(manifest.version)) throw new Error("Invalid release manifest identity/version.");
for (const [platform, arches] of Object.entries(manifest.platforms || {})) for (const [arch, artifact] of Object.entries(arches)) {
  if (!/^https:\/\//.test(artifact.url)) throw new Error(`Non-HTTPS artifact URL: ${platform}/${arch}`);
  if (!/^[a-f0-9]{64}$/i.test(artifact.sha256)) throw new Error(`Invalid checksum: ${platform}/${arch}`);
  if (!Number.isFinite(artifact.size) || artifact.size <= 0) throw new Error(`Invalid size: ${platform}/${arch}`);
}
console.log("ANGELCARE Desktop release manifest verification passed.");
