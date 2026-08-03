'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock3, Gauge, Link2Off, LockKeyhole, PackageCheck, Settings2, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
import { getAngelcare360ModuleKeyForPath, isAngelcare360CapabilityEnabled, isAngelcare360FeatureEnabled, isAngelcare360ModuleEnabled } from '@/lib/angelcare360/entitlements'
import { getAngelcare360RouteBinding } from '@/data/angelcare360/product-constitution'
import styles from './Angelcare360EntitlementGate.module.css'

export default function Angelcare360EntitlementGate({ children, pathname, runtime }: { children: ReactNode; pathname: string; runtime: Angelcare360RuntimeEntitlements }) {
  const route = getAngelcare360RouteBinding(pathname)
  const moduleKey = getAngelcare360ModuleKeyForPath(pathname)
  if (!runtime.enforced) return <>{children}</>

  const moduleEnabled = isAngelcare360ModuleEnabled(runtime, moduleKey)
  const capabilityEnabled = isAngelcare360CapabilityEnabled(runtime, route?.capabilityKey)
  const featureEnabled = isAngelcare360FeatureEnabled(runtime, route?.featureKey)
  const capabilityRestriction = runtime.restrictedCapabilities.find((item) => item.key === route?.capabilityKey)
  const featureRestriction = runtime.restrictedFeatures.find((item) => item.key === route?.featureKey)
  if (moduleEnabled && capabilityEnabled && featureEnabled && !capabilityRestriction && !featureRestriction) return <>{children}</>

  const moduleRestriction = runtime.restrictedModules.find((item) => item.key === moduleKey)
  const restriction = featureRestriction || capabilityRestriction || moduleRestriction
  const state = String(restriction?.state || runtime.state || 'not_included').toLowerCase()
  const configuration = /config/.test(state)
  const pending = /pending|compiled|provision/.test(state)
  const capacity = /capacity|limit|quota/.test(state)
  const dependency = /dependency|incompatible/.test(state)
  const suspended = /suspend|locked/.test(state)
  const migration = /deprecated|migration|retired/.test(state)
  const Icon = configuration ? Settings2 : pending ? Clock3 : capacity ? Gauge : dependency ? Link2Off : suspended ? ShieldAlert : LockKeyhole
  const title = configuration ? 'Configuration requise' : pending ? 'Activation en cours' : capacity ? 'Capacité atteinte' : dependency ? 'Dépendance indisponible' : suspended ? 'Capacité temporairement suspendue' : migration ? 'Évolution du produit requise' : 'Capacité non incluse'
  const action = configuration ? { href: '/angelcare-360-command-center/administration/parametres', label: 'Configurer la capacité' } : capacity ? { href: '/angelcare-360-command-center/direction', label: 'Consulter les capacités' } : { href: '/angelcare-360-command-center/direction', label: 'Retour au cockpit' }

  return <section className={styles.page} data-entitlement-state={state}>
    <div className={styles.icon}><Icon size={27}/></div>
    <span className={styles.eyebrow}>Périmètre contractuel du tenant</span>
    <h1>{title}</h1>
    <p>{route?.label || 'Cette capacité'} est gouvernée par le package versionné, le snapshot d’entitlements, les permissions et le provisioning réel. AngelCare 360 n’affiche jamais un accès simulé.</p>
    <div className={styles.grid}>
      <article><PackageCheck size={18}/><span>Package effectif</span><strong>{runtime.packageVersionName || 'Non affecté'}</strong><small>{runtime.packageVersionCode || 'Aucune version publiée'}</small></article>
      <article><CheckCircle2 size={18}/><span>Capacité demandée</span><strong>{route?.label || moduleKey || 'Capacité protégée'}</strong><small>{route?.capabilityKey || route?.featureKey || state}</small></article>
      <article><LockKeyhole size={18}/><span>Tenant</span><strong>{runtime.tenantSlug || 'Non lié'}</strong><small>{runtime.tenantStatus || 'État indisponible'}</small></article>
    </div>
    <div className={styles.reason}><AlertTriangle size={17}/><span>{restriction?.reason || runtime.warning || 'Cette capacité nécessite une activation, une configuration, un add-on, un top-up ou une évolution de package.'}</span></div>
    <div className={styles.actions}><Link href={action.href}>{action.label}</Link><span>La raison et la provenance de cette restriction restent consultables par votre administrateur autorisé.</span></div>
  </section>
}
