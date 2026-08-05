'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { loadMastery } from '@/components/carelink/service-design/mastery/client'
import type { MasteryPayload } from '@/components/carelink/service-design/mastery/types'
import { HandoffHero, Metric, StepRail, Surface } from '../HandoffUI'
import { HandoffActionConsole } from '../HandoffActionConsole'

function array(value: unknown) { return Array.isArray(value) ? value : [] }

export function TransmissionControlWorkspace({ handoffId = '' }: { handoffId?: string }) {
  const [payload, setPayload] = useState<MasteryPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(handoffId))

  useEffect(() => {
    if (!handoffId || handoffId === 'preview') { setLoading(false); return }
    let live = true
    setLoading(true); setError(null)
    loadMastery('handoff', handoffId).then((data) => { if (live) setPayload(data) }).catch((reason) => { if (live) setError(reason instanceof Error ? reason.message : String(reason)) }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [handoffId])

  const counts = useMemo(() => ({
    parent: array(payload?.related?.parentBlueprints).length,
    subMissions: array(payload?.related?.subMissions).length,
    programmes: array(payload?.related?.programmes).length,
    checklists: array(payload?.related?.checklists).length,
  }), [payload])

  if (loading) return <div className="grid min-h-[460px] place-items-center rounded-[32px] border border-slate-200 bg-white"><Loader2 className="animate-spin text-blue-600" size={30}/></div>
  if (!handoffId || handoffId === 'preview') return <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-8"><AlertTriangle className="text-amber-700"/><h1 className="mt-4 text-2xl font-black text-amber-950">Sélectionnez un handoff réel</h1><p className="mt-2 text-sm font-semibold text-amber-800">La transmission ne présente plus de chiffres de démonstration. Ouvrez un dossier depuis le registre CARELINK Bridge.</p><a href="/carelink-ops/service-design/handoffs" className="mt-5 inline-flex rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-black text-white">Ouvrir le registre</a></div>
  if (error || !payload) return <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8"><AlertTriangle className="text-rose-700"/><h1 className="mt-4 text-2xl font-black text-rose-950">Handoff impossible à charger</h1><p className="mt-2 text-sm font-semibold text-rose-800">{error || 'Dossier introuvable.'}</p></div>

  const record = payload.record
  const source = array(payload.related.sources)[0]
  return <div className="space-y-6">
    <HandoffHero eyebrow="Commit transactionnel" title="Transmission Control Room" description={`Conséquences exactes du handoff ${record.code}. Aucune valeur fictive n’est affichée avant la commande irréversible.`} seal="Atomic core · exact dossier · reconciliation"/>
    <StepRail active={3}/>
    <div className="grid gap-4 md:grid-cols-4"><Metric label="Parent" value={String(counts.parent)} detail="Blueprint parent réellement préparé."/><Metric label="Sous-missions" value={String(counts.subMissions)} detail="Blueprints datés issus du dossier." tone="violet"/><Metric label="Programmes" value={String(counts.programmes)} detail="Lignes de programme réellement projetées." tone="blue"/><Metric label="Checklists" value={String(counts.checklists)} detail="Contrôles réellement préparés." tone="emerald"/></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]"><Surface title="Consequence Preview" subtitle="Ce qui sera créé et figé à partir du dossier sélectionné."><div className="space-y-3">{[
      ['Source', source?.source_type ? `${source.source_type} · ${source.source_ref || source.id}` : `Sellable ${record.sellable_id || '—'} · Plan ${record.technical_plan_version_id || '—'}`],
      ['Snapshot', record.snapshot_hash || 'Non calculé'],
      ['Idempotency', record.idempotency_key || 'Non réservée'],
      ['Parent mission', `${counts.parent} blueprint`],
      ['Sous-missions', `${counts.subMissions} blueprint(s)`],
      ['Projection', `${counts.programmes} programmes · ${counts.checklists} checklists`],
      ['Affectation', 'Aucune affectation terrain créée par Service Design'],
      ['Rollback', 'Transaction core complète ou aucune création'],
    ].map(([a,b]) => <div key={a} className="flex items-center justify-between gap-5 rounded-2xl bg-slate-50 px-4 py-3"><span className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{a}</span><b className="max-w-[70%] break-words text-right text-xs text-slate-900">{b}</b></div>)}</div></Surface><div className="space-y-4"><HandoffActionConsole handoffId={handoffId} action="preflight" label="Relancer le préflight" permissionHint="run_handoff_preflight"/><HandoffActionConsole handoffId={handoffId} action="commit" label="Créer dans CARELINK" permissionHint="commit_carelink_handoffs" tone="emerald"/><HandoffActionConsole handoffId={handoffId} action="reconcile" label="Réconcilier les dossiers" permissionHint="reconcile_handoffs" tone="blue"/></div></div>
  </div>
}
