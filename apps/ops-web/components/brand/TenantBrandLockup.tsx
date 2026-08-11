
'use client'

import { useEffect, useState } from 'react'
import BrandRuntimeLockup from './BrandRuntimeLockup'
import type { BrandRuntime } from '@/types/shared/brand-runtime'

type Props = { compact?: boolean; className?: string; priority?: boolean }

export default function TenantBrandLockup({ compact = false, className = '', priority = false }: Props) {
  const [runtime, setRuntime] = useState<BrandRuntime | null>(null)
  useEffect(() => {
    let active = true
    fetch('/api/angelcare360/branding/current', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json()
        if (active && response.ok && body.ok) setRuntime(body.runtime)
      })
      .catch(() => null)
    return () => { active = false }
  }, [])
  return <BrandRuntimeLockup runtime={runtime} compact={compact} className={className} priority={priority} />
}
