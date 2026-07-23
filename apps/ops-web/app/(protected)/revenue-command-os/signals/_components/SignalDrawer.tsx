'use client'

import {
  Activity, AlertTriangle, CheckCircle2, Clock3, Eye, FileCheck2, Gauge, Network,
  RadioTower, ShieldCheck, Sparkles, Target, Workflow,
} from 'lucide-react'
import {
  DrawerActionFooter, DrawerBadge, DrawerCloseButton, DrawerExecutiveBrief, DrawerMetric,
  DrawerPrimaryAction, DrawerSecondaryAction, DrawerSection, SovereignDrawerOverlay,
  SovereignDrawerPanel, drawerStyles,
} from '../../_components/drawer-sovereignty/DrawerPrimitives'
import { useSignalFabric } from './SignalFabricContext'

function scoreTone(value: number) {
  if (value >= 80) return 'rose' as const
  if (value >= 60) return 'amber' as const
  if (value >= 35) return 'blue' as const
  return 'slate' as const
}

function statusTone(value: string) {
  if (value === 'critical' || value === 'blocked' || value === 'offline') return 'rose' as const
  if (value === 'high' || value === 'monitoring' || value === 'degraded' || value === 'stale') return 'amber' as const
  if (value === 'confirmed' || value === 'acknowledged' || value === 'context-ready' || value === 'healthy') return 'emerald' as const
  if (value === 'medium' || value === 'new' || value === 'triaged') return 'blue' as const
  return 'slate' as const
}

