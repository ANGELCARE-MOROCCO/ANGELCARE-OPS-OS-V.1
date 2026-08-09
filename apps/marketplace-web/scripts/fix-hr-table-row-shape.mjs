import fs from 'node:fs'

const targets = [
  'app/(protected)/page.tsx',
  'app/(protected)/hr/page.tsx',
]

function addHelper(source) {
  if (source.includes('function tableRows(')) return source

  const marker = `function firstValue(row: any, fields: string[], fallback = '—') {
  for (const field of fields) {
    if (row?.[field] !== undefined && row?.[field] !== null && String(row[field]).trim() !== '') return row[field]
  }
  return fallback
}`

  const helper = `${marker}

function tableRows(items: any[]): any[][] {
  return items.map((item) => {
    if (Array.isArray(item)) return item
    return Object.values(item || {}).map((value) => value === null || value === undefined ? '—' : String(value))
  })
}`

  if (source.includes(marker)) {
    return source.replace(marker, helper)
  }

  // Fallback: insert after rows() helper.
  return source.replace(
`function rows(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}`,
`function rows(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function tableRows(items: any[]): any[][] {
  return items.map((item) => {
    if (Array.isArray(item)) return item
    return Object.values(item || {}).map((value) => value === null || value === undefined ? '—' : String(value))
  })
}`
  )
}

for (const file of targets) {
  if (!fs.existsSync(file)) continue

  let s = fs.readFileSync(file, 'utf8')
  s = addHelper(s)

  // Convert object-row arrays into the table shape expected by your existing HRTable.
  const names = [
    'recentStaff',
    'recentCandidates',
    'pendingApprovalsRows',
    'documentRows',
  ]

  for (const name of names) {
    s = s.replaceAll(`rows={${name}}`, `rows={tableRows(${name})}`)
  }

  // Inline mapped errors table.
  s = s.replaceAll(
    `rows={errors.map(([module, error]) => ({
              module,
              status: 'review',
              error: String(error),
            }))}`,
    `rows={tableRows(errors.map(([module, error]) => ({
              module,
              status: 'review',
              error: String(error),
            })))}`  
  )

  fs.writeFileSync(file, s)
  console.log(`Patched HRTable row shape in ${file}`)
}
