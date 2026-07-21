import { spawnSync } from "node:child_process";
const target = process.argv[2] || "all";
function run(script) { const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", script], { stdio: "inherit", shell: false }); if (result.status !== 0) process.exit(result.status || 1); }
run("verify");
if (target === "mac" || target === "all") {
  if (process.platform === "darwin") { run("package:mac:x64"); run("package:mac:arm64"); }
  else if (target === "mac") { console.error("macOS DMG packaging must run on macOS."); process.exit(1); }
  else console.warn("Skipping macOS packaging on this operating system.");
}
if (target === "windows" || target === "all") {
  if (process.platform === "win32") run("make:win:x64");
  else if (target === "windows") { console.error("Trusted Windows installer packaging must run on Windows."); process.exit(1); }
  else console.warn("Skipping Windows packaging on this operating system.");
}
run("release:checksums");
