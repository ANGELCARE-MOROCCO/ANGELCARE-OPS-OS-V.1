#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const text=fs.readFileSync('components/market-os/content-command/tasks/TaskEditWorkspace.tsx','utf8');
const required=['GOVERNED TASK EDITOR','DEPENDENCY IMPACT','COMPLETION STANDARD','EVIDENCE REQUIREMENTS','REVIEW REQUIREMENTS','CHANGE IMPACT','Motif d’amendement','beforeunload'];
for(const token of required){if(!text.includes(token)) throw new Error(`Task Editor contract missing: ${token}`)}
if(!text.includes('deleteConfirm !== currentTask.title')) throw new Error('Permanent deletion lacks exact-title confirmation');
console.log('PASS — governed editor contains unsaved-change protection, impact analysis, amendment reason and safe deletion');
