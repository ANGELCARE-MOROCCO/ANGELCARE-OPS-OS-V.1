import { redirect } from 'next/navigation'
import JustificationReviewDesk from '@/components/angelcare360/zone-b-presence/JustificationReviewDesk'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceJustifications } from '@/lib/angelcare360/server/attendance'
export const dynamic='force-dynamic'
export default async function Page(){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const items=await listAngelcare360AttendanceJustifications({schoolId:context.school.id});const canApprove=context.access.accessLevel==='super_admin'||context.permissions.has('presences.approve')||context.permissions.has('attendance.approve');return <JustificationReviewDesk items={items} schoolId={context.school.id} canApprove={canApprove}/>} 
