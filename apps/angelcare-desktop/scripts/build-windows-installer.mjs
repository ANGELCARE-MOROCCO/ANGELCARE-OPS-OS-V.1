import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arch = process.argv[2] || "x64";
if (process.platform !== "win32") { console.error("The trusted Windows installer build must run on Windows."); process.exit(1); }
if (arch !== "x64") { console.error("Mega ZIP 5 supports the contracted Windows x64 installer target."); process.exit(1); }
const forge = path.join(root, "node_modules", ".bin", "electron-forge.cmd");
if (!fs.existsSync(forge)) { console.error("Electron Forge is not installed. Run npm ci in apps/angelcare-desktop."); process.exit(1); }
const result = spawnSync(forge, ["make", "--platform=win32", "--arch=x64"], { cwd: root, stdio: "inherit", shell: true, env: process.env });
if (result.status !== 0) process.exit(result.status || 1);
console.log("ANGELCARE Desktop Windows installer build completed.");
