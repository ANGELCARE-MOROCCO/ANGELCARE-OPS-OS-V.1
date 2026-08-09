import fs from 'node:fs'
const files=fs.readFileSync('MZ6_PATCH_FILE_LIST.txt','utf8').trim().split(/\r?\n/).filter(Boolean)
for(const file of files){if(file.endsWith('verify-content-command-mz6-portability.mjs')) continue; if(!fs.existsSync(file)) throw new Error(`Patch file missing: ${file}`); const text=fs.readFileSync(file); if(text.includes(Buffer.from('/mnt/data'))||text.includes(Buffer.from('/Users/user'))||text.includes(Buffer.from('mz6_stubs'))||text.includes(Buffer.from(':\\'))) throw new Error(`Non-portable path in ${file}`)}
const config=JSON.parse(fs.readFileSync('tsconfig.market-os-content-command-mz6.json','utf8'))
if(config.extends!=='./tsconfig.json') throw new Error('MZ6 TypeScript config must extend repository tsconfig')
console.log('PASS — MZ6 package and TypeScript configuration are repository-relative and portable')
