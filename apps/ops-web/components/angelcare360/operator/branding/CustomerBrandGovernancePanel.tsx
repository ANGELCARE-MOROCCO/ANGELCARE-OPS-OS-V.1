
'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Image, Paintbrush, RefreshCcw, ShieldCheck } from 'lucide-react'
import BrandRuntimeLockup from '@/components/brand/BrandRuntimeLockup'
import type { BrandGovernanceSnapshot, BrandRuntime, OperatorBrandProfile } from '@/types/angelcare360/operator/branding'
import styles from './CustomerBrandGovernancePanel.module.css'

export default function CustomerBrandGovernancePanel({ clientId }: { clientId: string }) {
  const [snapshot, setSnapshot] = useState<BrandGovernanceSnapshot | null>(null)
  const [runtime, setRuntime] = useState<BrandRuntime | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!clientId) return
    setBusy(true)
    try {
      const response = await fetch(`/api/angelcare360/operator/branding?clientId=${encodeURIComponent(clientId)}`, { cache: 'no-store' })
      const body = await response.json()
      if (response.ok && body.ok) {
        setSnapshot(body.snapshot)
        const profile = (body.snapshot.profiles || [])[0] as OperatorBrandProfile | undefined
        if (profile) {
          const test = await fetch('/api/angelcare360/operator/branding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'runtime.test', payload: { clientId: profile.client_id, tenantId: profile.tenant_id } }) })
          const result = await test.json()
          if (test.ok && result.ok) setRuntime(result.runtime)
        }
      }
    } finally { setBusy(false) }
  }

  useEffect(() => { load() }, [clientId])
  const profile = snapshot?.profiles?.[0]
  return <section className={styles.panel}>
    <header><div><small>BRAND IDENTITY & PORTAL APPEARANCE</small><h3>Marque client et white‑label</h3></div><button onClick={load} disabled={busy}><RefreshCcw size={14}/></button></header>
    {profile ? <><div className={styles.preview} style={{ borderColor: profile.accent_color }}><BrandRuntimeLockup runtime={runtime}/><div><strong>{profile.brand_name || profile.client?.display_name || 'Client'}</strong><span>{profile.display_mode.replaceAll('_',' ')} · {profile.status}</span>{runtime?.fallbackReason ? <em>{runtime.fallbackReason}</em> : <small>Runtime client conforme.</small>}</div></div><div className={styles.signals}><span><BadgeCheck size={14}/>{profile.status === 'published' ? 'Publié' : 'Gouvernance requise'}</span><span><Image size={14}/>{snapshot?.assets.length || 0} asset(s)</span><span><ShieldCheck size={14}/>{profile.requires_entitlement ? 'Entitlement requis' : 'Couverture client'}</span></div></> : <div className={styles.empty}><Paintbrush size={24}/><strong>Aucun profil client gouverné</strong><p>AngelCare reste automatiquement affiché jusqu’à création, approbation et publication.</p></div>}
    <a href={`/angelcare-360-operator/brand-governance?view=customers&clientId=${encodeURIComponent(clientId)}`}>Ouvrir Brand Governance <ArrowRight size={15}/></a>
  </section>
}
