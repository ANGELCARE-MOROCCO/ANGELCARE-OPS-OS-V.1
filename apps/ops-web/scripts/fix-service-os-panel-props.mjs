import fs from 'node:fs'
import path from 'node:path'

const roots = [
  'app/(protected)/services',
  'app/(protected)/service-os',
  'components/service-os',
]

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) out.push(...walk(p))
    else if (/\.(tsx|ts)$/.test(p)) out.push(p)
  }
  return out
}

const files = roots.flatMap(walk)
let changed = 0

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  const before = s

  // Your ServiceOSPanel component appears to use CommonProps and does not accept title/subtitle.
  // This converts title/subtitle props into an internal header block, preserving the text visually.
  s = s.replace(
    /<ServiceOSPanel\s+title="([^"]*)"\s+subtitle="([^"]*)"\s*>/g,
    (_m, title, subtitle) =>
      `<ServiceOSPanel>\n        <div className="mb-4">\n          <h2 className="text-xl font-black text-slate-950">${title}</h2>\n          <p className="mt-1 text-sm text-slate-600">${subtitle}</p>\n        </div>`
  )

  s = s.replace(
    /<ServiceOSPanel\s+title="([^"]*)"\s*>/g,
    (_m, title) =>
      `<ServiceOSPanel>\n        <div className="mb-4">\n          <h2 className="text-xl font-black text-slate-950">${title}</h2>\n        </div>`
  )

  if (s !== before) {
    fs.writeFileSync(file, s)
    changed++
    console.log(`Patched ${file}`)
  }
}

console.log(`ServiceOSPanel prop patch complete. Files changed: ${changed}`)
