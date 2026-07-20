import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);

if (process.platform !== "darwin") {
  console.error("DMG preflight can only run on macOS.");
  process.exit(1);
}

const required = [
  "@electron-forge/maker-dmg",
  "electron-installer-dmg",
  "appdmg",
];

const missing = [];
for (const packageName of required) {
  try {
    require.resolve(packageName);
  } catch {
    missing.push(packageName);
  }
}

if (missing.length > 0) {
  console.error(`Missing DMG build dependencies: ${missing.join(", ")}`);
  console.error("Run npm install in apps/angelcare-desktop and retry.");
  process.exit(1);
}

console.log("ANGELCARE Desktop macOS DMG dependency preflight passed.");
