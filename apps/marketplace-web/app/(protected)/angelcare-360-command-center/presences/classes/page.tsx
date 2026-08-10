import { redirect } from 'next/navigation'
import ClassPresenceWall from '@/components/angelcare360/zone-b-presence/ClassPresenceWall'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceDayClasses } from '@/lib/angelcare360/server/attendance'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams?:Promise<{date?:string}>}){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');const q=(await searchParams)||{};const date=q.date||new Date().toISOString().slice(0,10);const rows=await listAngelcare360AttendanceDayClasses({schoolId:context.school.id,date});return <ClassPresenceWall rows={rows} date={date}/>} 
