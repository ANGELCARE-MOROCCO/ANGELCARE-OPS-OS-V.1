import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const tsx = fs.readFileSync(path.join(root, 'components/market-os/content-command/research-control/ContentResearchControlWorkspace.tsx'), 'utf8')
const css = fs.readFileSync(path.join(root, 'components/market-os/content-command/research-control/research-control.module.css'), 'utf8')
const dts = fs.readFileSync(path.join(root, 'components/market-os/content-command/research-control/research-control.module.css.d.ts'), 'utf8')
const refs = [...new Set([...tsx.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1]))]
const missingCss = refs.filter((name) => !new RegExp(`\\.${name}(?![A-Za-z0-9_-])`).test(css))
const missingTypes = refs.filter((name) => !new RegExp(`readonly ${name}: string`).test(dts))
if (missingCss.length) throw new Error(`Missing CSS classes: ${missingCss.join(', ')}`)
if (missingTypes.length) throw new Error(`Missing CSS module typings: ${missingTypes.join(', ')}`)
for (const marker of ['@media (max-width: 760px)', '@media (prefers-reduced-motion: reduce)', ':focus']) {
  if (!css.includes(marker)) throw new Error(`CSS accessibility/responsive marker missing: ${marker}`)
}
console.log(`PASS — ${refs.length} CSS module references resolve with responsive and reduced-motion support`)
