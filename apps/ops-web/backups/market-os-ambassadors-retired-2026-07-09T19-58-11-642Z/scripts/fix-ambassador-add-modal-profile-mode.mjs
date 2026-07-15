#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "components/market-os/ambassadors/ambassador-add-live-production-modal.tsx"
);

if (!fs.existsSync(file)) {
  console.error("File not found:", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

if (!src.includes("type ProfileMode =")) {
  const importEnd = src.lastIndexOf('from "lucide-react"');
  const nextLine = src.indexOf("\n", importEnd);
  src =
    src.slice(0, nextLine + 1) +
    '\ntype ProfileMode = "overview" | "edit" | "tasks" | "comments" | "history"\n' +
    src.slice(nextLine + 1);
}

src = src.replace(
  /const\s+\[profileMode,\s*setProfileMode\]\s*=\s*useState\(["']overview["']\)/g,
  'const [profileMode, setProfileMode] = useState<ProfileMode>("overview")'
);

src = src.replace(
  /onClick=\{\(\)\s*=>\s*setProfileMode\(mode\)\}/g,
  'onClick={() => setProfileMode(mode as ProfileMode)}'
);

fs.writeFileSync(file, src);
console.log("Fixed profileMode typing in:", file);
