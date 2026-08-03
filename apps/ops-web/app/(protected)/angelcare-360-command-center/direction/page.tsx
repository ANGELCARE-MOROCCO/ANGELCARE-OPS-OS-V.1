import { redirect } from 'next/navigation'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import DirectionExecutiveCommand from '@/components/angelcare360/customer-foundation/DirectionExecutiveCommand'
import { getAngelcare360DirectionCockpitData } from '@/lib/angelcare360/server/direction'
import { getAngelcare360FoundationSignals } from '@/lib/angelcare360/server/customer-foundation'
import { resolveAngelcare360FoundationPlane } from '@/data/angelcare360/customer-foundation'

export const dynamic = 'force-dynamic'
type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}
export default async function Angelcare360DirectionPage({searchParams}:Props){
 const params=await searchParams; const plane=resolveAngelcare360FoundationPlane('direction',typeof params?.plane==='string'?params.plane:null)
 const [data,signals]=await Promise.all([getAngelcare360DirectionCockpitData(),getAngelcare360FoundationSignals()])
 if(!data)return <Angelcare360EmptyState title="Cockpit de Direction indisponible" description="Aucun établissement actif n’a pu être résolu pour afficher la vue direction." actionLabel="Retour au command center" actionHref="/angelcare-360-command-center"/>
 if(!data.school.id)redirect('/angelcare-360-command-center')
 return <DirectionExecutiveCommand data={data} signals={signals} plane={plane}/>
}
