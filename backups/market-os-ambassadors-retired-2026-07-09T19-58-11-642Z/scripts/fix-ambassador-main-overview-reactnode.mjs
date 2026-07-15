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

// This build error happens because a tuple like [label, value, Icon, color]
// is inferred as a mixed union, so {value} can become Icon type.
// We hard-cast rendered tuple values in JSX where this file commonly renders KPI cards.
src = src.replaceAll(
  '<div className="mt-2 text-xl font-black">{value}</div>',
  '<div className="mt-2 text-xl font-black">{value as string}</div>'
);

src = src.replaceAll(
  '<div className="text-xs font-bold text-slate-500">{label}</div>',
  '<div className="text-xs font-bold text-slate-500">{label as string}</div>'
);

src = src.replaceAll(
  '<div className="text-xs font-black uppercase text-slate-500">{label}</div>',
  '<div className="text-xs font-black uppercase text-slate-500">{label as string}</div>'
);

src = src.replaceAll(
  '<div className="mt-1 text-xs font-bold text-emerald-600">{delta}</div>',
  '<div className="mt-1 text-xs font-bold text-emerald-600">{delta as string}</div>'
);

src = src.replaceAll(
  '<div className="mt-1 text-xs font-bold text-emerald-600">{sub}</div>',
  '<div className="mt-1 text-xs font-bold text-emerald-600">{sub as string}</div>'
);

// Also fix icon variable from tuple arrays if needed.
src = src.replaceAll(
  'const I = Icon as typeof Users',
  'const I = Icon as typeof Users'
);

// Generic safety for the exact common pattern at this line.
src = src.replaceAll(
  '{value}</div><div className="text-xs',
  '{value as string}</div><div className="text-xs'
);

fs.writeFileSync(file, src);
console.log("Fixed ReactNode tuple rendering types in:", file);
