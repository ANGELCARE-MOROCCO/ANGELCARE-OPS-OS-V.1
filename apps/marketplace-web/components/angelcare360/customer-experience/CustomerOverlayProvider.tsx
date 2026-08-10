'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CustomerOverlayKind, CustomerOverlayRegistration } from '@/types/angelcare360/customer-overlay'

const ROOT_ID = 'angelcare360-customer-overlay-root'
const OVERHEAD_VARIABLE = '--ac-protected-overhead-height'
const SHELL_SELECTOR = '[data-angelcare360-customer-shell="true"]'

type ContextValue = {
  host: HTMLElement | null
  register: (registration: CustomerOverlayRegistration) => void
  unregister: (id: string) => void
  isTop: (id: string) => boolean
  depthOf: (id: string) => number
  topId: () => string | null
}

const Context = createContext<ContextValue | null>(null)

function ensureRoot() {
  let node = document.getElementById(ROOT_ID)
  if (!node) {
    node = document.createElement('div')
    node.id = ROOT_ID
    document.body.appendChild(node)
  }
  node.dataset.customerOverlayRoot = 'true'
  node.setAttribute('aria-live', 'off')
  Object.assign(node.style, {
    position: 'fixed',
    left: '0px',
    right: '0px',
    bottom: '0px',
    top: `var(${OVERHEAD_VARIABLE}, 0px)`,
    zIndex: '2147482000',
    isolation: 'isolate',
    pointerEvents: 'none',
    overflow: 'visible',
  })
  return node
}

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function collectOverheadCandidates(overlayRoot: HTMLElement) {
  const selectors = [
    '[data-angelcare-protected-overhead]',
    '[data-protected-overhead]',
    '[data-global-overhead]',
    '[data-overhead-panel]',
    '[class*="overhead" i]',
    '[id*="overhead" i]',
    '[class*="topbar" i]',
    '[id*="topbar" i]',
    'header',
    '[role="banner"]',
  ].join(',')
  const selected = Array.from(document.querySelectorAll<HTMLElement>(selectors))
  const direct = Array.from(document.body.children).filter((node): node is HTMLElement => node instanceof HTMLElement)
  return [...new Set([...selected, ...direct])].filter((element) => element !== overlayRoot && !overlayRoot.contains(element))
}

function measureProtectedOverhead(customerShell: HTMLElement | null, overlayRoot: HTMLElement) {
  const explicitSelector = '[data-angelcare-protected-overhead], [data-protected-overhead], [data-global-overhead], [data-overhead-panel]'
  let bottom = 0

  for (const element of collectOverheadCandidates(overlayRoot)) {
    if (customerShell && customerShell.contains(element)) continue
    if (!isVisible(element)) continue
    const style = window.getComputedStyle(element)
    const explicit = element.matches(explicitSelector)
    if (!explicit && !['fixed', 'sticky'].includes(style.position)) continue
    const rect = element.getBoundingClientRect()
    if (rect.top > 5 || rect.bottom <= 0 || rect.height > 260) continue
    if (!explicit && rect.width < window.innerWidth * 0.55) continue
    bottom = Math.max(bottom, Math.round(rect.bottom))
  }

  const measured = Math.max(0, bottom)
  document.documentElement.style.setProperty(OVERHEAD_VARIABLE, `${measured}px`)
  overlayRoot.dataset.overheadHeight = String(measured)
}

export default function CustomerOverlayProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [stack, setStack] = useState<string[]>([])
  const registrations = useRef(new Map<string, CustomerOverlayRegistration>())
  const stackRef = useRef<string[]>([])
  stackRef.current = stack
  const bodyState = useRef<{ overflow: string; paddingRight: string } | null>(null)

  useEffect(() => {
    const root = ensureRoot()
    setHost(root)
    let frame = 0
    let resize: ResizeObserver | null = null
    const observed = new Set<HTMLElement>()
    const observeCandidates = () => {
      if (!resize) return
      for (const element of collectOverheadCandidates(root)) {
        if (observed.has(element)) continue
        observed.add(element)
        resize.observe(element)
      }
    }
    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        observeCandidates()
        const shell = document.querySelector<HTMLElement>(SHELL_SELECTOR)
        measureProtectedOverhead(shell, root)
      })
    }
    resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    const mutation = new MutationObserver(schedule)
    mutation.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'data-state'] })
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    schedule()
    return () => {
      window.cancelAnimationFrame(frame)
      resize?.disconnect()
      mutation.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      document.documentElement.style.removeProperty(OVERHEAD_VARIABLE)
    }
  }, [])

  const register = useCallback((registration: CustomerOverlayRegistration) => {
    const parentId = registration.parentId ?? stackRef.current[stackRef.current.length - 1] ?? null
    registrations.current.set(registration.id, { ...registration, parentId })
    setStack((current) => [...current.filter((item) => item !== registration.id), registration.id])
  }, [])

  const unregister = useCallback((id: string) => {
    const registration = registrations.current.get(id)
    registrations.current.delete(id)
    setStack((current) => current.filter((item) => item !== id))
    window.requestAnimationFrame(() => {
      if (registration?.trigger?.isConnected) registration.trigger.focus({ preventScroll: true })
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const top = stack[stack.length - 1]
      if (!top) return
      event.preventDefault()
      event.stopPropagation()
      registrations.current.get(top)?.requestClose()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [stack])

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(SHELL_SELECTOR)
    if (stack.length > 0) {
      if (!bodyState.current) {
        bodyState.current = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight }
        const width = window.innerWidth - document.documentElement.clientWidth
        document.body.style.overflow = 'hidden'
        if (width > 0) document.body.style.paddingRight = `${width}px`
      }
      if (shell) {
        shell.setAttribute('inert', '')
        shell.setAttribute('aria-hidden', 'true')
        shell.dataset.overlayInert = 'true'
      }
    } else {
      if (bodyState.current) {
        document.body.style.overflow = bodyState.current.overflow
        document.body.style.paddingRight = bodyState.current.paddingRight
        bodyState.current = null
      }
      if (shell) {
        shell.removeAttribute('inert')
        shell.removeAttribute('aria-hidden')
        delete shell.dataset.overlayInert
      }
    }
  }, [stack.length])

  useEffect(() => () => {
    if (bodyState.current) {
      document.body.style.overflow = bodyState.current.overflow
      document.body.style.paddingRight = bodyState.current.paddingRight
    }
    const shell = document.querySelector<HTMLElement>(SHELL_SELECTOR)
    shell?.removeAttribute('inert')
    shell?.removeAttribute('aria-hidden')
  }, [])

  const topId = useCallback(() => stackRef.current[stackRef.current.length - 1] ?? null, [])

  const value = useMemo<ContextValue>(() => ({
    host,
    register,
    unregister,
    isTop: (id) => stack[stack.length - 1] === id,
    depthOf: (id) => Math.max(0, stack.indexOf(id)),
    topId,
  }), [host, register, stack, topId, unregister])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCustomerOverlayKernel() {
  const value = useContext(Context)
  if (!value) throw new Error('useCustomerOverlayKernel must be used inside CustomerOverlayProvider.')
  return value
}

export function overlayLayerFor(kind: CustomerOverlayKind) {
  return {
    'quick-peek': 20,
    dossier: 30,
    'focus-command': 40,
    'nested-command': 50,
    evidence: 60,
    confirmation: 70,
    palette: 80,
  }[kind]
}
