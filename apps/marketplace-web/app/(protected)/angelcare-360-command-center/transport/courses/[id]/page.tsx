import { notFound } from 'next/navigation'
import { TransportCommandShell } from '@/components/angelcare360/transport-command/TransportCommandShell'
import { RunChamber } from '@/components/angelcare360/transport-command/TransportViews'
import { getTransportRunDossier } from '@/lib/angelcare360/server/transport-mobility-command'
export default async function RunPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const dossier=await getTransportRunDossier(id);if(!dossier)notFound();return <TransportCommandShell schoolName={dossier.snapshot.schoolName} title="Course" subtitle="Mobility Run Chamber · événements, arrêts, élèves et sécurité"><RunChamber {...dossier}/></TransportCommandShell>}
