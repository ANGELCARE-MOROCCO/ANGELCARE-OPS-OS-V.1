import { redirect } from 'next/navigation'
import AbsenceVerificationBoard from '@/components/angelcare360/zone-b-presence/AbsenceVerificationBoard'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AbsenceRecords } from '@/lib/angelcare360/server/attendance'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<{from?:string;to?:string}>}){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const q=(await searchParams)||{};const result=await listAngelcare360AbsenceRecords({schoolId:context.school.id,from:q.from||null,to:q.to||null});const rows=Array.isArray(result)?result:[];const canUpdate=context.access.accessLevel==='super_admin'||context.permissions.has('presences.update')||context.permissions.has('attendance.update');return <AbsenceVerificationBoard rows={rows} schoolId={context.school.id} canUpdate={canUpdate}/>} 
