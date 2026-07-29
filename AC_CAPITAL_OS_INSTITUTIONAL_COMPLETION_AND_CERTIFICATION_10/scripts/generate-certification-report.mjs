#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import process from "node:process";
const base=(process.env.AC_CAPITAL_BASE_URL||"http://localhost:3000").replace(/\/$/,"");
const cookie=process.env.AC_CAPITAL_SESSION_COOKIE||"";
if(!cookie){console.error("FAIL: Set AC_CAPITAL_SESSION_COOKIE.");process.exit(1)}
const response=await fetch(`${base}/api/ac-capital-os/certification`,{headers:{Cookie:cookie}});
const payload=await response.json();
if(!response.ok||payload.ok===false){throw new Error(payload.code||payload.warning||`HTTP_${response.status}`)}
const data=payload.data||payload;
const lines=["# AC CAPITAL OS IC10 Live Certification Report","",`Generated: ${data.generatedAt||new Date().toISOString()}`,"","## Workspace status","",...(data.workspaces||[]).map((row)=>`- **${row.workspace_label}** — ${row.status}`),"","## Scenario status","",...(data.scenarios||[]).map((row)=>`- **${row.title}** — ${row.status}`),"","## Open integrity issues","",...(data.integrityIssues||[]).map((row)=>`- **${row.severity} · ${row.issue_code}** — ${row.title}`),"","This report never upgrades NOT TESTED evidence automatically."];
await writeFile("AC_CAPITAL_IC10_LIVE_CERTIFICATION_REPORT.md",lines.join("\n"));
await writeFile("AC_CAPITAL_IC10_LIVE_CERTIFICATION_SNAPSHOT.json",JSON.stringify(data,null,2));
console.log("AC_CAPITAL_OS_IC10_LIVE_REPORT_GENERATED");
