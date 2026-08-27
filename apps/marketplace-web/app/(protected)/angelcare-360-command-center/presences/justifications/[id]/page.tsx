import { notFound, redirect } from 'next/navigation'
import JustificationDecisionDossier from '@/components/angelcare360/zone-b-presence/JustificationDecisionDossier'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AttendanceJustificationById } from '@/lib/angelcare360/server/attendance'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const {id}=await params;const item=await getAngelcare360AttendanceJustificationById({schoolId:context.school.id,id});if(!item)notFound();const canApprove=context.access.accessLevel==='super_admin'||context.permissions.has('presences.approve')||context.permissions.has('attendance.approve');return <JustificationDecisionDossier item={item} schoolId={context.school.id} canApprove={canApprove}/>}
