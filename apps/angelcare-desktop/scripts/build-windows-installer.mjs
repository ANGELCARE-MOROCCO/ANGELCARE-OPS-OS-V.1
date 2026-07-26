import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const arch = process.argv[2] || "x64";
const expectedVersion = "1.7.3";
const exactName = `ANGELCARE-Desktop-${pkg.version}-Windows-x64-Setup.exe`;

function fail(message) {
  console.error(`WINDOWS_INSTALLER_BUILD_FAILED: ${message}`);
  process.exit(1);
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    stdio: "inherit",
    shell: options.shell ?? false,
    env: process.env,
  });
  if (result.error) fail(`${command} failed to start: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} exited with status ${result.status ?? "unknown"}`);
}
function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else output.push(file);
  }
  return output;
}

if (pkg.version !== expectedVersion) fail(`package.json must be ${expectedVersion}, found ${pkg.version}`);
if (lock.version !== pkg.version || lock.packages?.[""]?.version !== pkg.version) fail("package-lock.json release identity is not synchronized");
if (process.platform !== "win32") fail("The trusted Windows installer build must run on Windows");
if (arch !== "x64") fail("ANGELCARE Desktop 1.7.3 supports the contracted Windows x64 installer target");

run(process.execPath, [path.join(root, "scripts", "verify-unified-release-1.7.3.mjs")]);

const forge = path.join(root, "node_modules", ".bin", "electron-forge.cmd");
if (!fs.existsSync(forge)) fail("Electron Forge is not installed. Run npm ci inside apps/angelcare-desktop");
run(forge, ["make", "--platform=win32", "--arch=x64"], { shell: true });

const candidates = walk(path.join(root, "out", "make")).filter((file) => /setup.*\.exe$/i.test(path.basename(file)) || path.basename(file) === exactName);
if (!candidates.length) fail("Electron Forge completed but no Windows Setup executable was found");
candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

const outputDir = path.join(root, "release", "windows");
fs.mkdirSync(outputDir, { recursive: true });
const output = path.join(outputDir, exactName);
fs.copyFileSync(candidates[0], output);
const digest = crypto.createHash("sha256").update(fs.readFileSync(output)).digest("hex");
fs.writeFileSync(`${output}.sha256`, `${digest}  ${exactName}\n`);
const metadata = {
  product: pkg.productName,
  version: pkg.version,
  platform: "win32",
  arch: "x64",
  filename: exactName,
  size: fs.statSync(output).size,
  sha256: digest,
  signed: Boolean(process.env.WINDOWS_CERTIFICATE_FILE && process.env.WINDOWS_CERTIFICATE_PASSWORD),
  builtAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(outputDir, `${exactName}.json`), `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`WINDOWS_INSTALLER_1_7_3_READY: ${output}`);
console.log(`SHA256: ${digest}`);
