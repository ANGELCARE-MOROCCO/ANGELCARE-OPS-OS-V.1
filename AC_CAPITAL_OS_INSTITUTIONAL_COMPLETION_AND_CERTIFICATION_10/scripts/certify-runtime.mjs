#!/usr/bin/env node
import process from "node:process";

const base = (process.env.AC_CAPITAL_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const cookie = process.env.AC_CAPITAL_SESSION_COOKIE || "";
if (!cookie) {
  console.error("FAIL: Set AC_CAPITAL_SESSION_COOKIE to an authenticated browser Cookie header value.");
  process.exit(1);
}
async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { Cookie: cookie, "Content-Type": "application/json", ...(init.headers || {}) } });
  const raw = await response.text();
  let body; try { body = raw ? JSON.parse(raw) : {}; } catch { body = { raw }; }
  if (!response.ok || body.ok === false) throw new Error(`${path}:HTTP_${response.status}:${body.code || body.warning || raw.slice(0,300)}`);
  return body.data || body;
}
await request("/api/ac-capital-os/certification", { method: "POST", body: JSON.stringify({ action: "initialize", payload: {} }) });
const integrity = await request("/api/ac-capital-os/certification", { method: "POST", body: JSON.stringify({ action: "run-integrity", payload: {} }) });
const workspaces = await request("/api/ac-capital-os/certification", { method: "POST", body: JSON.stringify({ action: "run-workspaces", payload: {} }) });
const snapshot = await request("/api/ac-capital-os/certification");
console.log(JSON.stringify({ integrityRun: integrity.run, workspaceRun: workspaces.run, workspaceStatuses: (snapshot.workspaces || []).map((row) => ({ key: row.workspace_key, status: row.status })), scenarioStatuses: (snapshot.scenarios || []).map((row) => ({ key: row.scenario_key, status: row.status })) }, null, 2));
console.log("AC_CAPITAL_OS_IC10_RUNTIME_CERTIFICATION_REFRESH_COMPLETED");
console.log("NOTE: This command does not convert NOT TESTED browser/visual/scenario gates into CERTIFIED.");
