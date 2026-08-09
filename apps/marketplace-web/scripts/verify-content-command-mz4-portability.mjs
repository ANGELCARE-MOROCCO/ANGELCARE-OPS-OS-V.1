#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const manifest=fs.readFileSync('MZ4_PATCH_FILE_LIST.txt','utf8').trim().split(/\r?\n/); const files=manifest.map(file=>file.replace(/^apps\/ops-web\//,'')).filter(file=>fs.existsSync(file)&&!file.endsWith('verify-content-command-mz4-portability.mjs'));
for(const file of files){const text=fs.readFileSync(file,'utf8'); for(const token of ['/mnt/data','/Users/user','C:\\','mz4_stubs']) if(text.includes(token)) throw new Error(`Non-portable path ${token} in ${file}`)}
const config=JSON.parse(fs.readFileSync('tsconfig.market-os-content-command-mz4.json','utf8')); if(config.extends!=='./tsconfig.json') throw new Error('MZ4 TypeScript config must extend repository tsconfig'); if(JSON.stringify(config).includes('/')) { const bad=(config.files||[]).filter(file=>file.startsWith('/')); if(bad.length) throw new Error(`Absolute TypeScript paths: ${bad.join(', ')}`)}
console.log('PASS — MZ4 package and TypeScript configuration are repository-relative and portable');
