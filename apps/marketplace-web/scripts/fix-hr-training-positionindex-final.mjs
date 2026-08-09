import fs from 'fs'

const file = 'app/(protected)/hr/training/page.tsx'
if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// The previous React-key patch introduced positionIndex in scopes where the map callback
// does not define it. Replace those keys with stable values available in the current scope.
s = s.replaceAll('key={`filter-dept-${department}-${positionIndex}`}', 'key={`filter-dept-${department}`}' )
s = s.replaceAll('key={`filter-type-${type}-${positionIndex}`}', 'key={`filter-type-${type}`}' )
s = s.replaceAll('key={`${group.label}-${item.label}-${positionIndex}`}', 'key={`${group.label}-${item.label}`}' )

// Safety net: if any remaining positionIndex is still present in key-only contexts,
// remove the index segment instead of breaking TypeScript.
s = s.replace(/-\$\{positionIndex\}/g, '')
s = s.replace(/\$\{positionIndex\}-/g, '')

fs.writeFileSync(file, s)
console.log('Fixed undefined positionIndex references in HR training page')
