import fs from 'fs'; import crypto from 'crypto'
const baseline=process.env.MZ7_PRESERVATION_BASELINE||'BULK6_PRESERVATION_BASELINE.json'
if(!fs.existsSync(baseline)) throw new Error(`Preservation baseline missing: ${baseline}`)
const expected=JSON.parse(fs.readFileSync(baseline,'utf8'))
for(const [file,hash] of Object.entries(expected)){
  if(!fs.existsSync(file)) throw new Error(`Preservation file missing: ${file}`)
  const got=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  if(got!==hash) throw new Error(`Bulk 1–5 preservation mismatch: ${file}`)
}
console.log(`PASS — ${Object.keys(expected).length} protected Bulk 1–5 files retain their baseline hashes`)
