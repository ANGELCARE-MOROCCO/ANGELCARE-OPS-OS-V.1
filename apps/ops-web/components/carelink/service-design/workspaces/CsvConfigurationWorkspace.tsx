'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, RotateCcw, ShieldCheck, UploadCloud } from 'lucide-react'
import type { ConfigurationImport } from '@/types/homeservice-design'
import { Badge, EmptyState, MetricCard, Panel, WorkspaceTitle } from '../DesignSystem'
import { CsvImportAction } from '../MutationPanels'

async function rollbackImport(id: string, reason: string) {
  const response = await fetch(`/api/carelink-ops/service-design/imports/${id}/rollback`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'Échec du rollback du lot.')
  return payload
}

async function commitImport(id: string, reason: string) {
  const response = await fetch(`/api/carelink-ops/service-design/imports/${id}/commit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'Échec de validation du lot.')
  return payload
}

function statusTone(status: string) {
  if (status === 'committed') return 'emerald' as const
  if (status === 'rejected') return 'rose' as const
  if (status === 'partially_valid') return 'amber' as const
  if (status === 'validated') return 'blue' as const
  return 'slate' as const
}

export function CsvConfigurationWorkspace({ imports }: { imports: ConfigurationImport[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const pending = imports.filter((item) => ['staged', 'validated', 'partially_valid'].includes(item.status))
  async function rollback(item: ConfigurationImport) {
    const reason = window.prompt('Motif du rollback (obligatoire):', 'Correction contrôlée du lot importé.')
    if (!reason || reason.trim().length < 8) return
    setBusy(item.id); setMessage(null)
    try { const result = await rollbackImport(item.id, reason); setMessage(`Lot ${item.fileName}: ${result.data?.restored || 0} changement(s) restauré(s).`); router.refresh() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Échec du rollback.') }
    finally { setBusy(null) }
  }
  async function commit(item: ConfigurationImport) {
    const reason = window.prompt('Motif de validation du lot (obligatoire):', 'Lot contrôlé et conforme à la doctrine HomeService.')
    if (!reason || reason.trim().length < 5) return
    setBusy(item.id); setMessage(null)
    try { const result = await commitImport(item.id, reason); setMessage(`Lot ${item.fileName}: ${result.data?.committed || 0} ligne(s) appliquée(s).`); router.refresh() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Échec.') }
    finally { setBusy(null) }
  }
  return <div className="space-y-6"><WorkspaceTitle eyebrow="Configuration sans intervention technique" title="CSV Configuration Command" description="Importe catégories, doctrine, capacité, fonctions, options, activités, compétences, risques, checklists, rapports et prix dans un circuit contrôlé de staging, validation, décision et audit." actions={<CsvImportAction />} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricCard label="Lots enregistrés" value={imports.length} detail="Sources et checksums conservés" icon={<FileSpreadsheet size={18} />} /><MetricCard label="À décider" value={pending.length} detail="Staged, validés ou partiellement valides" tone="amber" icon={<ShieldCheck size={18} />} /><MetricCard label="Appliqués" value={imports.filter((item) => item.status === 'committed').length} detail="Lots commités avec audit" tone="emerald" icon={<CheckCircle2 size={18} />} /><MetricCard label="Lignes invalides" value={imports.reduce((sum, item) => sum + item.invalidRows, 0)} detail="Jamais ignorées silencieusement" tone="rose" icon={<AlertTriangle size={18} />} /></section>
    {message ? <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">{message}</div> : null}
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]"><Panel title="Import Staging Grid" subtitle="Chaque lot conserve sa source, son checksum, ses volumes et son état de décision.">{imports.length ? <div className="space-y-3">{imports.map((item) => <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><FileSpreadsheet size={20} /></div><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">{item.importType}</p><h3 className="mt-1 text-sm font-black text-slate-950">{item.fileName}</h3><p className="mt-1 text-[10px] font-semibold text-slate-500">Checksum {item.checksum.slice(0, 16)}… · {item.createdBy}</p></div></div><Badge tone={statusTone(item.status)}>{item.status}</Badge></div><div className="mt-5 grid grid-cols-4 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-3"><strong className="block text-lg font-black">{item.totalRows}</strong><span className="text-[8px] font-black uppercase text-slate-400">Total</span></div><div className="rounded-xl bg-emerald-50 p-3"><strong className="block text-lg font-black text-emerald-800">{item.validRows}</strong><span className="text-[8px] font-black uppercase text-emerald-600">Valides</span></div><div className="rounded-xl bg-rose-50 p-3"><strong className="block text-lg font-black text-rose-800">{item.invalidRows}</strong><span className="text-[8px] font-black uppercase text-rose-600">Invalides</span></div><div className="rounded-xl bg-amber-50 p-3"><strong className="block text-lg font-black text-amber-800">{item.duplicateRows}</strong><span className="text-[8px] font-black uppercase text-amber-600">Doublons</span></div></div>{['validated','partially_valid'].includes(item.status) ? <div className="mt-4 flex justify-end"><button disabled={busy === item.id || item.validRows === 0} onClick={() => void commit(item)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><ShieldCheck size={14} />{busy === item.id ? 'Application…' : 'Décider & appliquer les lignes valides'}</button></div> : null}{(item.status === 'committed' || item.committedRows > 0) ? <div className="mt-4 flex justify-end"><button disabled={busy === item.id} onClick={() => void rollback(item)} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-800 disabled:opacity-50"><RotateCcw size={14} />{busy === item.id ? 'Restauration…' : 'Rollback contrôlé'}</button></div> : null}</article>)}</div> : <EmptyState title="Aucun lot importé" detail="Téléchargez un modèle CSV, préparez vos lignes puis utilisez Importer CSV. Aucune configuration ne sera appliquée avant décision." />}</Panel>
      <div className="space-y-6"><Panel title="Import Doctrine" subtitle="Règles non négociables du pipeline."><div className="space-y-3">{['Source originale conservée', 'Checksum SHA-256', 'En-têtes validés', 'Doublons signalés', 'Lignes invalides visibles', 'Dry run avant commit', 'Décision humaine', 'Audit & rollback contractuel'].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">{index + 1}</div><p className="text-xs font-black text-slate-700">{item}</p></div>)}</div></Panel><Panel title="Templates opérationnels" subtitle="Douze structures CSV prêtes."><div className="grid grid-cols-2 gap-2">{['service_categories','doctrine_rules','capacity_rules','features','topups','upsells','activities','competencies','risks','checklists','report_fields','pricing'].map((type) => <a key={type} href={`/csv-templates/homeservice-design/${type}.csv`} download className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 hover:border-blue-200 hover:text-blue-700"><UploadCloud size={13} />{type}</a>)}</div></Panel><Panel title="Rollback posture" subtitle="UMZ1 préserve l’autorité de correction."><div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><RotateCcw className="mt-0.5 shrink-0 text-amber-700" size={17} /><p className="text-xs font-semibold leading-5 text-amber-800">Chaque changement commité conserve son état avant/après. Le rollback restaure les mises à jour et supprime les créations dans l’ordre inverse, avec motif, autorité et audit.</p></div></Panel></div>
    </section>
  </div>
}
