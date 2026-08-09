#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const text=fs.readFileSync('components/market-os/content-command/headquarters/MissionsWorkspace.tsx','utf8');
const stages=['proposed','qualifying','scope_approved','ready','assigned','accepted','in_progress','checkpoint','submitted','ai_review','human_review','revision','validated','closed'];
for(const stage of stages){if(!text.includes(`"${stage}"`)) throw new Error(`Mission lifecycle stage missing: ${stage}`)}
if(!text.includes('aria-current={isCurrent ? "step"')) throw new Error('Mission lifecycle lacks accessible current-step state');
console.log('PASS — fourteen-stage mission lifecycle and accessible gate state are present');
