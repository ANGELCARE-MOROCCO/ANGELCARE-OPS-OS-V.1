const fs = require('fs')
const path = require('path')

const root = process.cwd()
const files = [
  ['components/service-os/ServiceOSPrimitives.tsx', 'components/service-os/ServiceOSPrimitives.tsx'],
  ['app/(protected)/services/pricing-engine/page.tsx', 'app/(protected)/services/pricing-engine/page.tsx'],
]

for (const [srcRel, destRel] of files) {
  const src = path.join(__dirname, '..', srcRel)
  const dest = path.join(root, destRel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  console.log(`patched ${destRel}`)
}

console.log('ServiceOS hard stabilization patch applied.')
