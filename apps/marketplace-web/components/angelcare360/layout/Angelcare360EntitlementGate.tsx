'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock3, Gauge, Link2Off, LockKeyhole, PackageCheck, Settings2, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
import { getAngelcare360ModuleKeyForPath, isAngelcare360ModuleEnabled } from '@/lib/angelcare360/entitlements'
import { getAngelcare360RouteBinding } from '@/data/angelcare360/product-constitution'
import { getAngelcare360CustomerGatePresentation } from '@/lib/angelcare360/entitlement-gate-diagnostics'
import styles from './Angelcare360EntitlementGate.module.css'

export default function Angelcare360EntitlementGate({ children, pathname, runtime }: { children: ReactNode; pathname: string; runtime: Angelcare360RuntimeEntitlements }) {
  const route = getAngelcare360RouteBinding(pathname)
  const moduleKey = getAngelcare360ModuleKeyForPath(pathname)
  if (!runtime.enforced) return <>{children}</>

  const moduleEnabled = isAngelcare360ModuleEnabled(runtime, moduleKey)
  if (moduleEnabled) return <>{children}</>

  const moduleRestriction = runtime.restrictedModules.find((item) => item.key === moduleKey)
  const restriction = moduleRestriction
  const state = String(restriction?.state || runtime.state || 'not_included').toLowerCase()
  const presentation = getAngelcare360CustomerGatePresentation(runtime, restriction?.state)
  const icons = { settings: Settings2, clock: Clock3, gauge: Gauge, dependency: Link2Off, suspended: ShieldAlert, locked: LockKeyhole }
  const Icon = icons[presentation.icon]
  const { title, explanation, action } = presentation

  return <section className={styles.page} data-entitlement-state={state} data-entitlement-classification={presentation.classification}>
    <div className={styles.icon}><Icon size={27}/></div>
    <span className={styles.eyebrow}>Accès au service</span>
    <h1>{title}</h1>
    <p>{explanation}</p>
    <div className={styles.grid}>
      <article><PackageCheck size={18}/><span>Offre actuelle</span><strong>{runtime.packageVersionName || 'Offre à confirmer'}</strong><small>Information disponible auprès de votre administrateur</small></article>
      <article><CheckCircle2 size={18}/><span>Service demandé</span><strong>{route?.label || 'Service SANILA'}</strong><small>{title}</small></article>
      <article><LockKeyhole size={18}/><span>Établissement</span><strong>Établissement actif</strong><small>Accès protégé selon votre rôle</small></article>
    </div>
    <div className={styles.reason}><AlertTriangle size={17}/><span>{explanation}</span></div>
    <div className={styles.actions}><Link href={action.href}>{action.label}</Link><span>Votre administrateur peut consulter le détail de cette restriction et vous accompagner.</span></div>
  </section>
}
