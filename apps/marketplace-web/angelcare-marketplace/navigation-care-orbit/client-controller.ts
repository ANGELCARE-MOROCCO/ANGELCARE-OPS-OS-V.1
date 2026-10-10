import { CareNavigationController, IDLE } from './navigation-contract'
// Instantiate only in the browser; no mutable navigation state crosses SSR requests.
let client: CareNavigationController | undefined
let sourceFocus: HTMLElement | null = null
export function dismissNavigation() {
  const inside = document.activeElement?.closest('[data-care-orbit-card]')
  navigationController()?.dismiss()
  if (inside && sourceFocus?.isConnected) sourceFocus.focus({preventScroll: true})
}
export function rememberNavigationFocus() {sourceFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null}
export function navigationController(): CareNavigationController | undefined {
  if (typeof window === 'undefined') return undefined
  return client ||= new CareNavigationController()
}
export const serverSnapshot = () => IDLE
export const navigationSnapshot = () => navigationController()?.getSnapshot() || IDLE
export const subscribeNavigation = (fn: () => void) => navigationController()?.subscribe(fn) || (() => {})
export function beginNavigation(href: string, allowSame = false) {
  if (typeof window === 'undefined') return null
  rememberNavigationFocus()
  const controller = navigationController(), id = controller?.begin(href, window.location.href, allowSame) ?? null
  if (id && !navigator.onLine) controller?.connection(false)
  return id
}
export const careOrbitLocation = { assign: (href: string) => careOrbitNavigate(href), replace: (href: string) => careOrbitNavigate(href, 'replace') }
export function careOrbitNavigate(href: string, mode: 'assign' | 'replace' = 'assign') {
  const id = beginNavigation(href)
  try { window.location[mode](href) } catch (error) { navigationController()?.finish(id); throw error }
}
