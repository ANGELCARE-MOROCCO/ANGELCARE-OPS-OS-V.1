#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

if (!process.env.SUPABASE_DB_URL) {
  console.error("FAIL: Set SUPABASE_DB_URL before running reconciliation.");
  process.exit(1);
}
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = path.join(packageRoot, "supabase/migrations/20260729_ac_capital_os_institutional_completion_certification_10_backfill.sql");
const child = spawn("psql", ["-X", process.env.SUPABASE_DB_URL, "-v", "ON_ERROR_STOP=1", "-P", "pager=off", "-f", sql], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
