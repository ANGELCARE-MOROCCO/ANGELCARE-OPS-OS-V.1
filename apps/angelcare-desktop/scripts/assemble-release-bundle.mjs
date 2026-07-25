import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const releaseRoot = path.join(root, "release");
const bundle = path.join(releaseRoot, `ANGELCARE-Desktop-${pkg.version}-Release`);
fs.rmSync(bundle, { recursive: true, force: true });
fs.mkdirSync(bundle, { recursive: true });
const wanted = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:exe|dmg|sha256|json)$/i.test(entry.name)) wanted.push(full);
  }
}
walk(path.join(releaseRoot, "windows"));
walk(path.join(releaseRoot, "macos"));
for (const file of wanted) fs.copyFileSync(file, path.join(bundle, path.basename(file)));
const artifacts = wanted.filter((f) => /\.(?:exe|dmg)$/i.test(f)).map((file) => {
  const name = path.basename(file);
  const isWin = name.endsWith(".exe");
  const arch = name.includes("arm64") ? "arm64" : "x64";
  const data = fs.readFileSync(file);
  return { filename: name, platform: isWin ? "win32" : "darwin", arch, size: data.length, sha256: crypto.createHash("sha256").update(data).digest("hex") };
});
const summary = { product: pkg.productName, version: pkg.version, generatedAt: new Date().toISOString(), artifacts };
fs.writeFileSync(path.join(bundle, "RELEASE_SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`);
const lines = [...fs.readdirSync(bundle)].filter((name) => !name.endsWith("CHECKSUMS.sha256")).sort().map((name) => {
  const data = fs.readFileSync(path.join(bundle, name));
  return `${crypto.createHash("sha256").update(data).digest("hex")}  ${name}`;
});
fs.writeFileSync(path.join(bundle, "CHECKSUMS.sha256"), `${lines.join("\n")}\n`);
console.log(`UNIFIED_RELEASE_BUNDLE_READY: ${bundle}`);
