import fs from 'node:fs'

const file = 'app/(protected)/hr/_lib/actions.ts'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(0)
}

let s = fs.readFileSync(file, 'utf8')

const importLine = "import { ensureStaffIdentityContract } from '@/lib/hr-production/identity-contract'"
if (!s.includes(importLine)) {
  s = s.replace(
    "import { HR_ALLOWED_WRITE_TABLES, HR_TABLES, logHRActivity } from '@/lib/hr-production/repository'",
    "import { HR_ALLOWED_WRITE_TABLES, HR_TABLES, logHRActivity } from '@/lib/hr-production/repository'\n" + importLine
  )
}

if (!s.includes('identity.contract.auto_from_createHrRecord')) {
  s = s.replace(
    "if (error) throw new Error(error.message)",
    `if (error) throw new Error(error.message)

  if (t === HR_TABLES.staff && data?.id) {
    await ensureStaffIdentityContract({
      staff_id: data.id,
      email: payload.email,
      full_name: payload.full_name || payload.name,
      user_id: payload.user_id,
      source: 'identity.contract.auto_from_createHrRecord',
    })
  }`
  )
}

fs.writeFileSync(file, s)
console.log('Patched HR create action to ensure identity contract for new staff.')
