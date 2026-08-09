import fs from 'node:fs'

const targets = [
  'app/(protected)/page.tsx',
  'app/(protected)/hr/page.tsx',
]

const replacements = [
  [
    '<HRTable rows={tableRows(recentStaff)} emptyLabel="No staff records found yet." />',
    '<HRTable headers={[\'Staff\', \'Role\', \'Status\', \'City\']} rows={tableRows(recentStaff)} />'
  ],
  [
    '<HRTable rows={tableRows(recentCandidates)} emptyLabel="No candidate records found yet." />',
    '<HRTable headers={[\'Candidate\', \'Stage\', \'Role\', \'Owner\']} rows={tableRows(recentCandidates)} />'
  ],
  [
    '<HRTable rows={tableRows(pendingApprovalsRows)} emptyLabel="No pending approvals found." />',
    '<HRTable headers={[\'Item\', \'Status\', \'Owner\', \'Date\']} rows={tableRows(pendingApprovalsRows)} />'
  ],
  [
    '<HRTable rows={tableRows(documentRows)} emptyLabel="No document records found." />',
    '<HRTable headers={[\'Document\', \'Owner\', \'Status\', \'Expiry\']} rows={tableRows(documentRows)} />'
  ],
]

for (const file of targets) {
  if (!fs.existsSync(file)) continue
  let s = fs.readFileSync(file, 'utf8')

  for (const [from, to] of replacements) {
    s = s.replaceAll(from, to)
  }

  // Patch repository alerts table, which is usually multiline.
  s = s.replace(
`<HRTable
            rows={tableRows(errors.map(([module, error]) => ({
              module,
              status: 'review',
              error: String(error),
            })))}
            emptyLabel="No repository errors detected."
          />`,
`<HRTable
            headers={['Module', 'Status', 'Error']}
            rows={tableRows(errors.map(([module, error]) => ({
              module,
              status: 'review',
              error: String(error),
            })))}
          />`
  )

  // Generic cleanup fallback: remove any remaining emptyLabel prop.
  s = s.replace(/\s+emptyLabel="[^"]*"/g, '')

  fs.writeFileSync(file, s)
  console.log(`Patched HRTable headers/emptyLabel in ${file}`)
}
