'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { CustomerPlaneDefinition } from '@/types/angelcare360/customer-experience'
import styles from './CustomerPlaneNavigation.module.css'

type Props = {
  planes: CustomerPlaneDefinition[]
  activeKey?: string
  permissions?: Iterable<string>
  entitlementKeys?: Iterable<string>
  onChange?: (key: string) => void
}

export default function CustomerPlaneNavigation({ planes, activeKey, permissions, entitlementKeys, onChange }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const permissionSet = useMemo(() => new Set(permissions || []), [permissions])
  const entitlementSet = useMemo(() => new Set(entitlementKeys || []), [entitlementKeys])
  const available = useMemo(() => planes.filter((plane) => {
    if (plane.disabled) return false
    if (plane.permission && permissionSet.size && !permissionSet.has(plane.permission)) return false
    if (plane.entitlementKey && entitlementSet.size && !entitlementSet.has(plane.entitlementKey)) return false
    return true
  }), [planes, permissionSet, entitlementSet])
  const requested = activeKey || params.get('plane') || ''
  const selected = available.some((plane) => plane.key === requested) ? requested : available[0]?.key

  useEffect(() => {
    const fromUrl = params.get('plane')
    if (!selected || !fromUrl || fromUrl === selected) return
    const next = new URLSearchParams(params.toString())
    next.set('plane', selected)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }, [params, pathname, router, selected])

  if (available.length <= 1 || !selected) return null

  function select(key: string) {
    if (!available.some((plane) => plane.key === key)) return
    const next = new URLSearchParams(params.toString())
    next.set('plane', key)
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
    onChange?.(key)
  }

  return <nav className={styles.rail} aria-label="Navigation interne">
    <div className={styles.track}>{available.map((plane) => <button type="button" key={plane.key} data-active={plane.key === selected} aria-current={plane.key === selected ? 'page' : undefined} onClick={() => select(plane.key)}>
      <strong>{plane.label}</strong>{plane.description ? <span>{plane.description}</span> : null}
    </button>)}</div>
  </nav>
}
