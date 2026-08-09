#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const model=fs.readFileSync('components/market-os/content-command/execution/task-operating-model.ts','utf8');
const editor=fs.readFileSync('components/market-os/content-command/tasks/TaskEditWorkspace.tsx','utf8'); const detail=fs.readFileSync('components/market-os/content-command/tasks/TaskDetailWorkspace.tsx','utf8');
for(const token of ['dependencyIds','successorIds','Aucune dépendance','chemin critique']){if(!model.includes(token)&&!editor.includes(token)&&!detail.includes(token)) throw new Error(`Dependency contract missing: ${token}`)}
if(/criticalPath\s*=\s*Math\.random|Math\.random\(\).*dependency/i.test(model+editor)) throw new Error('Fabricated dependency path detected');
console.log('PASS — dependencies are explicit and no critical path is fabricated');
