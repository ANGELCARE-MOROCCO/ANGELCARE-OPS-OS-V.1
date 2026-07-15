const fs = require('fs')
const path = require('path')

const root = process.cwd()
const targets = [
  'app/(protected)/services/live-ops/page.tsx',
  'app/(protected)/services/incidents/page.tsx',
  'app/(protected)/services/operations/page.tsx',
  'app/(protected)/services/workflows/page.tsx',
  'app/(protected)/services/enterprise/page.tsx',
  'app/(protected)/services/capacity/page.tsx',
]

let changed = 0

function patchFile(rel) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) return
  let src = fs.readFileSync(file, 'utf8')
  const before = src

  // Guard common includes(status) patterns where status can be undefined.
  src = src.replace(/\.includes\(m\.status\)/g, ".includes(m.status ?? '')")
  src = src.replace(/\.includes\(x\.status\)/g, ".includes(x.status ?? '')")
  src = src.replace(/\.includes\(mission\.status\)/g, ".includes(mission.status ?? '')")
  src = src.replace(/\.includes\(item\.status\)/g, ".includes(item.status ?? '')")
  src = src.replace(/\.includes\(row\.status\)/g, ".includes(row.status ?? '')")
  src = src.replace(/\.includes\(b\.status\)/g, ".includes(b.status ?? '')")

  // Guard direct key/label rendering if optional fields are present in generated service pages.
  src = src.replace(/<StatusBadge status=\{m\.status\}/g, "<StatusBadge status={m.status ?? 'unknown'}")
  src = src.replace(/<StatusBadge status=\{x\.status\}/g, "<StatusBadge status={x.status ?? 'unknown'}")
  src = src.replace(/<StatusBadge status=\{mission\.status\}/g, "<StatusBadge status={mission.status ?? 'unknown'}")
  src = src.replace(/<StatusBadge status=\{item\.status\}/g, "<StatusBadge status={item.status ?? 'unknown'}")
  src = src.replace(/<StatusBadge status=\{row\.status\}/g, "<StatusBadge status={row.status ?? 'unknown'}")
  src = src.replace(/<StatusBadge status=\{b\.status\}/g, "<StatusBadge status={b.status ?? 'unknown'}")

  if (src !== before) {
    fs.writeFileSync(file, src)
    console.log('patched', rel)
    changed++
  } else {
    console.log('checked', rel)
  }
}

targets.forEach(patchFile)
console.log(`ServiceOS status guard patch complete. Files changed: ${changed}`)
