import { notFound } from 'next/navigation'
import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { DriverDossier } from '@/components/angelcare360/transport-command/TransportViews'
import { getTransportDriverDossier } from '@/lib/angelcare360/server/transport-mobility-command'
export default async function DriverPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const dossier=await getTransportDriverDossier(id);if(!dossier)notFound();return <TransportCommandShell schoolName={dossier.snapshot.schoolName} title="Chauffeur" subtitle="Driver Readiness Dossier · permis, circuits, sécurité et courses"><DriverDossier {...dossier}/></TransportCommandShell>}
