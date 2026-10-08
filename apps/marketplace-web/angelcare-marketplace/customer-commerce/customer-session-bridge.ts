/** Compatibility with existing implicit-flow email templates. Never log or persist tokens here. */
let pending: Promise<void> | null = null
export function establishCustomerFragmentSession(): Promise<void> {
  if (pending) return pending
  const fragment = new URLSearchParams(window.location.hash.slice(1))
  if (!fragment.has('access_token') && !fragment.has('error')) return Promise.resolve()
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  if (fragment.has('error')) return Promise.reject(new Error('Invalid link'))
  pending = (async () => {
    const accessToken = fragment.get('access_token'), refreshToken = fragment.get('refresh_token')
    if (!accessToken || !refreshToken) throw new Error('Incomplete link')
    const response = await fetch('/api/angelcare-marketplace/customer/auth/session', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accessToken, refreshToken }), signal: AbortSignal.timeout(40000) })
    if (!response.ok) throw new Error('Invalid session')
  })()
  return pending
}
