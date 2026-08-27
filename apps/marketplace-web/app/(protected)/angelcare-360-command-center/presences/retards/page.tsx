import { redirect } from 'next/navigation'
import LateArrivalCommand from '@/components/angelcare360/zone-b-presence/LateArrivalCommand'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360LateRecords } from '@/lib/angelcare360/server/attendance'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<{from?:string;to?:string}>}){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const q=(await searchParams)||{};const result=await listAngelcare360LateRecords({schoolId:context.school.id,from:q.from||null,to:q.to||null});const rows=Array.isArray(result)?result:[];return <LateArrivalCommand rows={rows}/>}
