#!/usr/bin/env node
import fs from 'node:fs'

const files = {
  access: 'app/angelcare-360-access/login/page.tsx',
  shared: 'app/angelcare-360-portal/login/page.tsx',
  teacher: 'app/angelcare-360-teacher/login/page.tsx',
  parent: 'app/angelcare-360-parent/login/page.tsx',
  student: 'app/angelcare-360-student/login/page.tsx',
  staff: 'app/angelcare-360-staff/login/page.tsx',
  auth: 'lib/angelcare360/portal/auth.ts',
}

let pass = 0
let fail = 0
const read = (p) => fs.readFileSync(p, 'utf8')
const check = (name, ok) => {
  if (ok) { console.log(`PASS ${name}`); pass += 1 }
  else { console.error(`FAIL ${name}`); fail += 1 }
}

const source = Object.fromEntries(Object.entries(files).map(([k,p]) => [k, read(p)]))

for (const name of ['access','shared','teacher','parent','student','staff']) {
  check(`${name} login has no login_app_user RPC`, !source[name].includes('login_app_user'))
}
check('canonical portal auth has no login_app_user RPC', !source.auth.includes('login_app_user'))
check('canonical portal auth uses bcrypt credential authority', source.auth.includes('verifyPassword('))
check('canonical portal auth persists app session', source.auth.includes("from('app_sessions').insert"))
check('canonical portal auth persists last_login_at', source.auth.includes('last_login_at'))
check('canonical portal auth reuses APP_SESSION_COOKIE', source.auth.includes('APP_SESSION_COOKIE'))
check('canonical session cookie is HTTP only', source.auth.includes('httpOnly:true'))
check('canonical session cookie is sameSite lax', source.auth.includes("sameSite:'lax'"))
check('canonical session cookie is secure in production', source.auth.includes("secure:process.env.NODE_ENV==='production'"))
check('canonical session cookie honors configured domain', source.auth.includes('APP_SESSION_COOKIE_DOMAIN'))
check('canonical portal auth binds role/person/school context', ['sanila_portal_kind','sanila_portal_person','sanila_portal_school'].every(v => source.auth.includes(v)))
check('teacher direct login delegates canonical auth with teacher persona', source.teacher.includes('authenticatePortalCredentials') && source.teacher.includes("requestedKind: 'teacher'"))
check('parent direct login delegates canonical auth with parent persona', source.parent.includes('authenticatePortalCredentials') && source.parent.includes("requestedKind: 'parent'"))
check('student direct login delegates canonical auth with student persona', source.student.includes('authenticatePortalCredentials') && source.student.includes("requestedKind: 'student'"))
check('staff direct login delegates canonical auth with staff persona', source.staff.includes('authenticatePortalCredentials') && source.staff.includes("requestedKind: 'staff'"))
check('canonical persona authority resolves parent links', source.auth.includes("from('angelcare360_parents')") && source.auth.includes('portal_app_user_id'))
check('canonical persona authority resolves student links', source.auth.includes("from('angelcare360_students')") && source.auth.includes('portal_app_user_id'))
check('canonical persona authority resolves and classifies staff/teacher links', source.auth.includes("from('angelcare360_staff')") && source.auth.includes("isTeacherType(row.staff_type)?'teacher':'staff'"))

console.log(`LOGIN_AUTHORITY_V2_PASS=${pass}`)
console.log(`LOGIN_AUTHORITY_V2_FAIL=${fail}`)
if (fail) process.exit(1)
