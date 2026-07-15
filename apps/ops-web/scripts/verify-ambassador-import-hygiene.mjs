import fs from "node:fs";

const files = [
  "components/market-os/ambassadors/ambassador-production-workspace.tsx",
  "components/market-os/ambassadors/ambassador-market-sidebar.tsx",
  "components/market-os/ambassadors/routes/AmbassadorCockpitRoute.tsx",
];

const reactSymbols = new Set([
  "useCallback",
  "useEffect",
  "useMemo",
  "useRef",
  "useState",
  "ReactNode",
  "ComponentType",
  "FormEvent",
  "InputHTMLAttributes",
  "SelectHTMLAttributes",
  "TextareaHTMLAttributes",
]);

const iconSymbols = new Set([
  "AlertTriangle",
  "Archive",
  "BadgeCheck",
  "BarChart3",
  "Bell",
  "Building2",
  "Calendar",
  "CheckCircle2",
  "ChevronDown",
  "ClipboardCheck",
  "ClipboardList",
  "Clock",
  "Download",
  "Eye",
  "FileText",
  "Filter",
  "Flag",
  "Gift",
  "GraduationCap",
  "Layers",
  "LayoutDashboard",
  "Loader2",
  "Mail",
  "Map",
  "MapPinned",
  "MessageCircle",
  "MoreHorizontal",
  "Pencil",
  "Phone",
  "Plus",
  "RefreshCw",
  "Route",
  "Search",
  "Send",
  "Settings",
  "ShieldCheck",
  "SlidersHorizontal",
  "Sparkles",
  "Star",
  "Target",
  "Trash2",
  "TrendingDown",
  "TrendingUp",
  "UserCheck",
  "UserPlus",
  "Users",
  "Wallet",
  "X",
]);

let failures = 0;

function ok(message) {
  console.log(`OK ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function cleanName(raw) {
  return raw
    .replace(/^type\s+/, "")
    .replace(/\s+as\s+.*/i, "")
    .trim();
}

function readImportBlocks(text, source) {
  const lines = text.split(/\r?\n/);
  const blocks = [];

  for (let start = 0; start < lines.length; start += 1) {
    const line = lines[start].trimStart();
    if (!line.startsWith("import {")) continue;

    let block = line;
    let end = start;
    while (end < lines.length - 1) {
      if (block.includes("from ")) break;
      end += 1;
      block += `\n${lines[end]}`;
    }

    if (!block.includes(`from "${source}"`) && !block.includes(`from '${source}'`)) continue;

    const match = block.match(/import\s*\{([\s\S]*?)\}\s*from\s*["'][^"']+["'];?/);
    if (!match) continue;

    blocks.push(
      match[1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    );
  }

  return blocks;
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    fail(`${file} missing`);
    continue;
  }

  const text = fs.readFileSync(file, "utf8");

  if (text.includes("ClipboardPaste")) fail(`${file} contains unsupported ClipboardPaste`);
  else ok(`${file} does not contain ClipboardPaste`);

  if (/import\s+React\s+from\s+["']react["'];?/.test(text)) {
    fail(`${file} contains unsupported default React import`);
  }
  if (/import\s+\*\s+as\s+React\s+from\s+["']react["'];?/.test(text)) {
    fail(`${file} contains unsupported namespace React import`);
  }

  const reactBlocks = readImportBlocks(text, "react");
  const lucideBlocks = readImportBlocks(text, "lucide-react");

  if (reactBlocks.length > 1) fail(`${file} contains multiple react import blocks`);
  else ok(`${file} has ${reactBlocks.length} react import block(s)`);

  if (lucideBlocks.length > 1) fail(`${file} contains multiple lucide-react import blocks`);
  else ok(`${file} has ${lucideBlocks.length} lucide-react import block(s)`);

  for (const block of reactBlocks) {
    const seen = new Set();
    for (const raw of block) {
      const name = cleanName(raw);
      if (seen.has(name)) fail(`${file} duplicate react import ${name}`);
      seen.add(name);
      if (iconSymbols.has(name)) fail(`${file} react import incorrectly contains icon ${name}`);
    }
  }

  for (const block of lucideBlocks) {
    const seen = new Set();
    for (const raw of block) {
      const name = cleanName(raw);
      if (seen.has(name)) fail(`${file} duplicate lucide import ${name}`);
      seen.add(name);
      if (reactSymbols.has(name)) fail(`${file} lucide import incorrectly contains React symbol ${name}`);
    }
  }

  if (reactBlocks.length === 0 && text.includes('from "react"')) {
    fail(`${file} has an unparsed react import block`);
  }

  if (lucideBlocks.length === 0 && text.includes('from "lucide-react"')) {
    fail(`${file} has an unparsed lucide-react import block`);
  }
}

if (failures > 0) {
  console.error(`Import hygiene failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Ambassador import hygiene passed.");
