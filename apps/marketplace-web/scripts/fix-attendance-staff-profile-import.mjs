import fs from 'node:fs'

const file = 'app/(protected)/hr/attendance/staff/[id]/page.tsx'

if (!fs.existsSync(file)) {
  console.error(`Missing ${file}`)
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

s = s.replaceAll(
  "from '../../_components/AttendanceLiveMonitorUI'",
  "from '../../../_components/AttendanceLiveMonitorUI'"
)

s = s.replaceAll(
  'from "../../_components/AttendanceLiveMonitorUI"',
  'from "../../../_components/AttendanceLiveMonitorUI"'
)

fs.writeFileSync(file, s)
console.log('Fixed AttendanceLiveMonitorUI import path in staff attendance profile page.')
