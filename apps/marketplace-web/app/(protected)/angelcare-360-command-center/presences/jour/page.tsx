import { redirect } from 'next/navigation'
import PresenceTodayCommand from '@/components/angelcare360/zone-b-presence/PresenceTodayCommand'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360DailyAttendanceState, listAngelcare360AttendanceRecords } from '@/lib/angelcare360/server/attendance'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<{date?:string}>}){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const q=(await searchParams)||{};const dayState=await getAngelcare360DailyAttendanceState({schoolId:context.school.id,date:q.date||null});if(!dayState)redirect('/angelcare-360-command-center/presences');const all=await listAngelcare360AttendanceRecords({schoolId:context.school.id});const sessionIds=new Set(dayState.sessions.map(s=>s.id));const records=all.filter(r=>sessionIds.has(r.attendance_session_id));return <PresenceTodayCommand dayState={dayState} records={records}/>}
