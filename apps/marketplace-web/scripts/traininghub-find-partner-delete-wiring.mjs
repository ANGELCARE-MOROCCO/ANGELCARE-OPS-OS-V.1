import fs from 'node:fs'
import path from 'node:path'

const roots = ['app', 'components', 'lib']
const patterns = [
  'Suppression impossible',
  'Supprimer définitivement',
  'safe-delete',
  'hard-delete',
  'DELETE',
  'deletePartner',
  'permanently',
]

const hits = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8')
      for (const pattern of patterns) {
        const idx = text.indexOf(pattern)
        if (idx >= 0) {
          const line = text.slice(0, idx).split(/\r?\n/).length
          hits.push({ file: full, line, pattern })
        }
      }
    }
  }
}

roots.forEach(walk)

console.table(hits)
fs.mkdirSync('tmp', { recursive: true })
fs.writeFileSync('tmp/traininghub-delete-wiring-hits.json', JSON.stringify(hits, null, 2))

console.log('\nSaved: tmp/traininghub-delete-wiring-hits.json')
console.log('If UI still says "Suppression impossible", paste this table plus the browser Network DELETE endpoint/status.')
