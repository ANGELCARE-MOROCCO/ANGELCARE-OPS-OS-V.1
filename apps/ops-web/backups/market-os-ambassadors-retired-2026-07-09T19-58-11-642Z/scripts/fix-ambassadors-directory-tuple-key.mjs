#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components",
  "market-os",
  "ambassadors",
  "ambassadors-directory-exact.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// Root cause:
// Tuple arrays like [["Add", Plus], ["Export", Download]].map(([label, Icon]) => ...)
// are inferred as (string | LucideIcon)[], so label becomes string | Icon.
// TypeScript rejects key={label} and JSX {label}.

// Fix keys.
src = src.replace(/key=\{label\}/g, "key={label as string}");
src = src.replace(/key=\{title\}/g, "key={title as string}");
src = src.replace(/key=\{value\}/g, "key={value as string}");
src = src.replace(/key=\{action\}/g, "key={action as string}");

// Fix rendered tuple text.
src = src.replace(/\{label\}(<\/(?:button|div|span|p|h1|h2|h3|h4|h5|h6)>)/g, "{label as string}$1");
src = src.replace(/\{title\}(<\/(?:button|div|span|p|h1|h2|h3|h4|h5|h6)>)/g, "{title as string}$1");
src = src.replace(/\{value\}(<\/(?:button|div|span|p|h1|h2|h3|h4|h5|h6)>)/g, "{value as string}$1");
src = src.replace(/\{action\}(<\/(?:button|div|span|p|h1|h2|h3|h4|h5|h6)>)/g, "{action as string}$1");
src = src.replace(/\{sub\}(<\/(?:button|div|span|p|h1|h2|h3|h4|h5|h6)>)/g, "{sub as string}$1");
src = src.replace(/\{body\}(<\/(?:button|div|span|p|h1|h2|h3|h4|h5|h6)>)/g, "{body as string}$1");

// Fix compact forms where text appears before another tag.
src = src.replace(/\{label\}(<)/g, "{label as string}$1");
src = src.replace(/\{title\}(<)/g, "{title as string}$1");
src = src.replace(/\{value\}(<)/g, "{value as string}$1");

// Fix common modal route/state keys if inferred as tuple union.
src = src.replace(/setActiveModal\(key\)/g, "setActiveModal(key as any)");
src = src.replace(/setModal\(key\)/g, "setModal(key as any)");
src = src.replace(/openModal\(key\)/g, "openModal(key as any)");

fs.writeFileSync(file, src);
console.log("Fixed tuple key/label TypeScript errors in:", file);
