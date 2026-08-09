#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const files=['components/market-os/content-command/headquarters/MissionsWorkspace.tsx','components/market-os/content-command/content-tasks-page.tsx','components/market-os/content-command/tasks/TaskExecutionCommandCenter.tsx','components/market-os/content-command/tasks/TaskDetailWorkspace.tsx','components/market-os/content-command/tasks/TaskEditWorkspace.tsx','components/market-os/content-command/execution/task-operating-model.ts'];
const text=files.map(file=>fs.readFileSync(file,'utf8')).join('\n');
const forbidden=[/Math\.random\(/,/fake productivity/i,/mock mission/i,/sample task/i,/utilization score/i,/fabricated evidence/i];
for(const rule of forbidden){if(rule.test(text)) throw new Error(`Fabricated execution pattern detected: ${rule}`)}
for(const honest of ['n’invente','non renseignée','non définie','Charge observée']){if(!text.includes(honest)) throw new Error(`Honest boundary language missing: ${honest}`)}
console.log('PASS — MZ4 introduces no fabricated mission, task, evidence, workload, timer or dependency truth');
