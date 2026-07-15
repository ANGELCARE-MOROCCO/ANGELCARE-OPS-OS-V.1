import fs from 'fs'
const file = 'app/(protected)/hr/training/page.tsx'
let s = fs.readFileSync(file, 'utf8')
// Fix accidental undefined index variables introduced in key expressions.
s = s.replaceAll('${group.label}-${item.label}-${positionIndex}', '${group.label}-${item.label}-${item.href}')
s = s.replaceAll('${group.label}-${item.label}-${itemIndex}', '${group.label}-${item.label}-${item.href}')
s = s.replaceAll('${group.label}-${item.label}-${index}', '${group.label}-${item.label}-${item.href}')
s = s.replaceAll('${group.label}-${item.label}-undefined', '${group.label}-${item.label}-${item.href}')
// Also repair literal key snippets if template strings were already simplified badly.
s = s.replace(/key=\{`\$\{group\.label\}-\$\{item\.label\}-\$\{positionIndex\}`\}/g, 'key={`${group.label}-${item.label}-${item.href}`}')
s = s.replace(/key=\{`\$\{group\.label\}-\$\{item\.label\}-\$\{index\}`\}/g, 'key={`${group.label}-${item.label}-${item.href}`}')
fs.writeFileSync(file, s)
console.log('Fixed undefined positionIndex/index keys in', file)
