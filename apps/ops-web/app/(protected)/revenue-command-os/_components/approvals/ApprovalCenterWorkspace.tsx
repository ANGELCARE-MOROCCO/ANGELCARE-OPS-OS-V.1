'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  UserRoundCheck,
  XCircle,
} from 'lucide-react'

import { fetchRevenueOsJson, publicRevenueOsClientMessage } from '@/lib/revenue-command-os/client-http'
import type { ApprovalDeskAction, ApprovalDeskItem } from '@/lib/revenue-command-os/approvals/types'
import { SChip, SEmpty, SMetric, STraceLink } from '../visual-sovereignty/SovereignPrimitives'
import ApprovalsHero from '../hero-sovereignty/heroes/ApprovalsHero'

const statusLabels: Record<string, string> = {
  awaiting_executive_review: 'Décision requise',
  under_review: 'Sous revue',
  evidence_requested: 'Correction demandée',
  reanalysis_requested: 'Nouvelle analyse demandée',
  amendment_requested: 'Amendement demandé',
  conditional_approval: 'Approuvée sous conditions',
  approved: 'Approuvée',
  rejected: 'Refusée',
  ready_for_mz13: 'Prête pour compilation',
  archived: 'Archivée',
  reopened: 'Rouverte',
}

function statusTone(status: string): 'amber' | 'emerald' | 'rose' | 'blue' | 'slate' {
  if (status === 'rejected') return 'rose'
  if (status === 'approved' || status === 'ready_for_mz13') return 'emerald'
  if (status === 'evidence_requested' || status === 'reanalysis_requested' || status === 'amendment_requested') return 'blue'
  if (status === 'archived') return 'slate'
  return 'amber'
}

