import { redirect } from 'next/navigation'
import { getMaterialSnapshot } from '@/lib/angelcare360/server/inventory-material-command'
import { SanilaMaterialCommand } from '@/components/angelcare360/material-command/SanilaMaterialCommand'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'
export default async function InventairePage(){
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/inventaire');const snapshot=await getMaterialSnapshot();if(!snapshot)redirect('/angelcare-360-command-center');return <SanilaMaterialCommand snapshot={snapshot}/>}
