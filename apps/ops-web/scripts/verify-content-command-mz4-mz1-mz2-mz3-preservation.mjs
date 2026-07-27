#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

import crypto from "node:crypto";
const baseline=process.env.MZ4_PRESERVATION_BASELINE || process.argv[2]; if(!baseline||!fs.existsSync(baseline)) throw new Error('Provide MZ4 preservation baseline JSON');
const expected=JSON.parse(fs.readFileSync(baseline,'utf8'));
for(const [file,hash] of Object.entries(expected)){if(!fs.existsSync(file)) throw new Error(`Preservation file missing: ${file}`); const got=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); if(got!==hash) throw new Error(`MZ1/MZ2/MZ3 preservation mismatch: ${file}`)}
console.log('PASS — live pre-MZ4 hashes confirm MZ1, MZ2 and MZ3 protected files were not modified');
