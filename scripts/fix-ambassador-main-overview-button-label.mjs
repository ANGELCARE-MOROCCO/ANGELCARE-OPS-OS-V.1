#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components/market-os/ambassadors/ambassador-main-overview-page.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// Fix tuple label rendering inside buttons:
// Example failing pattern:
// <I className="text-violet-600" size={20}/>{label}</button>
// TypeScript inferred label as string | IconComponent.
src = src.replace(/\{label\}(<\/button>)/g, "{label as string}$1");
src = src.replace(/\{value\}(<\/button>)/g, "{value as string}$1");
src = src.replace(/\{title\}(<\/button>)/g, "{title as string}$1");
src = src.replace(/\{action\}(<\/button>)/g, "{action as string}$1");

// Fix JSX text in any direct element close patterns.
src = src.replace(/\{label\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{label as string}$1");
src = src.replace(/\{value\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{value as string}$1");
src = src.replace(/\{sub\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{sub as string}$1");
src = src.replace(/\{delta\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{delta as string}$1");
src = src.replace(/\{body\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{body as string}$1");

// Fix key props from tuple values.
src = src.replace(/key=\{label\}/g, "key={label as string}");
src = src.replace(/key=\{value\}/g, "key={value as string}");
src = src.replace(/key=\{title\}/g, "key={title as string}");

// Fix inline onClick keys if tuple key inferred badly but used as string.
src = src.replace(/openModal\(key\)/g, "openModal(key as string)");
src = src.replace(/setModal\(key\)/g, "setModal(key as string)");

fs.writeFileSync(file, src);
console.log("Fixed button label tuple ReactNode type in:", file);
