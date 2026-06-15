'use client'
import type { MissionDossier } from '@/lib/missions/types'

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    assigned: 'Mission assignée',
    agent_notified: 'Agent notifié',
    agent_accepted: 'Acceptée par l’agent',
    confirmed: 'Confirmée',
    confirmed_by_dispatch: 'Confirmée par le dispatch',
    en_route: 'En route',
    arrived: 'Arrivée confirmée',
    arrival_confirmed: 'Arrivée confirmée',
    mission_started: 'Mission démarrée',
    in_progress: 'En cours',
    report_submitted: 'Rapport soumis',
    completed: 'Terminée',
    incident: 'Incident signalé',
    incident_reported: 'Incident signalé',
    cancelled: 'Annulée',
    closed: 'Clôturée',
  }
  return labels[eventType] || eventType.replaceAll('_', ' ')
}

export function CareLinkMobileMissionDetail({ dossier }: { dossier: MissionDossier | null }) {
  if (!dossier) return <main className="grid min-h-dvh place-items-center bg-slate-50 p-6 text-center"><div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">Mission introuvable ou non disponible.</div></main>
  const mission = dossier.mission
  async function action(path: string) { await fetch(`/api/carelink/missions/${mission.id}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: `Action mobile ${path}` }) }); location.reload() }
  return <main className="min-h-dvh bg-slate-50 pb-24 text-slate-950"><header className="bg-white p-5"><div className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Session terrain</div><h1 className="mt-2 text-2xl font-black">{mission.code}</h1><p className="text-sm text-slate-500">{mission.serviceType} · {mission.familyName}</p></header><section className="space-y-4 p-5"><Card title="Mission"><Info label="Statut" value={mission.lifecycleStage} /><Info label="Date" value={mission.dateLabel} /><Info label="Horaire" value={mission.timeLabel} /><Info label="Zone" value={`${mission.city} · ${mission.zone}`} /></Card><Card title="Consignes"><p className="text-sm text-slate-600">Les consignes opérationnelles proviennent du dossier de mission et de l’ordre de mission. Aucun contenu de démonstration n’est affiché.</p></Card><Card title="Actions terrain"><div className="grid gap-2"><button onClick={() => action('transition')} className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white">Mettre à jour le statut</button><button onClick={() => action('report')} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white">Soumettre le rapport</button><button onClick={() => action('incident')} className="rounded-2xl bg-rose-50 px-4 py-3 font-black text-rose-700">Déclarer un incident</button></div></Card><Card title="Historique"><div className="space-y-2">{dossier.events.map((event, index) => <div key={index} className="rounded-2xl bg-slate-50 p-3"><b className="text-sm">{eventLabel(event.event_type)}</b><p className="text-xs text-slate-500">{event.content}</p></div>)}{!dossier.events.length && <p className="text-sm font-bold text-slate-400">Aucun événement en direct.</p>}</div></Card></section></main>
}
function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-3 text-lg font-black">{title}</h2>{children}</section> }
function Info({ label, value }: { label: string; value: string }) { return <div className="mb-2 flex justify-between gap-4 text-sm"><span className="text-slate-500">{label}</span><b className="text-right">{value}</b></div> }