export default function SignalDrawer() {
  const { selected, setSelected, busy, updateSignalStatus, buildContext, fabric, error } = useSignalFabric()
  if (!selected) return null

  const contexts = fabric.contextSnapshots
    .filter((snapshot) => snapshot.signalCode === selected.code)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
  const latestContext = contexts[0]
  const source = fabric.sources.find((item) => item.code === selected.sourceCode)
  const sourceHealth = fabric.sourceHealth
    .filter((item) => item.sourceCode === selected.sourceCode)
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())[0]
  const expires = selected.expiresAt ? new Date(selected.expiresAt).toLocaleString('fr-FR') : 'Non défini'

  return <SovereignDrawerOverlay onClose={() => setSelected(null)} label={`Signal Intelligence Briefing — ${selected.code}`}>
    <SovereignDrawerPanel width="max-w-[900px]" dataId="MZ23-DRAWER-02-SIGNAL">
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#04131d_0%,#083344_52%,#0f172a_100%)] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className={`absolute inset-0 opacity-45 ${drawerStyles.fineGrid}`} />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2"><DrawerBadge inverted>ANGELCARE · REVENUE COMMAND OS</DrawerBadge><DrawerBadge inverted>Signal Intelligence Briefing</DrawerBadge></div>
            <div className="mt-5 flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] border border-white/15 bg-white/10 text-white shadow-xl"><Activity size={25} /></span>
              <div>
                <div className="flex flex-wrap gap-2"><DrawerBadge inverted>{selected.severity}</DrawerBadge><DrawerBadge inverted>{selected.confidence}</DrawerBadge><DrawerBadge inverted>{selected.status}</DrawerBadge></div>
                <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-cyan-200">{selected.code} · {selected.category} · {selected.signalType}</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-white sm:text-4xl">{selected.title}</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-200">{selected.summary}</p>
              </div>
            </div>
            <div className="mt-5"><DrawerExecutiveBrief dark tone="cyan">Priorité {selected.priorityScore}/100. Le signal provient de {source?.name || selected.sourceCode} et {selected.blockingReasons.length ? `présente ${selected.blockingReasons.length} blocage(s) explicite(s).` : 'ne présente aucun blocage déclaré.'}</DrawerExecutiveBrief></div>
          </div>
          <div className="relative h-48 overflow-hidden rounded-[30px] border border-white/10 bg-white/[.06] p-5 backdrop-blur-xl">
            <RadioTower className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={35} />
            {[58, 94, 132].map((size) => <span key={size} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" style={{ width: size, height: size }} />)}
            <span className="absolute left-5 top-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">SOURCE</span>
            <span className="absolute right-5 top-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">QUALIFICATION</span>
            <span className="absolute bottom-5 left-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">CONTEXTE</span>
            <span className="absolute bottom-5 right-5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black text-white">ROUTAGE</span>
          </div>
        </div>
        <div className="absolute right-5 top-5"><DrawerCloseButton onClose={() => setSelected(null)} inverted /></div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/75 px-5 py-6 sm:px-7 sm:py-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DrawerMetric label="Priorité" value={selected.priorityScore} note="Score de traitement" icon={Target} tone={scoreTone(selected.priorityScore)} />
          <DrawerMetric label="Urgence" value={selected.urgencyScore} note="Pression temporelle" icon={Clock3} tone={scoreTone(selected.urgencyScore)} />
          <DrawerMetric label="Opportunité" value={selected.opportunityScore} note="Potentiel commercial" icon={Sparkles} tone={scoreTone(selected.opportunityScore)} />
          <DrawerMetric label="Risque" value={selected.riskScore} note="Exposition à contrôler" icon={AlertTriangle} tone={scoreTone(selected.riskScore)} />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <DrawerSection eyebrow="01 · Traçabilité" title="Source, détection et fraîcheur" icon={RadioTower} tone="cyan">
            <dl className="space-y-3">
              {[
                ['Source', source?.name || selected.sourceCode],
                ['Type de source', source?.sourceKind || 'Indisponible'],
                ['État source', sourceHealth?.status || source?.status || 'Indisponible'],
                ['Détecté', new Date(selected.detectedAt).toLocaleString('fr-FR')],
                ['Événement observé', new Date(selected.occurredAt).toLocaleString('fr-FR')],
                ['Expiration', expires],
                ['Propriétaire', selected.ownerRole || 'À attribuer'],
              ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}</dt><dd className="max-w-[62%] text-right text-xs font-black text-slate-900">{value}</dd></div>)}
            </dl>
          </DrawerSection>

          <DrawerSection eyebrow="02 · Contexte gouverné" title="Snapshot d’intelligence" icon={ShieldCheck} tone={latestContext?.status === 'ready' ? 'emerald' : 'amber'}>
            {latestContext ? <div>
              <div className="grid grid-cols-2 gap-3"><DrawerMetric label="Complétude" value={`${latestContext.completenessScore}%`} note={`${latestContext.facts.length} fait(s)`} icon={Gauge} tone={latestContext.completenessScore >= 70 ? 'emerald' : 'amber'} /><DrawerMetric label="Fraîcheur" value={`${latestContext.freshnessScore}%`} note={latestContext.status} icon={Clock3} tone={latestContext.freshnessScore >= 70 ? 'emerald' : 'amber'} /></div>
              <p className="mt-4 text-xs font-semibold leading-5 text-slate-700">{latestContext.purpose}</p>
              <p className="mt-3 text-[10px] font-bold text-slate-600">Profil : {latestContext.visibilityProfile} · {latestContext.redactedFields.length} famille(s) masquée(s)</p>
            </div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"><p className="text-xs font-black text-slate-900">Aucun snapshot prêt</p><p className="mt-2 text-[11px] font-medium leading-5 text-slate-600">Construisez le contexte avant toute future recommandation automatisée.</p></div>}
            <DrawerPrimaryAction onClick={() => buildContext(selected.id)} disabled={busy} tone="cyan"><Network size={15} />{busy ? 'Construction…' : latestContext ? 'Reconstruire le contexte' : 'Construire le contexte'}</DrawerPrimaryAction>
          </DrawerSection>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <DrawerSection eyebrow="03 · Entités" title="Objets commerciaux concernés" icon={Workflow} tone="blue">
            <div className="space-y-2">{selected.entities.length ? selected.entities.map((entity) => <div key={`${entity.entityType}-${entity.entityId || entity.entityCode || entity.label}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"><div><p className="text-xs font-black text-slate-900">{entity.label}</p><p className="mt-1 text-[9px] font-bold uppercase text-slate-500">{entity.entityType} · {entity.relationship}</p></div><DrawerBadge tone="blue">{entity.entityCode || entity.entityId || 'Référence'}</DrawerBadge></div>) : <p className="text-xs font-semibold text-slate-600">Aucune entité liée n’est déclarée.</p>}</div>
          </DrawerSection>

          <DrawerSection eyebrow="04 · Preuves" title="Éléments observés" icon={FileCheck2} tone="emerald">
            <div className="space-y-2">{selected.evidence.length ? selected.evidence.map((evidence, index) => <article key={`${evidence.source}-${evidence.label}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-slate-900">{evidence.label}</p><p className="mt-1 text-[10px] font-semibold leading-5 text-slate-700">{evidence.value}</p></div><DrawerBadge tone="emerald">{evidence.source}</DrawerBadge></div><p className="mt-2 text-[9px] font-bold text-slate-500">Observé : {new Date(evidence.observedAt).toLocaleString('fr-FR')}</p></article>) : <p className="text-xs font-semibold text-slate-600">Aucune preuve structurée n’est jointe à ce signal.</p>}</div>
          </DrawerSection>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <DrawerSection eyebrow="05 · Doctrine" title="Familles de commandes recommandées" icon={Sparkles} tone="violet">
            <div className="flex flex-wrap gap-2">{selected.recommendedCommandFamilies.length ? selected.recommendedCommandFamilies.map((family) => <DrawerBadge key={family} tone="violet">{family}</DrawerBadge>) : <span className="text-xs font-semibold text-slate-600">Aucune famille recommandée.</span>}</div>
          </DrawerSection>

          <DrawerSection eyebrow="06 · Prochaines étapes" title="Actions recommandées par le signal" icon={Eye} tone="blue">
            <ol className="space-y-2">{selected.recommendedNextActions.length ? selected.recommendedNextActions.map((action, index) => <li key={`${action}-${index}`} className="grid grid-cols-[32px_1fr] items-start gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-700 text-[10px] font-black text-white">{index + 1}</span><span className="pt-1 text-xs font-bold leading-5 text-slate-800">{action}</span></li>) : <li className="text-xs font-semibold text-slate-600">Aucune action recommandée n’est disponible.</li>}</ol>
          </DrawerSection>
        </div>

        {selected.blockingReasons.length ? <div className="mt-5"><DrawerSection eyebrow="07 · Blocages" title="Conditions qui empêchent une progression sûre" icon={AlertTriangle} tone="rose"><ul className="space-y-2">{selected.blockingReasons.map((reason) => <li key={reason} className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-black leading-5 text-rose-900">{reason}</li>)}</ul></DrawerSection></div> : null}
        {error ? <div role="alert" className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-800">{error}</div> : null}
      </div>

      <DrawerActionFooter note="Ces actions modifient uniquement le statut interne du signal ou son contexte gouverné. Aucun message ni effet externe n’est déclenché.">
        <DrawerSecondaryAction onClick={() => updateSignalStatus(selected.id, 'dismissed')} disabled={busy} danger>Écarter avec trace</DrawerSecondaryAction>
        <DrawerSecondaryAction onClick={() => updateSignalStatus(selected.id, 'monitoring')} disabled={busy}><Eye size={15} />Mettre sous surveillance</DrawerSecondaryAction>
        <DrawerPrimaryAction onClick={() => updateSignalStatus(selected.id, 'acknowledged')} disabled={busy} tone="emerald"><CheckCircle2 size={15} />Accuser réception</DrawerPrimaryAction>
      </DrawerActionFooter>
    </SovereignDrawerPanel>
  </SovereignDrawerOverlay>
}
