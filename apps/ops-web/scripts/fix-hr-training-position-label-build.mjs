import fs from 'fs'

const file = 'app/(protected)/hr/training/page.tsx'
if (!fs.existsSync(file)) {
  console.error(`Missing file: ${file}`)
  process.exit(1)
}

let src = fs.readFileSync(file, 'utf8')
const before = src

// Fix invalid properties introduced in key generation.
src = src.replaceAll('position.id || position.label || position.title', 'position.id || position.name')
src = src.replaceAll('position.label || position.title || position.name', 'position.name')
src = src.replaceAll('position.title || position.label || position.name', 'position.name')
src = src.replaceAll('position.label', 'position.name')
src = src.replaceAll('position.title', 'position.name')

// If previous automated key patches left index references without map index,
// ensure positionBank map exposes positionIndex.
src = src.replace(/(positionBank\.map\(\(position)\)\s*=>/g, 'positionBank.map((position, positionIndex) =>')
src = src.replace(/(filteredPositions\.map\(\(position)\)\s*=>/g, 'filteredPositions.map((position, positionIndex) =>')
src = src.replace(/\$\{index\}/g, '${positionIndex}')
src = src.replace(/\$\{itemIndex\}/g, '${positionIndex}')

if (src === before) {
  console.log('No changes needed: HR training position key/type fixes already applied.')
} else {
  fs.writeFileSync(file, src)
  console.log('Applied HR training position label/title/index build fix.')
}
