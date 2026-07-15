import fs from 'fs'

const file = 'app/(protected)/hr/training/page.tsx'
if (!fs.existsSync(file)) {
  console.error(`Missing file: ${file}`)
  process.exit(1)
}

let src = fs.readFileSync(file, 'utf8')
const before = src

// Fix broken map callback where the generated card key uses `index` but the map callback does not define it.
// Example broken: filteredPositions.map((position) => <a key={`position-card-${position.id}-${index}`}
src = src.replace(/(filteredPositions\.map\s*\(\s*\(\s*position\s*\))/g, 'filteredPositions.map((position, index)')
src = src.replace(/(positions\.map\s*\(\s*\(\s*position\s*\))/g, 'positions.map((position, index)')
src = src.replace(/(positionBank\.map\s*\(\s*\(\s*position\s*\))/g, 'positionBank.map((position, index)')

// If the patch script previously introduced itemIndex references in option keys without providing an index,
// normalize those keys to stable value-based keys instead.
src = src.replace(/key=\{`filter-dept-\$\{department\}-\$\{itemIndex\}`\}/g, 'key={`filter-dept-${department}`}')
src = src.replace(/key=\{`filter-type-\$\{type\}-\$\{itemIndex\}`\}/g, 'key={`filter-type-${type}`}')
src = src.replace(/key=\{`filter-coverage-\$\{coverage\}-\$\{itemIndex\}`\}/g, 'key={`filter-coverage-${coverage}`}')

// Hard fallback: any remaining position-card key that references undefined index gets a deterministic key.
src = src.replace(/key=\{`position-card-\$\{position\.id\}-\$\{index\}`\}/g, 'key={`position-card-${position.id || position.label || position.title}`}')

if (src === before) {
  console.log('No matching broken index pattern found. File may already be fixed.')
} else {
  fs.writeFileSync(file, src)
  console.log('Fixed HR training undefined index build issue.')
}
