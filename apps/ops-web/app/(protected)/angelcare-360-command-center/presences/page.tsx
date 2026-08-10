import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import PresenceDailyControl from '@/components/angelcare360/customer-academic-authority/PresenceDailyControl'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360PresencesOverview } from '@/lib/angelcare360/server/presences-overview'
import { getAcademicAuthoritySignals } from '@/lib/angelcare360/server/customer-academic-authority'

export const dynamic='force-dynamic'
export default async function Angelcare360PresencesPage({searchParams}:{searchParams?:Promise<{date?:string;plane?:string}>}){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const query=(await searchParams)||{};const [data,signals]=await Promise.all([getAngelcare360PresencesOverview({schoolId:context.school.id,selectedDate:query.date||null,activeAcademicYearLabel:context.academicYear?.label||null}),getAcademicAuthoritySignals(context.school.id)]);if(!data)return <Angelcare360ErrorState title="Cockpit Présences indisponible" description="Le contexte de l’établissement n’a pas permis de charger le suivi des présences." actionLabel="Retour au cockpit" actionHref="/angelcare-360-command-center"/>;const canUpdate=context.access.accessLevel==='super_admin'||context.permissions.has('attendance.update');return <PresenceDailyControl data={data} schoolName={context.school.name} plane={query.plane||'live-control'} signals={signals} canUpdate={canUpdate}/>} 
