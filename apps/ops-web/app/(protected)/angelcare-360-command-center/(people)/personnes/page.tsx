import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import PeopleSovereignRegistry from '@/components/angelcare360/customer-foundation/PeopleSovereignRegistry'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360PeopleOverview } from '@/lib/angelcare360/server/people'
import { getAngelcare360FoundationSignals } from '@/lib/angelcare360/server/customer-foundation'
import { resolveAngelcare360FoundationPlane } from '@/data/angelcare360/customer-foundation'
export const dynamic='force-dynamic'
type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}
export default async function Angelcare360PeopleOverviewPage({searchParams}:Props){const params=await searchParams;const plane=resolveAngelcare360FoundationPlane('people',typeof params?.plane==='string'?params.plane:null);const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const activeContext=context!;const school=activeContext.school!;if(!activeContext.access.canSeePeopleData&&activeContext.access.accessLevel!=='super_admin'&&!activeContext.permissions.has('eleves.view'))return <Angelcare360ErrorState title="Accès aux personnes verrouillé" description="Votre rôle ne permet pas encore d’accéder au cockpit des dossiers humains." actionLabel="Retour au cockpit" actionHref="/angelcare-360-command-center"/>;const [overview,signals]=await Promise.all([getAngelcare360PeopleOverview({schoolId:school.id}),getAngelcare360FoundationSignals()]);if(!overview)return <Angelcare360ErrorState title="Vue d’ensemble indisponible" description="Aucun établissement actif n’a pu être résolu pour alimenter le cockpit des personnes." actionLabel="Retour au cockpit" actionHref="/angelcare-360-command-center"/>;return <PeopleSovereignRegistry overview={overview} signals={signals} plane={plane}/>}
