#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const text=fs.readFileSync('components/market-os/content-command/tasks/TaskDetailWorkspace.tsx','utf8');
const required=['TASK IDENTITY','OBJECTIVE & SCOPE','DEPENDENCIES','CHECKLIST','EVIDENCE','BLOCKERS','CLARIFICATIONS','REVIEW HISTORY','COLLABORATION','CHANGE HISTORY','AVAILABLE ACTIONS'];
for(const token of required){if(!text.includes(token)) throw new Error(`Task Detail contract missing: ${token}`)}
console.log('PASS — Task Detail contains identity, lineage, dependencies, evidence, review, blockers and history');
