#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const text=fs.readFileSync('components/market-os/content-command/content-tasks-page.tsx','utf8');
const required=['TODAY COMMAND','OPERATIONAL QUEUES','TASK PORTFOLIO','DEPENDENCY INTELLIGENCE','EVIDENCE QUEUE','SAVED COMMAND VIEWS','Charge observée'];
for(const token of required){if(!text.includes(token)) throw new Error(`Task Command contract missing: ${token}`)}
console.log('PASS — Task Command contains Today Command, queues, observed workload, dependencies and evidence control');
