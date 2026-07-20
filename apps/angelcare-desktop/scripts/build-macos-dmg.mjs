import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const requestedArch = process.argv[2] || process.arch;
const allowedArchitectures = new Set(["x64", "arm64"]);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stderr || "");
      process.stdout.write(result.stdout || "");
    }
    fail(`${command} exited with status ${result.status ?? "unknown"}.`);
  }
  return result;
}

function findDirectory(start, predicate) {
  if (!fs.existsSync(start)) return null;
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (predicate(full, entry.name)) return full;
        stack.push(full);
      }
    }
  }
  return null;
}

if (process.platform !== "darwin") {
  fail("The native ANGELCARE DMG build must run on macOS.");
}
if (!allowedArchitectures.has(requestedArch)) {
  fail(`Unsupported macOS architecture: ${requestedArch}. Use x64 or arm64.`);
}
for (const binary of ["/usr/bin/hdiutil", "/usr/bin/ditto", "/bin/ln"]) {
  if (!fs.existsSync(binary)) fail(`Required macOS binary is missing: ${binary}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const productName = packageJson.productName || "ANGELCARE Desktop";
const version = packageJson.version || "0.0.0";
const forgeBinary = path.join(root, "node_modules", ".bin", "electron-forge");
if (!fs.existsSync(forgeBinary)) {
  fail("Electron Forge is not installed. Run npm install inside apps/angelcare-desktop first.");
}

console.log(`Building ANGELCARE Desktop macOS ZIP and native DMG for ${requestedArch}...`);
run(forgeBinary, ["make", "--platform=darwin", `--arch=${requestedArch}`]);

const outDir = path.join(root, "out");
const packagedApp = findDirectory(
  outDir,
  (full, name) => name === `${productName}.app` && full.includes(`darwin-${requestedArch}`),
);
if (!packagedApp) {
  fail(`Packaged application was not found under ${outDir}.`);
}

const makeDir = path.join(outDir, "make", "dmg", "darwin", requestedArch);
fs.mkdirSync(makeDir, { recursive: true });
const outputDmg = path.join(makeDir, `${productName}-${version}-darwin-${requestedArch}.dmg`);
const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "angelcare-dmg-"));

try {
  const stagedApp = path.join(stagingDir, `${productName}.app`);
  run("/usr/bin/ditto", [packagedApp, stagedApp]);
  run("/bin/ln", ["-s", "/Applications", path.join(stagingDir, "Applications")]);
  if (fs.existsSync(outputDmg)) fs.rmSync(outputDmg, { force: true });

  run("/usr/bin/hdiutil", [
    "create",
    "-volname",
    productName,
    "-srcfolder",
    stagingDir,
    "-ov",
    "-format",
    "UDZO",
    outputDmg,
  ]);
  run("/usr/bin/hdiutil", ["verify", outputDmg]);
} finally {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}

const size = fs.statSync(outputDmg).size;
console.log("");
console.log("ANGELCARE Desktop native DMG created successfully.");
console.log(outputDmg);
console.log(`Size: ${(size / 1024 / 1024).toFixed(1)} MB`);
