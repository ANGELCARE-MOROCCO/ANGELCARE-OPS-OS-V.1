import { redirect } from 'next/navigation'
import { getAngelcare360AdmissionsOverview } from '@/lib/angelcare360/server'
import { getAngelcare360FoundationSignals } from '@/lib/angelcare360/server/customer-foundation'
import AdmissionsEnrollmentCommand from '@/components/angelcare360/customer-foundation/AdmissionsEnrollmentCommand'
import { resolveAngelcare360FoundationPlane } from '@/data/angelcare360/customer-foundation'
export const dynamic='force-dynamic'
type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}
export default async function Angelcare360AdmissionsPage({searchParams}:Props){const params=await searchParams;const plane=resolveAngelcare360FoundationPlane('admissions',typeof params?.plane==='string'?params.plane:null);const [overview,signals]=await Promise.all([getAngelcare360AdmissionsOverview(),getAngelcare360FoundationSignals()]);if(!overview)redirect('/angelcare-360-command-center');return <AdmissionsEnrollmentCommand overview={overview!} signals={signals} plane={plane}/>}
