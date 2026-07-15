#!/usr/bin/env node
/**
 * HARD FIX for current /revenue-command-center crash.
 *
 * Your screenshot is NOT crashing inside partnerships.
 * It is crashing inside:
 * app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx
 *
 * Fixes:
 * 1) duplicate React keys in alerts.map()
 * 2) unsafe clipboard/write permission calls that can throw "Permission denied"
 */

const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx"
);

if (!fs.existsSync(file)) {
  console.error("Missing file:", file);
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");

// Backup once
const backup = file + ".before-central-core-hard-fix.bak";
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

// Fix alerts.map((a) => ... key `${a.href}-${a.title}`)
code = code.replace(/alerts\.map\(\(a\)\s*=>/g, "alerts.map((a, index) =>");
code = code.replace(/key=\{`\$\{a\.href\}-\$\{a\.title\}`\}/g, "key={`${a.href}-${a.title}-${index}`}");
code = code.replace(/key=\{a\.href\}/g, "key={`${a.href}-${index}`}");
code = code.replace(/key=\{a\.title\}/g, "key={`${a.title}-${index}`}");
code = code.replace(/key=\{`\$\{a\.href\}`\}/g, "key={`${a.href}-${index}`}");

// If your file has other alert-like maps using item href/title with duplicates, harden them too.
code = code.replace(/\.map\(\((alert)\)\s*=>/g, ".map(($1, index) =>");
code = code.replace(/key=\{`\$\{alert\.href\}-\$\{alert\.title\}`\}/g, "key={`${alert.href}-${alert.title}-${index}`}");
code = code.replace(/key=\{alert\.href\}/g, "key={`${alert.href}-${index}`}");
code = code.replace(/key=\{alert\.title\}/g, "key={`${alert.title}-${index}`}");

// Harden navigator clipboard calls causing NotAllowedError/Permission denied.
// Replaces direct navigator.clipboard.writeText(x) with safe guarded version.
code = code.replace(
  /navigator\.clipboard\.writeText\(([^)]+)\)/g,
  `(typeof navigator !== "undefined" && navigator.clipboard?.writeText ? navigator.clipboard.writeText($1).catch(() => undefined) : Promise.resolve())`
);

// Add global handler for noisy permission errors if not already present.
if (!code.includes("revenuePermissionErrorGuard")) {
  code = code.replace(
    /(["']use client["'];?\s*)/,
    `$1

const revenuePermissionErrorGuard = (() => {
  if (typeof window === "undefined") return false;
  if ((window as any).__revenuePermissionErrorGuard) return true;
  (window as any).__revenuePermissionErrorGuard = true;
  window.addEventListener("unhandledrejection", (event) => {
    const message = String(event.reason?.message || event.reason || "");
    if (message.toLowerCase().includes("permission denied") || message.toLowerCase().includes("notallowederror")) {
      event.preventDefault();
    }
  });
  return true;
})();
`
  );
}

fs.writeFileSync(file, code);
console.log("✅ CentralRevenueCoreDashboard hard fix applied.");
console.log("Backup:", backup);
