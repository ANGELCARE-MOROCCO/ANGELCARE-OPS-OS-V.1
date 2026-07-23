'use client'

import { X } from 'lucide-react'
import type { RevenueCommandDefinition } from '@/lib/revenue-command-os/command-kernel/types'
import { SChip } from '../../../_components/visual-sovereignty/SovereignPrimitives'

export default function CommandDossier({ command, close }: { command: RevenueCommandDefinition; close: () => void }) {
  const groups: Array<[string, string[], 'blue' | 'emerald' | 'rose' | 'violet' | 'amber']> = [
    ['Contextes requis', command.requiredContext.map((item) => item.label), 'blue'],
    ['Outils autorisés', command.toolPermissions.filter((item) => item.allowed).map((item) => item.toolCode), 'emerald'],
    ['Outils interdits', command.toolPermissions.filter((item) => !item.allowed).map((item) => item.toolCode), 'rose'],
    ['Validateurs', command.validatorChain, 'violet'],
    ['Cas prohibés', command.prohibitedCases, 'rose'],
    ['Résultats attendus', command.expectedOutcomes, 'amber'],
  ]
  return <div className="fixed inset-0 z-[140] bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6" onMouseDown={close} role="presentation">
    <section className="mx-auto h-full max-w-[1500px] overflow-y-auto rounded-[42px] bg-white shadow-[0_40px_130px_rgba(15,23,42,.35)]" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="command-dossier-title">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
        <div><div className="flex flex-wrap items-center gap-2"><SChip tone="violet">{command.commandCode}</SChip><SChip tone={command.status === 'approved' ? 'emerald' : 'amber'}>{command.status}</SChip><SChip tone={command.approvalClass === 'prohibited' ? 'rose' : 'blue'}>{command.approvalClass}</SChip></div><h2 id="command-dossier-title" className="mt-3 text-3xl font-black tracking-[-.045em] text-slate-950">{command.name}</h2></div>
        <button type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200" aria-label="Fermer"><X size={19} /></button>
      </div>
      <div className="grid gap-7 p-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-5"><section className="rounded-[32px] bg-slate-950 p-6 text-white"><p className="text-[9px] font-black uppercase tracking-[.15em] text-violet-300">Finalité</p><p className="mt-4 text-lg font-bold leading-8 text-white">{command.purpose}</p><div className="mt-6 grid grid-cols-2 gap-3"><DossierFact label="Version" value={command.activeVersion} /><DossierFact label="Owner" value={command.ownerRole} /><DossierFact label="Règles" value={String(command.eligibilityRules.length)} /><DossierFact label="Retry max" value={String(command.retryPolicy.maxAttempts)} /></div></section>
          <section className="rounded-[32px] border border-slate-200 p-6"><h3 className="text-sm font-black text-slate-950">Architecture de décision</h3><div className="mt-5 space-y-4">{['Déclencheur', 'Éligibilité', 'Contexte', 'Permission', 'Approbation', 'Résultat'].map((stage, index) => <div key={stage} className="flex items-center gap-4"><span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-[9px] font-black text-violet-700">{index + 1}</span><div className="h-px flex-1 bg-slate-100" /><span className="w-24 text-[10px] font-black text-slate-700">{stage}</span></div>)}</div></section></div>
        <div className="grid content-start gap-4 sm:grid-cols-2">{groups.map(([label, items, tone]) => <section key={label} className="rounded-[30px] border border-slate-200 p-5"><h3 className="text-xs font-black text-slate-950">{label}</h3><div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <SChip key={item} tone={tone}>{item}</SChip>)}{!items.length ? <span className="text-[10px] font-semibold text-slate-500">Aucun élément déclaré.</span> : null}</div></section>)}</div>
      </div>
    </section>
  </div>
}

function DossierFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.07] p-3"><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-300">{label}</p><p className="mt-1 truncate text-sm font-black text-white">{value}</p></div>
}
