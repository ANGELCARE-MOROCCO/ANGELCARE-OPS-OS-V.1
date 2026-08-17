import { notFound } from 'next/navigation'
import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { RouteOperationsChamber } from '@/components/angelcare360/transport-command/TransportViews'
import { getTransportRouteDossier } from '@/lib/angelcare360/server/transport-mobility-command'
export default async function CircuitPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const dossier=await getTransportRouteDossier(id);if(!dossier)notFound();return <TransportCommandShell schoolName={dossier.snapshot.schoolName} title="Circuit" subtitle="Route Operations Chamber · séquence, flotte, élèves et courses"><RouteOperationsChamber {...dossier}/></TransportCommandShell>}
