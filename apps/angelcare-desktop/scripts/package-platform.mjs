import { spawnSync } from "node:child_process";
const target = process.argv[2] || "all";
function run(script) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npm";
  const args = isWindows ? ["/d", "/s", "/c", `npm run ${script}`] : ["run", script];
  const result = spawnSync(command, args, { stdio: "inherit", shell: false, env: process.env });
  if (result.error) { console.error(`${command} failed to start: ${result.error.message}`); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
run("verify");
if (target === "mac" || target === "all") {
  if (process.platform === "darwin") { run("package:mac:x64"); run("package:mac:arm64"); }
  else if (target === "mac") { console.error("macOS DMG packaging must run on macOS"); process.exit(1); }
  else console.warn("Skipping macOS packaging on this operating system");
}
if (target === "windows" || target === "all") {
  if (process.platform === "win32") run("make:win:x64");
  else if (target === "windows") { console.error("Trusted Windows installer packaging must run on Windows"); process.exit(1); }
  else console.warn("Skipping Windows packaging on this operating system");
}
