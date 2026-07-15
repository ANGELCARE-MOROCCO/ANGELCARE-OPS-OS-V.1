#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components/market-os/ambassadors/ambassador-performance-command-center.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// Fix profileMode tuple inference in performance command center.
// Error: setProfileMode(mode) where mode is inferred as string | LucideIcon.

if (!src.includes("type ProfileMode =")) {
  const lucideImport = src.lastIndexOf('from "lucide-react"');
  const insertAt = lucideImport !== -1 ? src.indexOf("\n", lucideImport) + 1 : 0;
  src =
    src.slice(0, insertAt) +
    '\ntype ProfileMode = "overview" | "edit" | "tasks" | "comments" | "history"\n' +
    src.slice(insertAt);
}

src = src.replace(
  /const\s+\[profileMode,\s*setProfileMode\]\s*=\s*useState\(["']overview["']\)/g,
  'const [profileMode, setProfileMode] = useState<ProfileMode>("overview")'
);

src = src.replace(
  /onClick=\{\(\)\s*=>\s*setProfileMode\(mode\)\}/g,
  'onClick={() => setProfileMode(mode as ProfileMode)}'
);

// Also protect labels rendered from tuple arrays in the same file.
src = src.replace(/\{label\}(<\/button>)/g, "{label as string}$1");
src = src.replace(/\{label\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6)>)/g, "{label as string}$1");
src = src.replace(/\{value\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{value as string}$1");
src = src.replace(/\{title\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{title as string}$1");
src = src.replace(/\{body\}(<\/(?:div|span|p|h1|h2|h3|h4|h5|h6|button)>)/g, "{body as string}$1");
src = src.replace(/key=\{label\}/g, "key={label as string}");
src = src.replace(/key=\{title\}/g, "key={title as string}");

fs.writeFileSync(file, src);
console.log("Fixed performance profileMode typing in:", file);
