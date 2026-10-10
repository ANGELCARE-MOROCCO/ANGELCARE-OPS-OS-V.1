 'use client'
import { Suspense, useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useSearchParams } from 'next/navigation'
import { CareOrbitCard } from './CareOrbitCard'
import { dismissNavigation, rememberNavigationFocus, navigationController, navigationSnapshot, serverSnapshot, subscribeNavigation } from './client-controller'
import { eligibleClick, navigationTarget } from './navigation-contract'
import styles from './care-orbit.module.css'

function RouteObserver() {
  const pathname = usePathname(), search = useSearchParams().toString()
  useEffect(() => {
    // Let the destination's loading-boundary effects register before completing.
    const frame = requestAnimationFrame(() => navigationController()?.route(new URL(`${pathname}${search ? '?' + search : ''}`, location.origin).href))
    return () => cancelAnimationFrame(frame)
  }, [pathname, search])
  return null
}
function NavigationObserver() {
  useEffect(() => {
    const controller = navigationController()!
    controller.route(location.href)
    const click = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null
      const anchor = element?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.hasAttribute('data-care-orbit-link')) return
      if (!eligibleClick(event, { target: anchor.target, download: anchor.hasAttribute('download'), skip: Boolean(anchor.closest('[data-care-orbit-ignore]')) })) return
      rememberNavigationFocus(); controller.begin(anchor.href, location.href)
      if (!navigator.onLine) controller.connection(false)
    }
    const submit = (event: SubmitEvent) => {
      const form = event.target
      if (event.defaultPrevented || !(form instanceof HTMLFormElement) || form.closest('[data-care-orbit-ignore]')) return
      const button = event.submitter instanceof HTMLButtonElement || event.submitter instanceof HTMLInputElement ? event.submitter : null
      const method = button?.getAttribute('formmethod') || form.method
      const target = button?.getAttribute('formtarget') || form.target
      if (method.toLowerCase() !== 'get' || target && target !== '_self') return
      const url = new URL(button?.getAttribute('formaction') || form.action, location.href)
      url.search = ''
      const fields = new FormData(form)
      for (const [key, value] of fields) if (typeof value === 'string') url.searchParams.append(key, value)
      if (button?.name) url.searchParams.append(button.name, button.value)
      if (navigationTarget(url.href, location.href)) {rememberNavigationFocus(); controller.begin(url.href, location.href); if (!navigator.onLine) controller.connection(false)}
    }
    const history = () => controller.history(location.href)
    const restore = () => controller.dismiss()
    const offline = () => controller.connection(false)
    const online = () => controller.connection(true)
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismissNavigation() }
    // Bubble phase honours cancelled native links/forms. Next Link is tracked by onNavigate.
    document.addEventListener('click', click)
    document.addEventListener('submit', submit)
    document.addEventListener('keydown', escape)
    window.addEventListener('popstate', history)
    window.addEventListener('pageshow', restore)
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      document.removeEventListener('click', click); document.removeEventListener('submit', submit); document.removeEventListener('keydown', escape)
      window.removeEventListener('popstate', history); window.removeEventListener('pageshow', restore); window.removeEventListener('offline', offline); window.removeEventListener('online', online)
      controller.dismiss()
    }
  }, [])
  return null
}
export function CareOrbitNavigation() {
  const state = useSyncExternalStore(subscribeNavigation, navigationSnapshot, serverSnapshot)
  return <><NavigationObserver/><Suspense fallback={null}><RouteObserver/></Suspense>{state.visible && state.phase !== 'idle' && typeof document !== 'undefined' ? createPortal(<div className={styles.stage} data-care-orbit-overlay><CareOrbitCard locale={state.locale} phase={state.phase} target={state.target} onDismiss={dismissNavigation}/></div>, document.body) : null}</>
}
