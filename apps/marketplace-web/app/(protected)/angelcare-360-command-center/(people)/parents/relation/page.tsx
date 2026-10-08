import { redirect } from 'next/navigation'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export default async function Page(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/parents/relation');redirect('/angelcare-360-command-center/relation-parents?view=today')}
