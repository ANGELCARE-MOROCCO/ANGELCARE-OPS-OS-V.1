import fs from 'fs'
import path from 'path'

const file = path.join(process.cwd(), 'app/(protected)/hr/training/page.tsx')
if (!fs.existsSync(file)) {
  console.error('Missing file:', file)
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')
const before = s

// Fix bad key expressions produced by previous patch where itemIndex is referenced outside a map callback.
s = s.replace(/\$\{itemIndex\}/g, '${index}')
s = s.replace(/\bitemIndex\b/g, 'index')

// If a map callback now uses index but does not declare it, normalize common single-arg map patterns.
s = s.replace(/\.map\(\(department\)\s*=>/g, '.map((department, index) =>')
s = s.replace(/\.map\(\(type\)\s*=>/g, '.map((type, index) =>')
s = s.replace(/\.map\(\(role\)\s*=>/g, '.map((role, index) =>')
s = s.replace(/\.map\(\(item\)\s*=>/g, '.map((item, index) =>')
s = s.replace(/\.map\(\(position\)\s*=>/g, '.map((position, index) =>')
s = s.replace(/\.map\(\(resource\)\s*=>/g, '.map((resource, index) =>')
s = s.replace(/\.map\(\(training\)\s*=>/g, '.map((training, index) =>')

// More surgical fallback for the exact broken option key if it still exists in a slightly different form.
s = s.replace(/key=\{`filter-dept-\$\{department\}-\$\{[^}]+\}`\}/g, 'key={`filter-dept-${department}-${index}`}')
s = s.replace(/key=\{`filter-type-\$\{type\}-\$\{[^}]+\}`\}/g, 'key={`filter-type-${type}-${index}`}')

fs.writeFileSync(file, s)

if (s === before) {
  console.log('No itemIndex issue found; file left unchanged.')
} else {
  console.log('Fixed itemIndex/key issues in app/(protected)/hr/training/page.tsx')
}
