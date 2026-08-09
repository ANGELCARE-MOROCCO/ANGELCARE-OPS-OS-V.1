import fs from 'fs'
const manifest=fs.existsSync('MZ7_PATCH_FILE_LIST.txt')?'MZ7_PATCH_FILE_LIST.txt':'BULK6_PATCH_FILE_LIST.txt'
const files=fs.readFileSync(manifest,'utf8').trim().split(/\r?\n/).filter(Boolean)
for(const file of files){
  if(!fs.existsSync(file)) throw new Error(`Patch file missing: ${file}`)
  if(/\.(png|jpg|jpeg|zip|sha256)$/.test(file)) continue
  const s=fs.readFileSync(file,'utf8')
  if(/\/mnt\/data|\/Users\/[^/]+|[A-Za-z]:\\/.test(s)) throw new Error(`Non-portable path in ${file}`)
}
const cfg=JSON.parse(fs.readFileSync('tsconfig.content-experience-bulk6.json','utf8'))
if(cfg.extends!=='./tsconfig.json') throw new Error('Bulk 6 tsconfig must extend ./tsconfig.json')
console.log('PASS — Bulk 6 files and focused TypeScript configuration are repository-relative')
