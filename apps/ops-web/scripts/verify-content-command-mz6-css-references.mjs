import fs from 'node:fs'
const cssFile='components/market-os/content-command/knowledge/knowledge-system.module.css'
const css=fs.readFileSync(cssFile,'utf8')
const declared=new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match)=>match[1]))
const files=['components/market-os/content-command/headquarters/DirectoryWorkspace.tsx','components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','components/market-os/content-command/knowledge/knowledge-ui.tsx']
const refs=new Set()
for(const file of files){const text=fs.readFileSync(file,'utf8'); for(const match of text.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)) refs.add(match[1])}
const missing=[...refs].filter((name)=>!declared.has(name))
if(missing.length) throw new Error(`Missing MZ6 CSS classes: ${missing.join(', ')}`)
console.log(`PASS — ${refs.size} MZ6 CSS-module references resolve`)
