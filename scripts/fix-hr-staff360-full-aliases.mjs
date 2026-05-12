import fs from 'node:fs'

const file = 'lib/hr-production/repository.ts'

if (!fs.existsSync(file)) {
  console.error('Missing lib/hr-production/repository.ts')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// Ensure getStaff360 includes broad staff-related aliases.
// This uses stable string replacements to avoid rewriting your whole repository.

const replacements = [
  [
`    attendance: (dashboard.attendance || []).filter(byStaff),
    documents: (dashboard.documents || []).filter(byStaff),`,
`    attendance: (dashboard.attendance || []).filter(byStaff),
    rosters: (dashboard.rosters || []).filter(byStaff),
    rosterAssignments: (dashboard.rosters || []).filter(byStaff),
    documents: (dashboard.documents || []).filter(byStaff),`
  ],
  [
`    contracts: (dashboard.contracts || []).filter(byStaff),
    training: (dashboard.training || []).filter(byStaff),`,
`    contracts: (dashboard.contracts || []).filter(byStaff),
    approvals: (dashboard.approvals || []).filter(byStaff),
    tasks: (dashboard.tasks || []).filter(byStaff),
    incidents: (dashboard.incidents || []).filter(byStaff),
    serviceRequests: (dashboard.serviceRequests || []).filter(byStaff),
    training: (dashboard.training || []).filter(byStaff),`
  ],
  [
`    performance: (dashboard.performance || []).filter(byStaff),
    reviews: (dashboard.performance || []).filter(byStaff),`,
`    performance: (dashboard.performance || []).filter(byStaff),
    reviews: (dashboard.performance || []).filter(byStaff),
    payroll: (dashboard.payroll || []).filter(byStaff),
    leave: (dashboard.leave || []).filter(byStaff),`
  ],
]

for (const [from, to] of replacements) {
  if (s.includes(from)) s = s.replace(from, to)
}

// If file is already partially patched, add missing properties after attendance/documents/contracts blocks.
if (!s.includes('rosters: (dashboard.rosters || []).filter(byStaff)')) {
  s = s.replace(
    '    attendance: (dashboard.attendance || []).filter(byStaff),',
    '    attendance: (dashboard.attendance || []).filter(byStaff),\n    rosters: (dashboard.rosters || []).filter(byStaff),\n    rosterAssignments: (dashboard.rosters || []).filter(byStaff),'
  )
}

if (!s.includes('approvals: (dashboard.approvals || []).filter(byStaff)')) {
  s = s.replace(
    '    contracts: (dashboard.contracts || []).filter(byStaff),',
    '    contracts: (dashboard.contracts || []).filter(byStaff),\n    approvals: (dashboard.approvals || []).filter(byStaff),\n    tasks: (dashboard.tasks || []).filter(byStaff),\n    incidents: (dashboard.incidents || []).filter(byStaff),\n    serviceRequests: (dashboard.serviceRequests || []).filter(byStaff),'
  )
}

if (!s.includes('payroll: (dashboard.payroll || []).filter(byStaff)')) {
  s = s.replace(
    '    reviews: (dashboard.performance || []).filter(byStaff),',
    '    reviews: (dashboard.performance || []).filter(byStaff),\n    payroll: (dashboard.payroll || []).filter(byStaff),\n    leave: (dashboard.leave || []).filter(byStaff),'
  )
}

fs.writeFileSync(file, s)
console.log('Patched getStaff360 with full staff aliases: rosters, approvals, tasks, incidents, serviceRequests, payroll, leave')
