
'use client'

import { useEffect, useState } from 'react'
import BrandRuntimeLockup from './BrandRuntimeLockup'
import type { BrandRuntime } from '@/types/shared/brand-runtime'

export default function TenantBrandHeaderIdentity() {
  const [runtime, setRuntime] = useState<BrandRuntime | null>(null)
  useEffect(() => {
    let active = true
    fetch('/api/angelcare360/branding/current', { cache: 'no-store' }).then(async (response) => {
      const body = await response.json()
      if (active && response.ok && body.ok) setRuntime(body.runtime)
    }).catch(() => null)
    return () => { active = false }
  }, [])
  return <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
    <BrandRuntimeLockup runtime={runtime} compact priority />
    <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
      <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 950, letterSpacing: '.1em', color: '#10213d' }}>{runtime?.portalTitle || 'ANGELCARE 360 COMMAND CENTER'}</strong>
      <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, fontWeight: 750, color: '#6f7e93' }}>{runtime?.resolvedMode === 'white_label' ? 'Espace institutionnel sécurisé' : 'Pilotage scolaire sécurisé · Powered by AngelCare'}</small>
    </div>
  </div>
}
