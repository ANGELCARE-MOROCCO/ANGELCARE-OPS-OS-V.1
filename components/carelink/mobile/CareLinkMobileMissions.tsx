'use client'

import Link from 'next/link'
import type { MissionControlRecord } from '@/lib/missions/types'

function lifecycleLabel(value: string) {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    assigned: 'Assignée',
    confirmed: 'Confirmée',
    in_progress: 'En cours',
    report_pending: 'Rapport attendu',
    report_submitted: 'Rapport soumis',
    completed: 'Terminée',
    incident: 'Incident',
    cancelled: 'Annulée',
    closed: 'Clôturée',
  }
  return labels[value] || String(value || '—').replaceAll('_', ' ')
}

function reportLabel(value: string) {
  const labels: Record<string, string> = {
    not_required: 'Non requis',
    pending: 'En attente',
    submitted: 'Soumis',
    needs_correction: 'À corriger',
    validated: 'Validé',
  }
  return labels[value] || String(value || '—').replaceAll('_', ' ')
}

export function CareLinkMobileMissions({ records }: { records: MissionControlRecord[] }) {
  return (
    <main className="min-h-dvh bg-slate-50 pb-24 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">CareLink mobile</div>
        <h1 className="mt-1 text-2xl font-black">Mes missions</h1>
        <p className="text-sm text-slate-500">Sessions terrain et sous-missions assignées.</p>
      </header>

      <section className="space-y-4 p-5">
        {records.map((item) => (
          <Link key={item.id} href={`/carelink/missions/${item.id}`} className="block rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase text-blue-600">{item.code}</div>
                <h2 className="mt-1 text-lg font-black">{item.serviceType}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.familyName}</p>
              </div>
              <span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{lifecycleLabel(item.lifecycleStage)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Info label="Date" value={item.dateLabel} />
              <Info label="Horaire" value={item.timeLabel} />
              <Info label="Zone" value={`${item.city} · ${item.zone}`} />
              <Info label="Rapport" value={reportLabel(item.reportStatus)} />
            </div>
          </Link>
        ))}

        {!records.length && <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">Aucune mission terrain trouvée.</div>}
      </section>

      <BottomNav />
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-30 grid grid-cols-3 rounded-[2rem] border border-slate-200 bg-white p-2 text-center text-xs font-black shadow-2xl">
      <Link className="rounded-2xl bg-blue-600 py-3 text-white" href="/carelink/missions">Missions</Link>
      <Link className="py-3 text-slate-500" href="/carelink/schedule">Planning</Link>
      <Link className="py-3 text-slate-500" href="/carelink/profile">Profil</Link>
    </nav>
  )
}
