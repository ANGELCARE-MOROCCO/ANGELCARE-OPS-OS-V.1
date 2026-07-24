'use client'

import { BellRing, LockKeyhole, Route, ShieldCheck, Waypoints } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { signalTruthMode } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function SubscriptionsExperience() {
  const { fabric, warnings, error } = useSignalFabric()
  const active = fabric.subscriptions.filter((subscription) => subscription.active)
  const deliveryModes = [...new Set(fabric.subscriptions.map((subscription) => subscription.deliveryMode))]
  const subscribers = [...new Set(fabric.subscriptions.map((subscription) => subscription.subscriberKey))]

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-SUBSCRIPTIONS">
    <SignalRouteMasthead eyebrow="Abonnements" title="Subscription Control" subtitle="Les critères, destinations, cooldowns et limites de confidentialité sont visibles sans activer silencieusement un canal externe." concept="Signal Subscription Control" icon={BellRing} tone="blue" mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Distribution interne gouvernée" secondary={{ label: 'Accès & confidentialité', href: '/revenue-command-os/signals/data-access' }}>
      <SignalLifecycle current="routing" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Abonnements" value={fabric.subscriptions.length} note="Registre complet" tone="blue"/><SignalStat label="Actifs" value={active.length} note="Routage autorisé" tone="emerald"/><SignalStat label="Destinations" value={subscribers.length} note="Rôles, workspaces ou systèmes" tone="cyan"/><SignalStat label="Modes de livraison" value={deliveryModes.length} note="In-app et workflows internes" tone="violet"/></section>

    <SignalPanel eyebrow="Distribution matrix" title="Abonnements gouvernés" icon={Waypoints} tone="blue">
      <div className="grid gap-4 xl:grid-cols-2">{fabric.subscriptions.map((subscription) => <article key={subscription.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-slate-950">{subscription.name}</h3><SignalStatus status={subscription.active ? 'active' : 'paused'}/></div><p className="mt-1 text-[9px] font-black uppercase text-slate-600">{subscription.code} · {subscription.subscriberType}</p></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Route size={18}/></div></div><div className="mt-4 grid grid-cols-2 gap-3"><Fact label="Destination" value={subscription.subscriberKey}/><Fact label="Mode" value={subscription.deliveryMode}/><Fact label="Cooldown" value={`${subscription.cooldownMinutes} min`}/><Fact label="Sévérités" value={subscription.severities.join(', ') || 'Toutes'}/></div><div className="mt-4 flex flex-wrap gap-2">{subscription.categories.map((category) => <SignalTag key={category} tone="cyan">{category}</SignalTag>)}{subscription.businessUnitCodes.map((code) => <SignalTag key={code} tone="blue">BU {code}</SignalTag>)}{subscription.territoryCodes.map((code) => <SignalTag key={code} tone="violet">Territoire {code}</SignalTag>)}</div><div className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-3"><ShieldCheck size={15} className="mt-0.5 text-cyan-700"/><p className="text-[10px] font-semibold leading-5 text-cyan-950">Le mode {subscription.deliveryMode} reste soumis aux permissions, au cooldown et aux verrous d’effet externe.</p></div></article>)}{!fabric.subscriptions.length ? <SignalEmpty title="Aucun abonnement" description="Le tissu ne contient aucune règle de distribution. Aucun destinataire n’est inventé."/> : null}</div>
    </SignalPanel>

    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><LockKeyhole size={18} className="mt-0.5 text-amber-700"/><div><p className="text-xs font-black text-amber-950">Aucune activation silencieuse</p><p className="mt-1 text-[11px] font-semibold leading-5 text-amber-900">Cette route expose les abonnements existants. Elle n’active aucun email, WhatsApp, paiement ou engagement externe.</p></div></div></div>
  </div>
}
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-600">{label}</p><p className="mt-1 text-[10px] font-black text-slate-950">{value}</p></div> }
