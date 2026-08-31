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
  const title = configuration ? 'Configuration nécessaire' : pending ? 'Activation nécessaire' : capacity ? 'Limite de votre offre atteinte' : dependency ? 'Service temporairement indisponible' : suspended ? 'Service temporairement suspendu' : migration ? 'Service en cours d’évolution' : 'Non inclus dans votre offre'
  const explanation = configuration
    ? 'Ce service doit être configuré par une personne autorisée avant sa première utilisation.'
    : pending
      ? 'L’activation de ce service est en cours. Il sera disponible dès que sa préparation sera terminée.'
      : capacity
        ? 'La limite prévue dans votre offre est atteinte. La direction peut consulter les options disponibles.'
        : dependency
          ? 'Un service nécessaire est momentanément indisponible. Réessayez dans quelques instants.'
          : suspended
            ? 'Ce service est temporairement suspendu. Votre administrateur peut consulter la situation.'
            : migration
              ? 'Ce service évolue actuellement et ne peut pas être utilisé depuis cet écran.'
              : 'Ce service ne fait pas partie de l’offre actuellement active pour votre établissement.'
  const action = configuration ? { href: '/angelcare-360-command-center/administration/parametres', label: 'Ouvrir la configuration' } : capacity ? { href: '/angelcare-360-command-center/direction', label: 'Consulter la situation' } : { href: '/angelcare-360-command-center/direction', label: 'Retour à l’accueil' }

  return <section className={styles.page} data-entitlement-state={state}>
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
