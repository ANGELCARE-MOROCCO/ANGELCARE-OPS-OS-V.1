import fs from 'node:fs'

const targets = [
  'app/(protected)/page.tsx',
  'app/(protected)/hr/page.tsx',
]

for (const file of targets) {
  if (!fs.existsSync(file)) continue

  let s = fs.readFileSync(file, 'utf8')

  s = s.replaceAll('<HRStatusPill status={readinessStatus} />', '<HRStatusPill value={readinessStatus} />')
  s = s.replaceAll('<HRStatusPill status={item.status} />', '<HRStatusPill value={item.status} />')
  s = s.replaceAll('<HRStatusPill status=', '<HRStatusPill value=')

  fs.writeFileSync(file, s)
  console.log(`Patched HRStatusPill props in ${file}`)
}