export default function ApprovalCenterWorkspace() {
  const [items, setItems] = useState<ApprovalDeskItem[]>([])
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('')
  const [conditionsText, setConditionsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<ApprovalDeskAction | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selected = useMemo(
    () => items.find((item) => item.strategyId === selectedStrategyId) || items[0],
    [items, selectedStrategyId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const envelope = await fetchRevenueOsJson<ApprovalDeskItem[]>(
        '/api/revenue-command-os/approvals',
        { cache: 'no-store' },
        { fallbackMessage: 'Le bureau des décisions ne peut pas être chargé.' },
      )
      const nextItems = envelope.data || []
      setItems(nextItems)
      setSelectedStrategyId((current) => nextItems.some((item) => item.strategyId === current) ? current : nextItems[0]?.strategyId || '')
    } catch (loadError) {
      setError(publicRevenueOsClientMessage(loadError instanceof Error ? loadError.message : String(loadError)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setConditionsText(selected?.conditionsText || '')
  }, [selected?.strategyId, selected?.conditionsText])

  const decide = useCallback(async (action: ApprovalDeskAction) => {
    if (!selected || !selected.canDecide || submitting) return

    const labels: Record<ApprovalDeskAction, string> = {
      approve: 'approuver ce dossier sous les conditions indiquées',
      request_correction: 'demander une correction et des preuves complémentaires',
      reject: 'refuser définitivement ce dossier',
    }
    if (!window.confirm(`Confirmer : ${labels[action]} ?\n\nAucune action commerciale externe ne sera exécutée.`)) return

    setSubmitting(action)
    setError('')
    setNotice('')
    try {
      const reason = action === 'approve'
        ? `Décision exécutive enregistrée depuis le Bureau des décisions. Conditions : ${conditionsText || 'aucune condition additionnelle'}`
        : action === 'request_correction'
          ? `Correction demandée depuis le Bureau des décisions. ${conditionsText || 'Le dossier doit être complété avant nouvelle décision.'}`
          : 'Dossier refusé par l’autorité de décision depuis le Bureau des décisions.'

      await fetchRevenueOsJson(
        `/api/revenue-command-os/approvals/${selected.strategyId}/decision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({
            action,
            strategyVersion: selected.strategyVersion,
            reason,
            conditionsText,
            approvalClass: selected.approvalClass,
          }),
        },
        { fallbackMessage: 'La décision n’a pas pu être enregistrée.' },
      )

      setNotice(action === 'approve'
        ? 'Décision enregistrée. Le dossier reste sans effet externe et poursuit son circuit gouverné.'
        : action === 'request_correction'
          ? 'Demande de correction enregistrée et auditée.'
          : 'Refus enregistré et audité.')
      await load()
    } catch (decisionError) {
      setError(publicRevenueOsClientMessage(decisionError instanceof Error ? decisionError.message : String(decisionError)))
    } finally {
      setSubmitting(null)
    }
  }, [conditionsText, load, selected, submitting])

  const pendingCount = items.filter((item) => item.canDecide).length

  return <div className="min-h-screen bg-[#f8f7f4] px-4 py-7 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1740px]">
      <ApprovalsHero
        state={loading ? 'INITIALIZING' : error ? 'DEGRADED' : items.length ? 'LIVE' : 'EMPTY'}
        posture="Autorité humaine gouvernée"
        authority={selected?.canDecide ? 'Managing Director · décision éligible' : 'Autorité interne · état protégé'}
        summary={loading ? 'Le registre des décisions est en cours de chargement.' : error ? 'Le registre live ne peut pas être chargé; aucune décision n’est présentée comme disponible.' : selected ? `${selected.title} · ${statusLabels[selected.status] || selected.status}. Complétude ${selected.completeness}%.` : 'Le registre est accessible et sain, mais aucun dossier ne requiert actuellement une décision exécutive.'}
        metrics={[
          { label: 'Décisions à traiter', value: loading || error ? '—' : pendingCount, note: 'Autorité humaine obligatoire', tone: 'amber' },
          { label: 'Sous conditions', value: loading || error ? '—' : items.filter((item) => item.status === 'conditional_approval').length, note: 'Décisions conditionnelles', tone: 'blue' },
          { label: 'Corrections', value: loading || error ? '—' : items.filter((item) => ['evidence_requested','reanalysis_requested','amendment_requested'].includes(item.status)).length, note: 'Compléments requis', tone: 'violet' },
          { label: 'Refusés', value: loading || error ? '—' : items.filter((item) => item.status === 'rejected').length, note: 'États finaux', tone: 'rose' },
        ]}
        actions={[{ label: loading ? 'Chargement…' : 'Actualiser le registre', onClick: () => void load(), disabled: loading, reason: loading ? 'Le registre est déjà en cours de chargement.' : undefined, kind: 'primary' }]}
        warning={error || 'L’approbation reste une décision interne réelle, auditée et idempotente; aucun effet commercial externe n’est déclenché.'}
      />

      {error ? <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><span className="flex-1">{error}</span><button type="button" onClick={() => void load()} className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-black">Réessayer</button></div> : null}
      {notice ? <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><CheckCircle2 className="mt-0.5 shrink-0" size={17} />{notice}</div> : null}

      {loading ? <div className="mt-8 grid min-h-[520px] place-items-center rounded-[36px] border border-slate-200 bg-white"><div className="text-center"><Loader2 className="mx-auto animate-spin text-blue-700" size={32} /><p className="mt-4 text-sm font-black text-slate-800">Chargement des dossiers de décision live…</p></div></div> : null}

      {!loading && !items.length ? <div className="mt-8"><SEmpty title="Aucune décision stratégique éligible" description="Le registre est accessible et sain, mais aucune stratégie validée par le Conseil ne requiert actuellement une décision exécutive." action={<button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white"><RefreshCw size={15} /> Actualiser</button>} /></div> : null}

      {!loading && selected ? <div className="mt-8 grid min-h-[740px] gap-5 xl:grid-cols-[330px_minmax(0,1fr)_380px]">
        <aside className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,.06)]">
          <div className="flex items-center justify-between px-3 pt-2"><p className="text-[10px] font-black uppercase tracking-[.17em] text-slate-400">File de décision</p><button type="button" onClick={() => void load()} title="Actualiser" className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><RefreshCw size={14} /></button></div>
          <div className="mt-4 space-y-2">{items.map((item) => {
            const active = item.strategyId === selected.strategyId
            return <button type="button" key={item.strategyId} onClick={() => setSelectedStrategyId(item.strategyId)} className={`w-full rounded-[22px] p-4 text-left transition ${active ? 'bg-slate-950 text-white shadow-xl' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`}>
              <div className="flex items-center justify-between"><span className={`text-[9px] font-black uppercase tracking-[.12em] ${active ? 'text-amber-300' : 'text-amber-700'}`}>{item.category}</span><span className={`h-2 w-2 rounded-full ${item.risk === 'Élevé' ? 'bg-rose-500' : item.canDecide ? 'bg-amber-400' : 'bg-emerald-500'}`} /></div>
              <h3 className="mt-2 text-sm font-black leading-5">{item.title}</h3>
              <p className={`mt-2 text-[10px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>{statusLabels[item.status] || item.status} · {item.deadline}</p>
            </button>
          })}</div>
        </aside>

        <main className="relative overflow-hidden rounded-[36px] border border-amber-200 bg-white shadow-[0_28px_80px_rgba(120,53,15,.08)]">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-white p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700">Dossier live · {selected.code} · v{selected.strategyVersion}</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{selected.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Décision exécutive liée à une stratégie validée par le Conseil et conservée dans le registre Revenue OS.</p></div><SChip tone={statusTone(selected.status)}>{statusLabels[selected.status] || selected.status}</SChip></div></div>
          <div className="p-7"><div className="grid gap-4 md:grid-cols-3"><DecisionFact icon={CircleDollarSign} label="Impact" value={selected.impact} /><DecisionFact icon={ShieldAlert} label="Risque" value={selected.risk} /><DecisionFact icon={Clock3} label="Échéance" value={selected.deadline} /></div>
            <div className="mt-7 grid gap-6 lg:grid-cols-2"><DecisionNarrative title="Pourquoi maintenant" text={selected.whyNow} /><DecisionNarrative title="Ce qui sera autorisé" text={selected.authorizedScope} /><DecisionNarrative title="Alternative" text={selected.alternative} /><DecisionNarrative title="Condition de sortie" text={selected.exitCondition} /></div>
            <div className="mt-7 rounded-[26px] border border-slate-200 bg-slate-50 p-5"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.12em] text-slate-600">Complétude du dossier</p><span className="text-2xl font-black text-slate-950">{selected.completeness}%</span></div><div className="mt-3 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${selected.completeness}%` }} /></div><div className="mt-4 grid gap-2 md:grid-cols-2"><DecisionCheck label="Conseil stratégique validé" /><DecisionCheck label="Périmètre tenant résolu" /><DecisionCheck label="Décision auditée" /><DecisionCheck label="Effets externes bloqués" /></div></div>
          </div>
        </main>

        <aside className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,.06)]">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">Autorité de décision</p><h2 className="mt-2 text-xl font-black text-slate-950">Managing Director</h2><p className="mt-2 text-xs leading-5 text-slate-500">Décision conditionnelle, tracée et limitée au dossier sélectionné.</p>
          <label className="mt-6 block text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Conditions et instructions<textarea value={conditionsText} onChange={(event) => setConditionsText(event.target.value)} disabled={!selected.canDecide || Boolean(submitting)} className="mt-2 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 disabled:cursor-not-allowed disabled:opacity-60" /></label>
          <div className="mt-5 grid gap-2">
            <DecisionButton disabled={!selected.canDecide || Boolean(submitting)} busy={submitting === 'approve'} onClick={() => void decide('approve')} tone="approve" label="Approuver avec conditions" />
            <DecisionButton disabled={!selected.canDecide || Boolean(submitting)} busy={submitting === 'request_correction'} onClick={() => void decide('request_correction')} tone="correction" label="Demander correction" />
            <DecisionButton disabled={!selected.canDecide || Boolean(submitting)} busy={submitting === 'reject'} onClick={() => void decide('reject')} tone="reject" label="Refuser" />
          </div>
          {!selected.canDecide ? <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">Ce dossier possède déjà un état final ou a quitté la file de décision. Les actions restent verrouillées pour préserver l’immuabilité.</div> : null}
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[11px] font-bold leading-5 text-blue-900">Ces boutons enregistrent une décision interne réelle. Ils ne déclenchent aucune communication externe, aucun paiement et aucune activation commerciale.</div>
          <div className="mt-6 border-t border-slate-100 pt-5"><STraceLink traceId={selected.traceId} label="Trace de décision" /></div>
        </aside>
      </div> : null}
    </section>
  </div>
}

function DecisionFact({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><Icon size={18} className="text-amber-700" /><p className="mt-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>
}

function DecisionNarrative({ title, text }: { title: string; text: string }) {
  return <div className="border-l-2 border-amber-300 pl-4"><h3 className="text-sm font-black text-slate-900">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-600">{text}</p></div>
}

function DecisionCheck({ label }: { label: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700"><CheckCircle2 size={14} className="text-emerald-600" />{label}</div>
}

function DecisionButton({ disabled, busy, onClick, tone, label }: { disabled: boolean; busy: boolean; onClick: () => void; tone: 'approve' | 'correction' | 'reject'; label: string }) {
  const styles = tone === 'approve'
    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
    : tone === 'correction'
      ? 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
      : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
  const Icon = tone === 'approve' ? CheckCircle2 : tone === 'correction' ? AlertTriangle : XCircle
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${styles}`}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Icon size={16} />}{busy ? 'Enregistrement…' : label}</button>
}
