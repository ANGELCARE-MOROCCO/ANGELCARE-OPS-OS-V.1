import { redirect } from 'next/navigation'
import { getAngelcare360AdministrationContext } from '@/lib/angelcare360/server'
import { getAngelcare360FoundationSignals } from '@/lib/angelcare360/server/customer-foundation'
import InstitutionalGovernanceCommand from '@/components/angelcare360/customer-foundation/InstitutionalGovernanceCommand'
import { resolveAngelcare360FoundationPlane } from '@/data/angelcare360/customer-foundation'
export const dynamic='force-dynamic'
type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}
export default async function Angelcare360AdministrationPage({searchParams}:Props){const params=await searchParams;const plane=resolveAngelcare360FoundationPlane('governance',typeof params?.plane==='string'?params.plane:null);const [state,signals]=await Promise.all([getAngelcare360AdministrationContext(),getAngelcare360FoundationSignals()]);if(!state?.context?.school||!state.overview)redirect('/angelcare-360-command-center');return <InstitutionalGovernanceCommand overview={state!.overview!} signals={signals} plane={plane}/>}
