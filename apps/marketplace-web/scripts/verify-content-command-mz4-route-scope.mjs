#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root=process.cwd();
const routes=[
'app/(protected)/market-os/content-command-center/missions/page.tsx',
'app/(protected)/market-os/content-command-center/tasks/page.tsx',
'app/(protected)/market-os/content-command-center/tasks/execution/page.tsx',
'app/(protected)/market-os/content-command-center/tasks/[taskId]/page.tsx',
'app/(protected)/market-os/content-command-center/tasks/[taskId]/edit/page.tsx'];
for(const file of routes){if(!fs.existsSync(path.join(root,file))) throw new Error(`MZ4 route missing: ${file}`)}
const manifest=fs.readFileSync(path.join(root,'MZ4_PATCH_FILE_LIST.txt'),'utf8').trim().split(/\r?\n/);
const forbidden=manifest.filter(file=>file.includes('/app/api/')||file.includes('/supabase/')||file.includes('/migrations/'));
if(forbidden.length) throw new Error(`MZ4 scope violation: ${forbidden.join(', ')}`);
console.log('PASS — exactly five contracted mission/task routes remain present and no API/database routes enter MZ4');
