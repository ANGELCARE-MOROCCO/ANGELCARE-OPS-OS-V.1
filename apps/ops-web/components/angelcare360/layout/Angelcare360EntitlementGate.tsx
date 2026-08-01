'use client'

import Link from 'next/link'
import { AlertTriangle, Boxes, LockKeyhole, PackageCheck, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
import { getAngelcare360ModuleKeyForPath, isAngelcare360ModuleEnabled } from '@/lib/angelcare360/entitlements'

export default function Angelcare360EntitlementGate({
  children,
  pathname,
  runtime,
}: {
  children: ReactNode
  pathname: string
  runtime: Angelcare360RuntimeEntitlements
}) {
  const moduleKey = getAngelcare360ModuleKeyForPath(pathname)
  if (isAngelcare360ModuleEnabled(runtime, moduleKey)) return <>{children}</>

  const restriction = runtime.restrictedModules.find((item) => item.key === moduleKey)
  return (
    <section style={pageStyle} aria-labelledby="angelcare360-entitlement-title">
      <div style={ambientStyle} />
      <div style={iconStyle}><LockKeyhole size={30} /></div>
      <span style={eyebrowStyle}>Contrôle contractuel AngelCare 360</span>
      <h1 id="angelcare360-entitlement-title" style={titleStyle}>Ce module n’est pas actif pour votre tenant.</h1>
      <p style={copyStyle}>
        Le Customer Command Center applique maintenant la version package et le snapshot d’entitlements compilé par AngelCare Operator.
        Aucun accès n’est simulé ou déduit d’un simple lien de navigation.
      </p>
      <div style={gridStyle}>
        <article style={cardStyle}>
          <PackageCheck size={20} />
          <span>Package effectif</span>
          <strong>{runtime.packageVersionName || 'Non affecté'}</strong>
          <small>{runtime.packageVersionCode || 'Aucune version publiée'}</small>
        </article>
        <article style={cardStyle}>
          <Boxes size={20} />
          <span>Module demandé</span>
          <strong>{moduleKey || 'Module protégé'}</strong>
          <small>{restriction?.state || runtime.state}</small>
        </article>
        <article style={cardStyle}>
          <ShieldCheck size={20} />
          <span>Tenant</span>
          <strong>{runtime.tenantSlug || 'Non lié'}</strong>
          <small>{runtime.tenantStatus || 'État indisponible'}</small>
        </article>
      </div>
      <div style={reasonStyle}><AlertTriangle size={18} /><span>{restriction?.reason || runtime.warning || 'Le module est exclu, suspendu ou nécessite une configuration Operator.'}</span></div>
      <div style={actionsStyle}>
        <Link href="/angelcare-360-command-center/direction" style={primaryStyle}>Retour au cockpit</Link>
        <span style={noteStyle}>Contactez l’administrateur AngelCare pour une activation, un add-on ou un changement de package.</span>
      </div>
    </section>
  )
}

const pageStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 150px)', display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 18, padding: 'clamp(30px,7vw,92px)', border: '1px solid rgba(148,163,184,.24)', borderRadius: 34, background: 'linear-gradient(145deg,rgba(255,255,255,.98),rgba(239,246,255,.95))', boxShadow: '0 28px 80px rgba(15,23,42,.12)', textAlign: 'center' }
const ambientStyle: React.CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 20% 10%,rgba(37,99,235,.14),transparent 28%),radial-gradient(circle at 85% 75%,rgba(239,68,68,.08),transparent 28%)' }
const iconStyle: React.CSSProperties = { position: 'relative', display: 'grid', placeItems: 'center', width: 68, height: 68, borderRadius: 22, color: '#991b1b', background: 'linear-gradient(145deg,#fff,#fee2e2)', border: '1px solid rgba(239,68,68,.18)', boxShadow: '0 16px 34px rgba(127,29,29,.12)' }
const eyebrowStyle: React.CSSProperties = { position: 'relative', fontSize: 12, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase', color: '#1d4ed8' }
const titleStyle: React.CSSProperties = { position: 'relative', maxWidth: 800, margin: 0, fontSize: 'clamp(30px,4vw,54px)', lineHeight: 1.04, letterSpacing: '-.045em', color: '#0f2747' }
const copyStyle: React.CSSProperties = { position: 'relative', maxWidth: 760, margin: 0, color: '#52657c', fontSize: 16, lineHeight: 1.75 }
const gridStyle: React.CSSProperties = { position: 'relative', width: 'min(100%,900px)', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14, marginTop: 8 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 7, justifyItems: 'start', padding: 19, borderRadius: 20, background: 'rgba(255,255,255,.86)', border: '1px solid rgba(148,163,184,.22)', textAlign: 'left', boxShadow: '0 12px 28px rgba(15,23,42,.07)', color: '#0f2747' }
const reasonStyle: React.CSSProperties = { position: 'relative', width: 'min(100%,900px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 16, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', fontWeight: 750 }
const actionsStyle: React.CSSProperties = { position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 15 }
const primaryStyle: React.CSSProperties = { display: 'inline-flex', padding: '13px 20px', borderRadius: 13, background: '#123967', color: '#fff', textDecoration: 'none', fontWeight: 850, boxShadow: '0 12px 24px rgba(18,57,103,.22)' }
const noteStyle: React.CSSProperties = { color: '#64748b', fontSize: 13, fontWeight: 650 }
