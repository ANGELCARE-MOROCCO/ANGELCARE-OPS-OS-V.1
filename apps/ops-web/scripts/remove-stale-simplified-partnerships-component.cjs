#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const stale = path.join(process.cwd(), "components/revenue-command-center/partnerships/RevenuePartnershipsEnterprisePage.tsx");
if (fs.existsSync(stale)) {
  const backup = stale + ".simplified-fallback.bak";
  if (!fs.existsSync(backup)) fs.copyFileSync(stale, backup);
  fs.unlinkSync(stale);
  console.log("Removed stale simplified partnerships component:", stale);
  console.log("Backup:", backup);
} else {
  console.log("No stale simplified partnerships component found.");
}
