import fs from 'node:fs'

const targets = [
  'app/(protected)/page.tsx',
  'app/(protected)/hr/page.tsx',
]

for (const file of targets) {
  if (!fs.existsSync(file)) continue

  let s = fs.readFileSync(file, 'utf8')

  // HRSection component accepts subtitle, not description.
  s = s.replaceAll('<HRSection title=', '<HRSection title=')
  s = s.replaceAll(' description="', ' subtitle="')
  s = s.replaceAll(' description={', ' subtitle={')

  fs.writeFileSync(file, s)
  console.log(`Patched HRSection description -> subtitle in ${file}`)
}
