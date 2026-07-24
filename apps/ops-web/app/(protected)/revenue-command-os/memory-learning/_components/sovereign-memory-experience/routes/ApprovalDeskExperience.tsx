'use client'

import { useMemo, useState } from 'react'
import { BadgeCheck, CheckCircle2, ClipboardCheck, FileWarning, ShieldCheck, XCircle } from 'lucide-react'
import type { RevenueKnowledgeApprovalDecision } from '@/lib/revenue-command-os/types'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryRouteMasthead, MemorySafetyBanner, MemoryStat, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { formatMemoryDate, memoryMode, memoryWarnings } from '../memory-data-mappers'

export default function ApprovalDeskExperience() {
  const { knowledge, busy, error, decideApproval } = useKnowledgeMemory()
  const [filter, setFilter] = useState('pending')
  const approvals = useMemo(() => knowledge.approvals.filter((item) => filter === 'all' || item.decision === filter), [knowledge.approvals, filter])
  const eligible = knowledge.approvals.filter((item) => item.decision === 'pending' && item.checklist.every((check) => check.passed)).length

  async function decide(id: string, decision: RevenueKnowledgeApprovalDecision) {
    const rationale = window.prompt(`Motif de la décision « ${decision} »`)
    if (!rationale) return
    await decideApproval(id, decision, rationale)
  }

  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-APPROVAL-DESK">
    <MemoryRouteMasthead eyebrow="Autorité doctrinale" title="Bureau d’approbation institutionnelle" subtitle="Décider uniquement sur la base d’une version identifiée, d’une checklist complète, d’une autorité éligible et d’une justification auditée." concept="Doctrine Approval Authority" icon={BadgeCheck} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${knowledge.counters.openApprovals} dossier(s) ouvert(s)`} secondary={{ label: 'Conflits à arbitrer', href: '/revenue-command-os/memory-learning/conflict-resolver' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Éligibles maintenant</p><p className="mt-2 text-2xl font-black text-white">{eligible}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Checklists incomplètes</p><p className="mt-2 text-2xl font-black text-white">{knowledge.approvals.filter((item) => item.decision === 'pending' && item.checklist.some((check) => !check.passed)).length}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="approval" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MemoryStat label="En attente" value={knowledge.approvals.filter((item) => item.decision === 'pending').length} note="Décisions ouvertes" tone="amber"/><MemoryStat label="Approuvés" value={knowledge.approvals.filter((item) => item.decision === 'approved').length} note="Décisions formelles" tone="emerald"/><MemoryStat label="Corrections" value={knowledge.approvals.filter((item) => item.decision === 'changes-requested').length} note="Dossiers à compléter" tone="violet"/><MemoryStat label="Rejetés" value={knowledge.approvals.filter((item) => item.decision === 'rejected').length} note="Décisions motivées" tone="rose"/></div>

    <MemoryPanel title="File de décision" eyebrow="Éligibilité réelle" icon={ClipboardCheck} tone="amber" action={<div className="flex gap-2 overflow-x-auto">{['pending','approved','changes-requested','rejected','all'].map((decision) => <button key={decision} type="button" onClick={() => setFilter(decision)} className={`shrink-0 rounded-xl px-3 py-2 text-[9px] font-black uppercase ${filter === decision ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{decision === 'all' ? 'Tous' : decision}</button>)}</div>}>
      <p className="text-xs font-semibold leading-5 text-slate-700">Un bouton de décision n’est disponible que pour un dossier encore en attente et dont tous les contrôles obligatoires sont passés.</p>
    </MemoryPanel>

    {approvals.length ? <div className="space-y-4">{approvals.map((approval) => {
      const checklistComplete = approval.checklist.every((check) => check.passed)
      const canDecide = approval.decision === 'pending' && checklistComplete
      return <article key={approval.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.055)] sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_350px]"><div><div className="flex flex-wrap items-center gap-2"><MemoryStatus status={approval.decision}/><MemoryTag tone="blue">{approval.resourceType}</MemoryTag><MemoryTag>v{approval.resourceVersion}</MemoryTag></div><p className="mt-4 text-[9px] font-black uppercase tracking-[.13em] text-slate-600">{approval.code} · {approval.resourceCode}</p><h2 className="mt-2 text-xl font-black text-slate-950">Dossier de décision — {approval.resourceCode}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Demandé par" value={approval.requestedBy}/><Info label="Autorité requise" value={approval.requiredApproverRole}/><Info label="Soumis le" value={formatMemoryDate(approval.requestedAt)}/><Info label="Décidé le" value={formatMemoryDate(approval.decidedAt)}/></div>{approval.rationale ? <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-[9px] font-black uppercase text-blue-800">Motivation</p><p className="mt-2 text-[11px] font-semibold leading-5 text-blue-950">{approval.rationale}</p></div> : null}</div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase text-slate-600">Checklist d’autorité</p><MemoryTag tone={checklistComplete ? 'emerald' : 'amber'}>{checklistComplete ? 'Complète' : 'Incomplète'}</MemoryTag></div><div className="mt-3 space-y-2">{approval.checklist.map((check) => <div key={check.key} className={`flex items-start gap-3 rounded-2xl border p-3 ${check.passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>{check.passed ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700"/> : <FileWarning size={16} className="mt-0.5 shrink-0 text-rose-700"/>}<p className="text-[10px] font-black leading-4 text-slate-900">{check.label}</p></div>)}</div></div></div>
        {approval.decision === 'pending' ? <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><p className="text-[10px] font-semibold text-slate-700">{checklistComplete ? 'Dossier éligible à une décision réelle.' : 'Action verrouillée : checklist obligatoire incomplète.'}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void decide(approval.id, 'changes-requested')} disabled={busy} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[9px] font-black text-amber-900 disabled:opacity-45">Demander correction</button><button type="button" onClick={() => void decide(approval.id, 'rejected')} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-[9px] font-black text-rose-900 disabled:opacity-45"><XCircle size={14}/>Rejeter</button><button type="button" onClick={() => void decide(approval.id, 'approved')} disabled={busy || !canDecide} title={!canDecide ? 'Checklist incomplète ou décision déjà prise.' : undefined} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-[9px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"><ShieldCheck size={14}/>Approuver</button></div></div> : null}
      </article>
    })}</div> : <MemoryEmpty title="Aucun dossier dans cette vue" description="La file est saine. Aucun résultat d’approbation n’est fabriqué pour remplir l’espace." />}
    <MemorySafetyBanner detail="Chaque décision utilise le workflow d’approbation existant. Aucune éligibilité, autorité ou approbation n’est simulée par le frontend." />
  </div>
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-[10px] font-black text-slate-900">{value}</p></div> }
