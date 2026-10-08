import { redirect } from 'next/navigation'
import PresenceOverviewCommand from '@/components/angelcare360/zone-b-presence/PresenceOverviewCommand'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360PresencesOverview } from '@/lib/angelcare360/server/presences-overview'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<{date?:string}>}){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/presences');const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const q=(await searchParams)||{};const data=await getAngelcare360PresencesOverview({schoolId:context.school.id,selectedDate:q.date||null,activeAcademicYearLabel:context.academicYear?.label||null});return <PresenceOverviewCommand data={data} schoolName={context.school.name}/>}
