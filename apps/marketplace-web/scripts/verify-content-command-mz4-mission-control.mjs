#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const file='components/market-os/content-command/headquarters/MissionsWorkspace.tsx'; const text=fs.readFileSync(file,'utf8');
const required=['MISSION CONTROL','READINESS GATE','LIFECYCLE RUNWAY','CONSTITUTION DE MISSION','RESOURCE & AUTHORITY MAP','TASK ARCHITECTURE','CHECKPOINT COMMAND','RISK & ESCALATION','CLOSURE REVIEW','LESSONS LEARNED'];
for(const token of required){if(!text.includes(token)) throw new Error(`Mission Control contract missing: ${token}`)}
console.log('PASS — Mission Control contains constitution, readiness, ownership, task architecture, checkpoints, escalation and closure');
