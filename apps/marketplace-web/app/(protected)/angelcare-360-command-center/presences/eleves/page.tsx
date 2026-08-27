import { redirect } from 'next/navigation'
import StudentAttendanceCommand from '@/components/angelcare360/zone-b-presence/StudentAttendanceCommand'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceRecords } from '@/lib/angelcare360/server/attendance'
export const dynamic='force-dynamic'
export default async function Page(){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const records=await listAngelcare360AttendanceRecords({schoolId:context.school.id});return <StudentAttendanceCommand records={records}/>}
