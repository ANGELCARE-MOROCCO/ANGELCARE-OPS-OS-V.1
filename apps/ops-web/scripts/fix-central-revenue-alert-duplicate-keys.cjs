#!/usr/bin/env node
/**
 * Fix duplicate React keys in:
 * app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx
 *
 * Error fixed:
 * Encountered two children with the same key:
 * /revenue-command-center/daily-tasks-premier contact
 */

const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "app/(protected)/revenue-command-center/_central-core/CentralRevenueCoreDashboard.tsx"
);

if (!fs.existsSync(target)) {
  console.error("File not found:", target);
  process.exit(1);
}

let code = fs.readFileSync(target, "utf8");

const original = `alerts.map((a) => (`;
const fixed = `alerts.map((a, index) => (`;

if (code.includes(original)) {
  code = code.replace(original, fixed);
}

const keyOriginal = 'key={`${a.href}-${a.title}`}';
const keyFixed = 'key={`${a.href}-${a.title}-${index}`}';

if (code.includes(keyOriginal)) {
  code = code.replaceAll(keyOriginal, keyFixed);
}

fs.writeFileSync(target, code);

console.log("Fixed duplicate alert keys in CentralRevenueCoreDashboard.tsx");
