'use client'

import { useMemo, useState } from 'react'
import { BookOpenCheck, Copy, Filter, Search, ShieldCheck } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

const hiddenTags = new Set(['commands-1000', 'commands-2000', 'commands-3000', 'mz06', 'mz07', 'mz08', 'mz09', 'new-700', 'new-1000', 'final-1000', 'golden-300', 'shadow-safe', 'authority-guarded', 'margin-guarded', 'capacity-guarded', 'evidence-guarded', 'monetization-closing'])

export default function CommandCatalogueExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('all')
  const [approval, setApproval] = useState('all')
  const families = useMemo(() => [...new Set(commands.map((command) => command.family))].sort(), [commands])
  const filtered = useMemo(() => commands.filter((command) => {
    const haystack = `${command.commandCode} ${command.name} ${command.purpose} ${command.family} ${command.ownerRole} ${command.tags.filter((tag) => !hiddenTags.has(tag)).join(' ')}`.toLowerCase()
    return (family === 'all' || command.family === family) && (approval === 'all' || command.approvalClass === approval) && haystack.includes(query.trim().toLowerCase())
  }), [approval, commands, family, query])

  return <div className="space-y-6" data-command-experience="canonical-command-registry">
    <CommandRouteMasthead
      eyebrow="Registre canonique"
      title="Catalogue des commandes"
      subtitle="Rechercher, filtrer et ouvrir chaque doctrine opérationnelle avec son autorité, sa version, son contexte et ses garde-fous."
      concept="Canonical Command Registry"
      icon={BookOpenCheck}
      mode={loading ? 'initializing' : data?.dataMode}
      warnings={warnings}
      freshness={data?.generatedAt}
      authority="3 000 canoniques · 12 anchors protégés"
      secondary={{ label: 'Voir la taxonomie', href: '/revenue-command-os/command-kernel/taxonomy' }}
    >
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Visibles" value={filtered.length} tone="violet" /><CommandStat label="Approuvées" value={commands.filter((command) => command.status === 'approved').length} tone="emerald" /><CommandStat label="Interdites" value={commands.filter((command) => command.approvalClass === 'prohibited').length} tone="rose" /></div>
    </CommandRouteMasthead>

    <CommandPanel title="Recherche institutionnelle" eyebrow="Filtres actifs" icon={Filter} tone="blue">
      <div className="grid gap-3 lg:grid-cols-[1fr_280px_240px]">
        <label className="relative"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, intention, domaine, résultat ou owner…" className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>
        <select value={family} onChange={(event) => setFamily(event.target.value)} className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-xs font-black text-slate-900 outline-none focus:border-violet-500"><option value="all">Toutes les familles</option>{families.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select value={approval} onChange={(event) => setApproval(event.target.value)} className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-xs font-black text-slate-900 outline-none focus:border-violet-500"><option value="all">Toutes les autorités</option>{[...new Set(commands.map((command) => command.approvalClass))].sort().map((value) => <option key={value} value={value}>{value}</option>)}</select>
      </div>
    </CommandPanel>

    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.06)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse">
          <thead className="bg-slate-950 text-white"><tr>{['Commande', 'Doctrine', 'Famille', 'Autorité', 'Version', 'Statut', 'Action'].map((label) => <th key={label} className="px-4 py-4 text-left text-[9px] font-black uppercase tracking-[.13em]">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((command) => <tr key={command.id} className="group transition hover:bg-violet-50/55">
              <td className="px-4 py-4"><button type="button" onClick={() => selectCommand(command)} className="text-left"><p className="font-mono text-[11px] font-black text-violet-700">{command.commandCode}</p><p className="mt-1 max-w-[260px] text-xs font-black text-slate-950">{command.name}</p></button></td>
              <td className="max-w-[340px] px-4 py-4 text-[11px] font-semibold leading-5 text-slate-600">{command.purpose}</td>
              <td className="px-4 py-4"><SChip tone="blue">{command.family}</SChip></td>
              <td className="px-4 py-4"><SChip tone={command.approvalClass === 'prohibited' ? 'rose' : command.approvalClass === 'executive' ? 'amber' : 'violet'}>{command.approvalClass}</SChip></td>
              <td className="px-4 py-4 font-mono text-[11px] font-black text-slate-800">{command.activeVersion}</td>
              <td className="px-4 py-4"><SChip tone={command.status === 'approved' ? 'emerald' : command.status === 'blocked' ? 'rose' : 'amber'}>{command.status}</SChip></td>
              <td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => selectCommand(command)} className="rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-black uppercase tracking-[.1em] text-white">Ouvrir</button><button type="button" onClick={() => void navigator.clipboard?.writeText(command.commandCode)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600" aria-label={`Copier ${command.commandCode}`}><Copy size={15} /></button></div></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!filtered.length ? <div className="p-6"><CommandEmpty title="Aucune commande correspondante" description="La source est disponible, mais aucun dossier ne correspond aux filtres actifs. Retirez un filtre ou élargissez la recherche." /></div> : null}
    </section>

    <div className="grid gap-4 lg:grid-cols-3"><CommandStat label="Définitions contractuelles" value={3012} note="3 000 canoniques + 12 anchors" tone="violet" /><CommandStat label="Dérive" value={data?.driftCount ?? '—'} note="Aucune réparation automatique" tone={data?.driftCount ? 'amber' : 'emerald'} /><CommandStat label="Effets externes" value="0" note="Mode Shadow verrouillé" tone="cyan" /></div>
  </div>
}
