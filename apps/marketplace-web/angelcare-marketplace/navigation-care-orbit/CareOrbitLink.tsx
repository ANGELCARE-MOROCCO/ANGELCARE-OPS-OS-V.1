 'use client'
import NextLink, { useLinkStatus } from 'next/link'
import { useEffect, useRef, type ComponentProps, type MutableRefObject } from 'react'
import { beginNavigation, navigationController } from './client-controller'
type Props = ComponentProps<typeof NextLink>
function LinkLifecycle({ token }: { token: MutableRefObject<number | null> }) {
  const { pending } = useLinkStatus(), observedPending = useRef(false)
  useEffect(() => {
    if (pending) observedPending.current = true
    // pending ends at history commit; loading-boundary holds keep the toast up during streaming.
    else if (observedPending.current) {
      observedPending.current = false
      const id = token.current
      const frame = requestAnimationFrame(() => navigationController()?.finish(id))
      return () => cancelAnimationFrame(frame)
    }
  }, [pending, token])
  return null
}
export default function CareOrbitLink({ children, onNavigate, ...props }: Props) {
  const token = useRef<number | null>(null)
  return <NextLink {...props} data-care-orbit-link onNavigate={event => {
    let cancelled = false
    onNavigate?.({ ...event, preventDefault: () => { cancelled = true; event.preventDefault() } })
    if (cancelled) return
    const href = typeof props.href === 'string' ? props.href : null
    // URL objects resolve from the rendered anchor through Next's own formatting.
    let target = href
    if (!target && props.href && typeof props.href === 'object') {
      const query = new URLSearchParams()
      for (const [key, value] of Object.entries(typeof props.href.query === 'object' ? props.href.query || {} : {})) {
        for (const entry of Array.isArray(value) ? value : [value]) if (entry != null) query.append(key, String(entry))
      }
      const queryText = typeof props.href.query === 'string' ? props.href.query.replace(/^\?/, '') : query.toString()
      const prefix = props.href.host || props.href.hostname ? `${props.href.protocol || location.protocol}//${props.href.host || props.href.hostname}${props.href.port && !props.href.host ? ':' + props.href.port : ''}` : ''
      const search = props.href.search || (queryText ? '?' + queryText : '')
      target = props.href.href || `${prefix}${props.href.pathname || location.pathname}${search}${props.href.hash ? (props.href.hash.startsWith('#') ? props.href.hash : '#' + props.href.hash) : ''}`
    }
    if (typeof props.as === 'string') target = props.as
    if (target) token.current = beginNavigation(target)
    if (!navigator.onLine) navigationController()?.connection(false)
  }}>{children}<LinkLifecycle token={token}/></NextLink>
}
