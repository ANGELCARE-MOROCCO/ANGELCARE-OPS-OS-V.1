#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const css='components/market-os/content-command/execution/execution-command.module.css'; const decl=`${css}.d.ts`; const text=fs.readFileSync(css,'utf8'); const dts=fs.readFileSync(decl,'utf8');
const files=['components/market-os/content-command/headquarters/MissionsWorkspace.tsx','components/market-os/content-command/content-tasks-page.tsx','components/market-os/content-command/tasks/TaskExecutionCommandCenter.tsx','components/market-os/content-command/tasks/TaskDetailWorkspace.tsx','components/market-os/content-command/tasks/TaskEditWorkspace.tsx','components/market-os/content-command/execution/execution-ui.tsx'];
const refs=new Set(); for(const file of files){for(const match of fs.readFileSync(file,'utf8').matchAll(/styles\.([A-Za-z0-9_]+)/g)) refs.add(match[1])}
const missing=[...refs].filter(name=>!new RegExp(`\\.${name}(?:[^A-Za-z0-9_-]|$)`).test(text)||!dts.includes(`'${name}'`));
if(missing.length) throw new Error(`MZ4 CSS references missing: ${missing.join(', ')}`);
console.log(`PASS — ${refs.size} MZ4 CSS-module references resolve`);
