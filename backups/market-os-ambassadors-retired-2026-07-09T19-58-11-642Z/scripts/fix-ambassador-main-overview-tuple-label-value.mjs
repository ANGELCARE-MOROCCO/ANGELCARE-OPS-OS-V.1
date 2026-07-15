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

// Root cause:
// arrays like [["Title", Icon], ["Title", Icon]].map(([label, Icon]) => ...)
// infer label as string | IconComponent. So JSX {label} becomes invalid ReactNode.
// This pack forces every displayed tuple variable to the right primitive type.

const replacements = [
  ["{label}</div>", "{label as string}</div>"],
  ["{value}</div>", "{value as string}</div>"],
  ["{sub}</div>", "{sub as string}</div>"],
  ["{delta}</div>", "{delta as string}</div>"],
  ["{title}</h3>", "{title as string}</h3>"],
  ["{body}</p>", "{body as string}</p>"],
  ["{action}</button>", "{action as string}</button>"],
  ["{value}</span>", "{value as string}</span>"],
  ["{label}</span>", "{label as string}</span>"],
  ["{sub}</span>", "{sub as string}</span>"],
  ["{delta}</span>", "{delta as string}</span>"],
];

for (const [from, to] of replacements) {
  src = src.split(from).join(to);
}

// Handle compact/minified same-line JSX patterns that the previous script missed.
src = src.replace(/\{label\}(<\/div>)/g, "{label as string}$1");
src = src.replace(/\{value\}(<\/div>)/g, "{value as string}$1");
src = src.replace(/\{sub\}(<\/div>)/g, "{sub as string}$1");
src = src.replace(/\{delta\}(<\/div>)/g, "{delta as string}$1");
src = src.replace(/\{title\}(<\/h[1-6]>)/g, "{title as string}$1");
src = src.replace(/\{body\}(<\/p>)/g, "{body as string}$1");
src = src.replace(/\{action\}(<\/button>)/g, "{action as string}$1");

// Fix key props if TypeScript complains next.
src = src.replace(/key=\{label\}/g, "key={label as string}");
src = src.replace(/key=\{title\}/g, "key={title as string}");
src = src.replace(/key=\{value\}/g, "key={value as string}");

// Fix common icon casts if tuples infer Icon badly.
src = src.replace(/const I = Icon as typeof ([A-Za-z0-9_]+)/g, "const I = Icon as typeof $1");

// Add a reusable tuple helper type if not present, for future safety.
if (!src.includes("type TupleIcon =")) {
  const marker = src.indexOf("\n", src.lastIndexOf('from "lucide-react"'));
  if (marker !== -1) {
    src = src.slice(0, marker + 1) + "\ntype TupleIcon = React.ComponentType<{ size?: number; className?: string }>\n" + src.slice(marker + 1);
  }
}

fs.writeFileSync(file, src);
console.log("Fixed all tuple label/value ReactNode casts in:", file);
