#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const files=['components/market-os/content-command/headquarters/MissionsWorkspace.tsx','components/market-os/content-command/content-tasks-page.tsx','components/market-os/content-command/tasks/TaskExecutionCommandCenter.tsx','components/market-os/content-command/tasks/TaskDetailWorkspace.tsx','components/market-os/content-command/tasks/TaskEditWorkspace.tsx','components/market-os/content-command/execution/execution-ui.tsx']; const text=files.map(file=>fs.readFileSync(file,'utf8')).join('\n');
for(const token of ['aria-label','aria-pressed','aria-current','role="dialog"','aria-modal="true"','role="status"']){if(!text.includes(token)) throw new Error(`Accessibility contract missing: ${token}`)}
const css=fs.readFileSync('components/market-os/content-command/execution/execution-command.module.css','utf8'); if(!css.includes('prefers-reduced-motion')) throw new Error('Reduced-motion support missing');
console.log('PASS — navigation, lifecycle, dialogs, status announcements and reduced-motion support are present');
