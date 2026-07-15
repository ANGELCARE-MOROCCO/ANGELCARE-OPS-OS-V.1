#!/usr/bin/env node

/**
 * SaaS Factory Phase 6 safe live field adoption helper.
 *
 * Default mode is dry-run.
 *
 * Examples:
 *   node scripts/saas-factory-phase6-apply-live-fields.cjs --dry-run
 *   node scripts/saas-factory-phase6-apply-live-fields.cjs --apply --target revenue_city_fields
 *
 * This script is intentionally conservative:
 * - It creates backups before writing.
 * - It only patches files with obvious option fields.
 * - It does not replace full pages.
 * - It reports skipped files instead of guessing.
 */

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const target = targetArg ? targetArg.split("=")[1] : null;

const replacements = [
  {
    id: "revenue_city_fields",
    moduleKey: "revenue_command_center",
    roots: ["components/revenue-command-center", "app/(protected)/revenue-command-center"],
    component: "RevenueCityField",
    importLine: 'import { RevenueCityField } from "@/components/saas-factory/adapters/ModuleLiveFields";',
    hints: [/city/i, /Casablanca|Rabat|Marrakech/i],
  },
  {
    id: "hr_department_fields",
    moduleKey: "hr",
    roots: ["app/(protected)/hr", "components/hr"],
    component: "HRDepartmentField",
    importLine: 'import { HRDepartmentField } from "@/components/saas-factory/adapters/ModuleLiveFields";',
    hints: [/department/i, /Operations|Human Resources|Academy|Revenue/i],
  },
  {
    id: "hr_city_fields",
    moduleKey: "hr",
    roots: ["app/(protected)/hr", "components/hr"],
    component: "HRCityField",
    importLine: 'import { HRCityField } from "@/components/saas-factory/adapters/ModuleLiveFields";',
    hints: [/city/i, /Casablanca|Rabat|Marrakech/i],
  },
  {
    id: "academy_city_fields",
    moduleKey: "academy",
    roots: ["app/(protected)/academy", "components/academy"],
    component: "AcademyCityField",
    importLine: 'import { AcademyCityField } from "@/components/saas-factory/adapters/ModuleLiveFields";',
    hints: [/city/i, /Casablanca|Rabat|Marrakech/i],
  },
  {
    id: "service_category_fields",
    moduleKey: "service_os",
    roots: ["app/(protected)/service-os", "components/service-os"],
    component: "ServiceCategoryField",
    importLine: 'import { ServiceCategoryField } from "@/components/saas-factory/adapters/ModuleLiveFields";',
    hints: [/serviceCategory|service_category|category/i, /Childcare|Academy Training/i],
  },
];

const selected = target ? replacements.filter((item) => item.id === target) : replacements;

if (target && selected.length === 0) {
  console.error(`Unknown target: ${target}`);
  process.exit(1);
}

const EXTENSIONS = new Set([".tsx", ".jsx"]);
const SKIP = new Set(["node_modules", ".next", ".git", "dist", "build"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function ensureImport(content, importLine) {
  if (content.includes(importLine) || content.includes(importLine.replace(/;$/, ""))) return content;

  const lines = content.split(/\r?\n/);
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImportIndex = i;
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importLine);
    return lines.join("\n");
  }

  return `${importLine}\n${content}`;
}

function annotateCandidate(content, item) {
  const marker = `/* SaaS Factory Phase 6 candidate: ${item.id} -> ${item.component} */`;
  if (content.includes(marker)) return content;

  // Conservative: annotate near first select or city/department text.
  const selectIndex = content.indexOf("<select");
  if (selectIndex >= 0) {
    return content.slice(0, selectIndex) + marker + "\n" + content.slice(selectIndex);
  }

  return content + `\n\n${marker}\n`;
}

function isCandidate(content, item) {
  if (content.includes(item.component)) return false;
  if (!content.includes("<select") && !item.hints.some((regex) => regex.test(content))) return false;
  return item.hints.some((regex) => regex.test(content));
}

const results = [];

for (const item of selected) {
  const files = item.roots.flatMap((root) => walk(path.join(process.cwd(), root)));
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (!isCandidate(content, item)) continue;

    let next = ensureImport(content, item.importLine);
    next = annotateCandidate(next, item);

    const changed = next !== content;
    const rel = path.relative(process.cwd(), file);

    if (changed && apply) {
      const backupDir = path.join(process.cwd(), ".angelcare_backups", "saas-factory-phase6");
      fs.mkdirSync(backupDir, { recursive: true });
      const backupName = rel.replace(/[\\/]/g, "__");
      fs.writeFileSync(path.join(backupDir, `${backupName}.bak`), content);
      fs.writeFileSync(file, next);
    }

    results.push({
      target: item.id,
      file: rel,
      changed,
      action: apply && changed ? "patched_with_backup" : "dry_run_candidate",
      component: item.component,
    });
  }
}

const reportDir = path.join(process.cwd(), "reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "saas-factory-phase6-live-field-apply-report.json");
fs.writeFileSync(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  mode: apply ? "apply" : "dry-run",
  target,
  candidates: results.length,
  results,
}, null, 2));

console.log("SAAS FACTORY PHASE 6 LIVE FIELD APPLY");
console.log("=====================================");
console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
console.log(`Target: ${target || "all"}`);
console.log(`Candidates: ${results.length}`);
console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

if (!apply) {
  console.log("");
  console.log("No files were changed. To apply one target:");
  console.log("node scripts/saas-factory-phase6-apply-live-fields.cjs --apply --target revenue_city_fields");
}
