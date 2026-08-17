import { notFound } from 'next/navigation'
import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { VehicleDossier } from '@/components/angelcare360/transport-command/TransportViews'
import { getTransportVehicleDossier } from '@/lib/angelcare360/server/transport-mobility-command'
export default async function VehiclePage({params}:{params:Promise<{id:string}>}){const{id}=await params;const dossier=await getTransportVehicleDossier(id);if(!dossier)notFound();return <TransportCommandShell schoolName={dossier.snapshot.schoolName} title="Véhicule" subtitle="Vehicle Readiness Dossier · capacité, conformité, sécurité et courses"><VehicleDossier {...dossier}/></TransportCommandShell>}
