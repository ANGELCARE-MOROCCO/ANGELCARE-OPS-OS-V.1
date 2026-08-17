import { redirect } from 'next/navigation'
import { getMaterialSnapshot } from '@/lib/angelcare360/server/inventory-material-command'
import { SanilaMaterialCommand } from '@/components/angelcare360/material-command/SanilaMaterialCommand'
export default async function InventairePage(){const snapshot=await getMaterialSnapshot();if(!snapshot)redirect('/angelcare-360-command-center');return <SanilaMaterialCommand snapshot={snapshot}/>}
