export type CareLocale = 'fr' | 'en' | 'ar'
export type NavigationPhase = 'idle' | 'pending' | 'slow' | 'offline'
export type NavigationState = { id: number; phase: NavigationPhase; visible: boolean; target: string | null; from: string; locale: CareLocale }
export const IDLE: NavigationState = Object.freeze({ id: 0, phase: 'idle', visible: false, target: null, from: '', locale: 'fr' })
export const copy = {
  fr: { title: 'Votre page arrive…', body: 'Nous ouvrons votre destination', slow: 'Cela prend un peu plus de temps.', slowBody: 'Vous pouvez patienter ou ouvrir la destination directement.', offline: 'Votre connexion fait une pause.', offlineBody: 'Reconnectez-vous pour poursuivre votre visite.', close: 'Masquer le chargement', direct: 'Ouvrir la page', dismiss: 'Masquer', brand: 'AngelCare Marketplace' },
  en: { title: 'Your page is on its way…', body: 'Opening your destination', slow: 'This is taking a little longer.', slowBody: 'You can wait or open the destination directly.', offline: 'Your connection is taking a break.', offlineBody: 'Reconnect to continue exploring.', close: 'Hide loading indicator', direct: 'Open page', dismiss: 'Hide', brand: 'AngelCare Marketplace' },
  ar: { title: 'صفحتك في الطريق…', body: 'نفتح وجهتك الآن', slow: 'يستغرق هذا وقتاً أطول قليلاً.', slowBody: 'يمكنك الانتظار أو فتح الوجهة مباشرة.', offline: 'اتصالك يأخذ استراحة.', offlineBody: 'أعد الاتصال لمتابعة التصفح.', close: 'إخفاء مؤشر التحميل', direct: 'فتح الصفحة', dismiss: 'إخفاء', brand: 'سوق أنجل كير' },
} as const
export function publicRoute(path: string): boolean {
  // Public storefronts AND authenticated customer surfaces; never operator/tenant worlds.
  return /^\/angelcare-marketplace(?:\/(?:fr|en|ar)(?:\/|$)|\/family(?:\/|$)|\/?$)/.test(path)
    && !/\/(?:admin|partner|trainer|workspace|preview)(?:\/|$)/.test(path)
}
export function localeFor(path: string): CareLocale {
  return (path.match(/^\/angelcare-marketplace\/(fr|en|ar)(?:\/|$)/)?.[1] as CareLocale) || 'fr'
}
export function routeKey(url: URL): string { return url.pathname.replace(/\/$/, '') + url.search }
export function navigationTarget(href: string, current: string, allowSame = false): string | null {
  try {
    const from = new URL(current), to = new URL(href, from)
    if (!['http:', 'https:'].includes(to.protocol) || to.origin !== from.origin || !publicRoute(from.pathname) || !publicRoute(to.pathname)) return null
    if (!allowSame && routeKey(to) === routeKey(from)) return null
    return to.pathname + to.search + to.hash
  } catch { return null }
}
export function eligibleClick(event: { button: number; metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean; defaultPrevented: boolean }, anchor: { target: string; download: boolean; skip: boolean }): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.defaultPrevented && (!anchor.target || anchor.target === '_self') && !anchor.download && !anchor.skip
}
type Clock = { set: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>; clear: (timer: ReturnType<typeof setTimeout>) => void }
const clock: Clock = { set: (fn, ms) => setTimeout(fn, ms), clear: timer => clearTimeout(timer) }
export class CareNavigationController {
  private state: NavigationState = IDLE
  private listeners = new Set<() => void>()
  private timers: ReturnType<typeof setTimeout>[] = []
  private boundaries = new Set<symbol>()
  private sequence = 0
  private committed = false
  private lastRoute = ''
  constructor(private time: Clock = clock) {}
  getSnapshot = () => this.state
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private emit(next: NavigationState) { this.state = next; for (const fn of this.listeners) fn() }
  private clearTimers() { for (const timer of this.timers) this.time.clear(timer); this.timers = [] }
  begin(href: string, current: string, allowSame = false): number | null {
    const target = navigationTarget(href, current, allowSame)
    if (!target) return null
    this.clearTimers(); this.committed = false
    const id = ++this.sequence
    this.emit({ id, visible: false, phase: 'pending', target, from: routeKey(new URL(current)), locale: localeFor(new URL(target, current).pathname) })
    this.timers.push(this.time.set(() => { if (this.state.id === id && this.state.phase !== 'idle') this.emit({ ...this.state, visible: true }) }, 120))
    this.timers.push(this.time.set(() => { if (this.state.id === id && this.state.phase !== 'idle') this.emit({ ...this.state, visible: true, phase: this.state.phase === 'offline' ? 'offline' : 'slow' }) }, 12000))
    return id
  }
  history(current: string): number | null {
    if (!publicRoute(new URL(current).pathname)) { this.dismiss(); return null }
    const prior = this.lastRoute
    const id = this.begin(current, current, true)
    if (id && prior) this.emit({ ...this.state, from: prior })
    return id
  }
  hold(current: string): () => void {
    if (!publicRoute(new URL(current).pathname)) return () => {}
    const key = Symbol('route-loading'); this.boundaries.add(key)
    if (this.state.phase === 'idle') this.begin(current, current, true)
    const id = this.state.id
    this.emit({ ...this.state, visible: true })
    return () => {
      this.boundaries.delete(key)
      // A removed loading boundary means resolved content, error, or an aborted navigation.
      if (!this.boundaries.size) this.finish(id === this.state.id || this.committed ? this.state.id : id)
    }
  }
  route(current: string) {
    const url = new URL(current), key = routeKey(url)
    this.lastRoute = key
    if (!publicRoute(url.pathname)) { this.dismiss(); return }
    if (this.state.phase === 'idle') return
    const target = this.state.target ? routeKey(new URL(this.state.target, url)) : ''
    if (key === target || key !== this.state.from) this.finish(this.state.id)
  }
  finish(id: number | null) {
    if (!id || id !== this.state.id || this.state.phase === 'idle') return
    this.committed = true
    if (this.boundaries.size) return
    this.dismiss()
  }
  connection(online: boolean) {
    if (this.state.phase === 'idle') return
    this.emit({ ...this.state, phase: online ? 'slow' : 'offline', visible: true })
  }
  dismiss = () => { this.clearTimers(); this.committed = false; this.emit({ ...IDLE, id: this.state.id }) }
  dispose() { this.dismiss(); this.boundaries.clear(); this.listeners.clear() }
}
