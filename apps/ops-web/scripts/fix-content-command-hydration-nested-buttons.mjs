#!/usr/bin/env node
/**
 * Content Command Center hydration fix
 *
 * Fixes invalid HTML caused by clickable card <button> wrappers containing
 * inner <button> actions. Next.js hydration breaks with:
 *   In HTML, <button> cannot be a descendant of <button>.
 *
 * This script targets:
 *   components/market-os/content-command-center.tsx
 *
 * It converts only OUTER card buttons that contain nested buttons into:
 *   <div role="button" tabIndex={0} ...>
 * while keeping inner action buttons untouched.
 */

import fs from "node:fs";
import path from "node:path";

const target = path.join(
  process.cwd(),
  "components",
  "market-os",
  "content-command-center.tsx"
);

if (!fs.existsSync(target)) {
  console.error(`❌ File not found: ${target}`);
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

function findOpeningTagEnd(text, start) {
  let quote = null;
  let brace = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    const prev = text[i - 1];

    if (quote) {
      if (ch === quote && prev !== "\\") quote = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{") brace++;
    if (ch === "}") brace = Math.max(0, brace - 1);

    if (ch === ">" && brace === 0) return i;
  }
  return -1;
}

function findMatchingButtonClose(text, openStart) {
  let pos = openStart;
  let depth = 0;

  while (pos < text.length) {
    const nextOpen = text.indexOf("<button", pos);
    const nextClose = text.indexOf("</button>", pos);

    if (nextClose === -1) return -1;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + "<button".length;
      continue;
    }

    depth--;
    pos = nextClose + "</button>".length;

    if (depth === 0) return nextClose;
  }

  return -1;
}

function hasNestedButton(text, openStart, closeStart) {
  const openEnd = findOpeningTagEnd(text, openStart);
  if (openEnd === -1) return false;
  return text.slice(openEnd + 1, closeStart).includes("<button");
}

function shouldConvertOpening(openTag) {
  const normalized = openTag.replace(/\s+/g, " ");

  // Focus on large clickable cards/workspace cards. This includes the
  // TemplatesManagementWorkspace error card shown around line 1824.
  const looksLikeCard =
    normalized.includes("group") ||
    normalized.includes("rounded-[30px]") ||
    normalized.includes("rounded-3xl") ||
    normalized.includes("rounded-[32px]") ||
    normalized.includes("overflow-hidden");

  const hasInnerActionsLikely =
    normalized.includes("onClick") &&
    normalized.includes("className");

  return looksLikeCard && hasInnerActionsLikely;
}

function convertOpeningButtonToDiv(openTag) {
  let converted = openTag;

  converted = converted.replace(/^<button\b/, "<div");
  converted = converted.replace(/\s+type=(?:"button"|'button'|\{["']button["']\})/g, "");

  if (!/\brole=/.test(converted)) {
    converted = converted.replace("<div", '<div role="button"');
  }

  if (!/\btabIndex=/.test(converted)) {
    converted = converted.replace("<div", "<div tabIndex={0}");
  }

  if (!/\bcursor-pointer\b/.test(converted)) {
    converted = converted.replace(/className=(["'`])([^"'`]*)\1/, (m, q, cls) => {
      return `className=${q}${cls} cursor-pointer${q}`;
    });
  }

  return converted;
}

const candidates = [];
let pos = 0;

while (true) {
  const openStart = source.indexOf("<button", pos);
  if (openStart === -1) break;

  const openEnd = findOpeningTagEnd(source, openStart);
  if (openEnd === -1) break;

  const openTag = source.slice(openStart, openEnd + 1);
  const closeStart = findMatchingButtonClose(source, openStart);

  if (closeStart === -1) {
    pos = openEnd + 1;
    continue;
  }

  if (hasNestedButton(source, openStart, closeStart) && shouldConvertOpening(openTag)) {
    candidates.push({ openStart, openEnd, closeStart, openTag });
  }

  pos = openEnd + 1;
}

if (candidates.length === 0) {
  console.log("✅ No matching nested card buttons found. Nothing changed.");
  process.exit(0);
}

let output = source;
for (const item of candidates.reverse()) {
  const convertedOpen = convertOpeningButtonToDiv(item.openTag);
  output =
    output.slice(0, item.closeStart) +
    "</div>" +
    output.slice(item.closeStart + "</button>".length);

  output =
    output.slice(0, item.openStart) +
    convertedOpen +
    output.slice(item.openEnd + 1);
}

const backup = `${target}.hydration-backup-${Date.now()}`;
fs.writeFileSync(backup, source, "utf8");
fs.writeFileSync(target, output, "utf8");

console.log(`✅ Fixed ${candidates.length} nested clickable card button wrapper(s).`);
console.log(`🛡️ Backup created: ${backup}`);
console.log("Next:");
console.log("  npm run build");
console.log("  npm run dev");
