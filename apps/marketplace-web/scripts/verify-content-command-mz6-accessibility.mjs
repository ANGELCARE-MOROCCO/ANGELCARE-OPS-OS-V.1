import fs from 'node:fs'
const files=['components/market-os/content-command/headquarters/DirectoryWorkspace.tsx','components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','components/market-os/content-command/knowledge/knowledge-ui.tsx','components/market-os/content-command/knowledge/knowledge-system.module.css']
const text=files.map((file)=>fs.readFileSync(file,'utf8')).join('\n')
for(const token of ['aria-label','aria-live','role="tablist"','aria-selected','role="search"','prefers-reduced-motion']) if(!text.includes(token)) throw new Error(`MZ6 accessibility provision missing: ${token}`)
console.log('PASS — Atlas and Vault expose labels, live announcements, tab semantics and reduced motion')
