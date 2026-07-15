import fs from 'node:fs'

const file = 'lib/hr-production/repository.ts'

if (!fs.existsSync(file)) {
  console.error('Missing lib/hr-production/repository.ts')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// Add onboarding to getStaff360 return object.
// Preferred location: near tasks because staff page combines tasks + onboarding.
if (!s.includes('onboarding: (dashboard.onboarding || []).filter(byStaff)')) {
  if (s.includes('    tasks: (dashboard.tasks || []).filter(byStaff),')) {
    s = s.replace(
      '    tasks: (dashboard.tasks || []).filter(byStaff),',
      '    tasks: (dashboard.tasks || []).filter(byStaff),\n    onboarding: (dashboard.onboarding || []).filter(byStaff),'
    )
  } else if (s.includes('    approvals: (dashboard.approvals || []).filter(byStaff),')) {
    s = s.replace(
      '    approvals: (dashboard.approvals || []).filter(byStaff),',
      '    approvals: (dashboard.approvals || []).filter(byStaff),\n    onboarding: (dashboard.onboarding || []).filter(byStaff),'
    )
  } else {
    // Last-resort insert after attendance.
    s = s.replace(
      '    attendance: (dashboard.attendance || []).filter(byStaff),',
      '    attendance: (dashboard.attendance || []).filter(byStaff),\n    onboarding: (dashboard.onboarding || []).filter(byStaff),'
    )
  }
}

fs.writeFileSync(file, s)
console.log('Patched getStaff360 onboarding alias')
