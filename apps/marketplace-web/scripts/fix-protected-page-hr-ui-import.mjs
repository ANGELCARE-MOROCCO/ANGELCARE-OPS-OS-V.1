import fs from 'node:fs'

const file = 'app/(protected)/page.tsx'

if (!fs.existsSync(file)) {
  console.log('No app/(protected)/page.tsx found. Nothing to patch.')
  process.exit(0)
}

let s = fs.readFileSync(file, 'utf8')

s = s.replace(
  "import { HRAction, HRCard, HRLightAction, HRSection, HRStatusPill, HRTable } from './_components/HRProductionUI'",
  "import { HRAction, HRCard, HRLightAction, HRSection, HRStatusPill, HRTable } from './hr/_components/HRProductionUI'"
)

fs.writeFileSync(file, s)
console.log('Patched HRProductionUI import in app/(protected)/page.tsx')
