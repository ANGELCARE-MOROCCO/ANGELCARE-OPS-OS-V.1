#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const manifest=fs.readFileSync('MZ4_PATCH_FILE_LIST.txt','utf8');
for(const token of ['/app/api/','/supabase/','/migrations/','.sql']){if(manifest.includes(token)) throw new Error(`Backend boundary violation: ${token}`)}
const files=manifest.trim().split(/\r?\n/).filter(Boolean); if(files.some(file=>file.includes('package.json')||file.includes('package-lock.json'))) throw new Error('Dependency manifest modification is outside scope');
console.log('PASS — MZ4 introduces no API, database, Supabase, migration or dependency architecture');
