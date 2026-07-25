import crypto from "node:crypto";
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
  console.error(`MACOS_INSTALLER_BUILD_FAILED: ${message}`);
  process.exit(1);
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: process.env,
  });
  if (result.error) fail(`${command} failed to start: ${result.error.message}`);
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stderr || "");
      process.stdout.write(result.stdout || "");
    }
    fail(`${command} exited with status ${result.status ?? "unknown"}`);
  }
  return result;
}
function findDirectory(start, predicate) {
  if (!fs.existsSync(start)) return null;
  const stack = [start];
  while (stack.length) {
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

if (process.platform !== "darwin") fail("The native ANGELCARE DMG build must run on macOS");
if (!allowedArchitectures.has(requestedArch)) fail(`Unsupported macOS architecture: ${requestedArch}. Use x64 or arm64`);
for (const binary of ["/usr/bin/hdiutil", "/usr/bin/ditto", "/bin/ln"]) if (!fs.existsSync(binary)) fail(`Required macOS binary is missing: ${binary}`);

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
if (pkg.version !== "1.7.2") fail(`package.json must be 1.7.2, found ${pkg.version}`);
if (lock.version !== pkg.version || lock.packages?.[""]?.version !== pkg.version) fail("package-lock.json release identity is not synchronized");
const productName = pkg.productName || "ANGELCARE Desktop";
const exactName = `ANGELCARE-Desktop-${pkg.version}-macOS-${requestedArch}.dmg`;

run(process.execPath, [path.join(root, "scripts", "verify-unified-release-1.7.2.mjs")]);
const forgeBinary = path.join(root, "node_modules", ".bin", "electron-forge");
if (!fs.existsSync(forgeBinary)) fail("Electron Forge is not installed. Run npm ci inside apps/angelcare-desktop");
run(forgeBinary, ["package", "--platform=darwin", `--arch=${requestedArch}`]);

const outDir = path.join(root, "out");
const packagedApp = findDirectory(outDir, (full, name) => name === `${productName}.app` && full.includes(`darwin-${requestedArch}`));
if (!packagedApp) fail(`Packaged application was not found under ${outDir}`);

const outputDir = path.join(root, "release", "macos", requestedArch);
fs.mkdirSync(outputDir, { recursive: true });
const outputDmg = path.join(outputDir, exactName);
const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "angelcare-dmg-"));
try {
  const stagedApp = path.join(stagingDir, `${productName}.app`);
  run("/usr/bin/ditto", [packagedApp, stagedApp]);
  run("/bin/ln", ["-s", "/Applications", path.join(stagingDir, "Applications")]);
  if (fs.existsSync(outputDmg)) fs.rmSync(outputDmg, { force: true });
  run("/usr/bin/hdiutil", ["create", "-volname", productName, "-srcfolder", stagingDir, "-ov", "-format", "UDZO", outputDmg]);
  run("/usr/bin/hdiutil", ["verify", outputDmg]);
} finally {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}

const digest = crypto.createHash("sha256").update(fs.readFileSync(outputDmg)).digest("hex");
fs.writeFileSync(`${outputDmg}.sha256`, `${digest}  ${exactName}\n`);
const metadata = {
  product: pkg.productName,
  version: pkg.version,
  platform: "darwin",
  arch: requestedArch,
  filename: exactName,
  size: fs.statSync(outputDmg).size,
  sha256: digest,
  signed: Boolean(process.env.APPLE_SIGNING_IDENTITY),
  notarized: Boolean(process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID),
  builtAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(outputDir, `${exactName}.json`), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`MACOS_INSTALLER_1_7_2_READY: ${outputDmg}`);
console.log(`SHA256: ${digest}`);
