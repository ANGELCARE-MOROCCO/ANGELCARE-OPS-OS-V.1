'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Clock3, Edit3,
  FileCheck2, Fingerprint, LibraryBig, LockKeyhole, Save, Shield, Tags,
} from 'lucide-react'
import type { RevenueDoctrine } from '@/lib/revenue-command-os/types'
import {
  DrawerActionFooter, DrawerBadge, DrawerCloseButton, DrawerExecutiveBrief, DrawerMetric,
  DrawerPrimaryAction, DrawerSecondaryAction, DrawerSection, SovereignDrawerOverlay,
  SovereignDrawerPanel, drawerStyles,
} from '../../_components/drawer-sovereignty/DrawerPrimitives'
import { useKnowledgeMemory } from './KnowledgeMemoryContext'

function statusTone(status: string) {
  if (status === 'effective') return 'emerald' as const
  if (status === 'approved') return 'blue' as const
  if (status === 'in-review') return 'amber' as const
  if (status === 'rejected' || status === 'suspended') return 'rose' as const
  return 'slate' as const
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('fr-FR') : 'À définir'
}

export default function DoctrineDrawer({ doctrine, onClose }: { doctrine: RevenueDoctrine | null; onClose: () => void }) {
  const { mutateDoctrine, busy, error } = useKnowledgeMemory()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')

  useEffect(() => {
    setTitle(doctrine?.title || '')
    setSummary(doctrine?.summary || '')
    setEditing(false)
  }, [doctrine])

  if (!doctrine) return null

  async function action(operation: 'update' | 'submit-review' | 'approve' | 'activate' | 'suspend' | 'retire') {
    const data = operation === 'update'
      ? { title, summary, changeReason: 'Mise à jour depuis le Studio Doctrine' }
      : { changeReason: `Transition ${operation}` }
    await mutateDoctrine({ operation, id: doctrine!.id, payload: data })
    if (operation === 'update') setEditing(false)
  }

  const enforceableRules = doctrine.rules.filter((rule) => rule.machineEnforceable).length
  const highRules = doctrine.rules.filter((rule) => rule.severity === 'critical' || rule.severity === 'high').length

  return <SovereignDrawerOverlay onClose={onClose} label={`Doctrine Vault — ${doctrine.code}`}>
    <SovereignDrawerPanel width="max-w-[920px]" dataId="MZ23-DRAWER-03-DOCTRINE">
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#07140f_0%,#0b2d24_50%,#111827_100%)] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className={`absolute inset-0 opacity-35 ${drawerStyles.fineGrid}`} />
        <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2"><DrawerBadge inverted>ANGELCARE · REVENUE COMMAND OS</DrawerBadge><DrawerBadge inverted>Doctrine Vault</DrawerBadge></div>
            <div className="mt-5 flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] border border-white/15 bg-white/10 text-white shadow-xl"><LibraryBig size={25} /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2"><DrawerBadge inverted>{doctrine.status}</DrawerBadge><DrawerBadge inverted>v{doctrine.version}</DrawerBadge><DrawerBadge inverted>{doctrine.confidentiality}</DrawerBadge></div>
                <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-emerald-200">{doctrine.code} · {doctrine.knowledgeType}</p>
                {editing ? <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-2xl font-black text-white outline-none placeholder:text-white/50 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10" /> : <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">{doctrine.title}</h2>}
              </div>
            </div>
            {editing ? <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} className="mt-5 w-full resize-y rounded-[24px] border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/50 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10" /> : <div className="mt-5"><DrawerExecutiveBrief dark tone="emerald">{doctrine.summary}</DrawerExecutiveBrief></div>}
            <div className="mt-4 flex flex-wrap gap-2"><DrawerBadge inverted>{doctrine.ownerRole}</DrawerBadge><DrawerBadge inverted>{doctrine.department}</DrawerBadge><DrawerBadge inverted>Source · {doctrine.source}</DrawerBadge></div>
          </div>
          <div className="relative h-52 overflow-hidden rounded-[32px] border border-white/10 bg-white/[.06] p-5 backdrop-blur-xl">
            <span className="absolute left-1/2 top-[42%] grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white"><BookOpen size={31} /></span>
            {[70, 110, 150].map((size) => <span key={size} className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ width: size, height: size }} />)}
            <span className="absolute bottom-5 left-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">DOCTRINE</span>
            <span className="absolute bottom-5 right-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">EVIDENCE</span>
            <span className="absolute left-5 top-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">VERSION</span>
            <span className="absolute right-5 top-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">AUTHORITY</span>
          </div>
        </div>
        <div className="absolute right-5 top-5"><DrawerCloseButton onClose={onClose} inverted /></div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/75 px-5 py-6 sm:px-7 sm:py-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DrawerMetric label="Prochaine revue" value={doctrine.nextReviewAt ? new Date(doctrine.nextReviewAt).toLocaleDateString('fr-FR') : 'À définir'} note={`Cycle ${doctrine.reviewCycleDays} jours`} icon={Clock3} tone="amber" />
          <DrawerMetric label="Preuves liées" value={doctrine.evidenceRefs.length} note="Références d’autorité" icon={FileCheck2} tone="blue" />
          <DrawerMetric label="Règles exécutables" value={`${enforceableRules}/${doctrine.rules.length}`} note="Machine enforceable" icon={Shield} tone="emerald" />
          <DrawerMetric label="Règles critiques" value={highRules} note="High ou critical" icon={AlertTriangle} tone={highRules ? 'rose' : 'emerald'} />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <DrawerSection eyebrow="01 · Gouvernance" title="Autorité, cycle et provenance" icon={Fingerprint} tone="emerald">
            <dl className="space-y-3">{[
              ['Autorité propriétaire', doctrine.ownerRole],
              ['Département', doctrine.department],
              ['Source d’autorité', doctrine.sourceAuthority],
              ['Date d’effet', formatDate(doctrine.effectiveFrom)],
              ['Fin d’effet', formatDate(doctrine.effectiveTo)],
              ['Supersède', doctrine.supersedesCode || 'Aucune doctrine'],
              ['Créée', formatDate(doctrine.createdAt)],
              ['Mise à jour', formatDate(doctrine.updatedAt)],
            ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}</dt><dd className="max-w-[62%] text-right text-xs font-black text-slate-900">{value}</dd></div>)}</dl>
          </DrawerSection>

          <DrawerSection eyebrow="02 · Périmètre" title="Unités, segments, offres et commandes" icon={Tags} tone="blue">
            <ScopeGroup label="Business units" values={doctrine.businessUnitCodes} />
            <ScopeGroup label="Segments" values={doctrine.applicableSegmentCodes} />
            <ScopeGroup label="Offres" values={doctrine.applicableOfferCodes} />
            <ScopeGroup label="Familles de commandes" values={doctrine.applicableCommandFamilies} />
            <ScopeGroup label="Tags" values={doctrine.tags} />
          </DrawerSection>
        </div>

        <div className="mt-5"><DrawerSection eyebrow="03 · Corpus" title="Contenu institutionnel structuré" icon={BookOpen} tone="emerald">
          <div className={`${drawerStyles.rail} space-y-3 pl-12`}>{[...doctrine.contentBlocks].sort((a, b) => a.order - b.order).map((block, index) => <article key={block.code} className="relative rounded-[22px] border border-slate-200 bg-white p-4"><span className="absolute -left-[43px] top-4 grid h-9 w-9 place-items-center rounded-full border-4 border-slate-50 bg-emerald-700 text-[9px] font-black text-white">{String(index + 1).padStart(2, '0')}</span><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.13em] text-emerald-700">{block.heading}</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{block.body}</p></div><DrawerBadge tone="slate">{block.blockType}</DrawerBadge></div></article>)}</div>
        </DrawerSection></div>

        <div className="mt-5"><DrawerSection eyebrow="04 · Règles" title="Règles exécutables, interdictions et escalades" icon={BadgeCheck} tone="blue">
          <div className="grid gap-3 xl:grid-cols-2">{doctrine.rules.map((rule) => <article key={rule.code} className={`rounded-[24px] border p-4 ${rule.severity === 'critical' || rule.severity === 'high' ? 'border-rose-200 bg-rose-50/70' : 'border-slate-200 bg-white'}`}><div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${rule.machineEnforceable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{rule.machineEnforceable ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</span><div className="min-w-0"><div className="flex flex-wrap gap-2"><DrawerBadge tone={rule.severity === 'critical' || rule.severity === 'high' ? 'rose' : 'blue'}>{rule.severity}</DrawerBadge><DrawerBadge tone={rule.machineEnforceable ? 'emerald' : 'amber'}>{rule.machineEnforceable ? 'Exécutable' : 'Contrôle humain'}</DrawerBadge></div><h4 className="mt-3 text-sm font-black text-slate-950">{rule.name}</h4><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700"><strong>Condition :</strong> {rule.condition}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700"><strong>Action requise :</strong> {rule.requiredAction}</p>{rule.prohibitedAction ? <p className="mt-2 text-[11px] font-black leading-5 text-rose-800"><strong>Interdit :</strong> {rule.prohibitedAction}</p> : null}{rule.escalationRole ? <p className="mt-2 text-[10px] font-bold text-slate-600">Escalade : {rule.escalationRole}</p> : null}</div></div></article>)}</div>
        </DrawerSection></div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <DrawerSection eyebrow="05 · Preuves" title="Références liées" icon={FileCheck2} tone="blue">
            <div className="space-y-2">{doctrine.evidenceRefs.length ? doctrine.evidenceRefs.map((reference, index) => <div key={reference} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[10px] font-black text-blue-800">{index + 1}</span><span className="min-w-0 break-all text-xs font-black text-slate-900">{reference}</span></div>) : <p className="text-xs font-semibold text-slate-600">Aucune référence de preuve n’est liée.</p>}</div>
          </DrawerSection>
          <DrawerSection eyebrow="06 · Sécurité" title="Confidentialité et intégrité" icon={LockKeyhole} tone="violet" dark>
            <p>Cette doctrine est classée <strong>{doctrine.confidentiality}</strong>. Sa version active est <strong>{doctrine.version}</strong> et sa source déclarée est <strong>{doctrine.source}</strong>.</p>
            <div className="mt-4 flex flex-wrap gap-2"><DrawerBadge inverted>{doctrine.status}</DrawerBadge><DrawerBadge inverted>{doctrine.knowledgeType}</DrawerBadge><DrawerBadge inverted>{doctrine.source}</DrawerBadge></div>
          </DrawerSection>
        </div>

        {error ? <div role="alert" className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-800">{error}</div> : null}
      </div>

      <DrawerActionFooter note="Toutes les transitions utilisent le moteur Doctrine existant et restent auditables. Aucun contenu externe n’est publié depuis ce panneau.">
        <DrawerSecondaryAction onClick={() => setEditing(!editing)}><Edit3 size={15} />{editing ? 'Annuler la modification' : 'Modifier le dossier'}</DrawerSecondaryAction>
        {editing ? <DrawerPrimaryAction onClick={() => action('update')} disabled={busy} tone="blue"><Save size={15} />Enregistrer</DrawerPrimaryAction> : null}
        {!editing && doctrine.status === 'draft' ? <DrawerPrimaryAction onClick={() => action('submit-review')} disabled={busy} tone="amber">Soumettre en revue<ArrowRight size={15} /></DrawerPrimaryAction> : null}
        {!editing && doctrine.status === 'in-review' ? <DrawerPrimaryAction onClick={() => action('approve')} disabled={busy} tone="blue"><BadgeCheck size={15} />Approuver</DrawerPrimaryAction> : null}
        {!editing && doctrine.status === 'approved' ? <DrawerPrimaryAction onClick={() => action('activate')} disabled={busy} tone="emerald"><CheckCircle2 size={15} />Activer</DrawerPrimaryAction> : null}
        {!editing && doctrine.status === 'effective' ? <DrawerSecondaryAction onClick={() => action('suspend')} disabled={busy} danger>Suspendre</DrawerSecondaryAction> : null}
        {!editing && doctrine.status !== 'retired' ? <DrawerSecondaryAction onClick={() => action('retire')} disabled={busy}>Retirer</DrawerSecondaryAction> : null}
      </DrawerActionFooter>
    </SovereignDrawerPanel>
  </SovereignDrawerOverlay>
}

function ScopeGroup({ label, values }: { label: string; values: string[] }) {
  return <div className="mb-4 last:mb-0"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map((value) => <DrawerBadge key={value} tone="blue">{value}</DrawerBadge>) : <span className="text-[11px] font-semibold text-slate-500">Non défini</span>}</div></div>
}
