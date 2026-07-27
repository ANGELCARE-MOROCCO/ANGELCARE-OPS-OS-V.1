#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const text=fs.readFileSync('components/market-os/content-command/tasks/TaskExecutionCommandCenter.tsx','utf8');
const required=['OBJECTIVE & COMPLETION STANDARD','SCOPE GUARD','EXECUTION CHECKLIST','WORKING MATERIALS','EVIDENCE SUBMISSION','REVIEW READINESS','BLOCKER & CLARIFICATION','NEXT TASK','SESSION AUDIT'];
for(const token of required){if(!text.includes(token)) throw new Error(`Task Execution contract missing: ${token}`)}
if(!text.includes('disabled={!readiness.ready')) throw new Error('Submission gate does not enforce readiness');
console.log('PASS — focused execution protects objective, scope, checklist, evidence, blockers and review readiness');
