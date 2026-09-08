import { redirect } from 'next/navigation'
import AttendanceIntegrityLens from '@/components/angelcare360/zone-b-presence/AttendanceIntegrityLens'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceAuditEvents } from '@/lib/angelcare360/server/attendance'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function Page(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/presences/audit');const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const events=await listAngelcare360AttendanceAuditEvents({schoolId:context.school.id,filters:{module:'attendance'}});return <AttendanceIntegrityLens events={events}/>}
