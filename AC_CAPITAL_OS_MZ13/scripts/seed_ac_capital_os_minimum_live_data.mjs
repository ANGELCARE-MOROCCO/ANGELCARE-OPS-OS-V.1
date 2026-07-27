import fs from "node:fs";

const dryRun = !process.argv.includes("--execute");
const now = new Date().toISOString();

const seeds = [
  {
    table: "ac_capital_live_wiring_status",
    record: {
      workspace: "AC CAPITAL OS Production Activation",
      api_route: "/api/ac-capital-os/strategy-production-command",
      data_mode: "supabase-live",
      source: "supabase",
      supabase_read_enabled: true,
      supabase_write_enabled: true,
      ai_provider_mode: "dry-run",
      storage_status: "contract",
      report_status: "foundation",
      automation_gate_status: "manual-safe",
      approval_guard_status: "active",
      qa_status: "seeded-minimum",
      created_at: now,
      updated_at: now,
    },
  },
];

console.log("AC CAPITAL OS minimum live seed");
console.log(dryRun ? "DRY RUN ONLY. Re-run with --execute after reviewing." : "EXECUTE MODE requested.");
console.log(JSON.stringify(seeds, null, 2));
console.log("This script intentionally does not write directly. Use the records above through your approved Supabase admin process or extend safely after review.");
