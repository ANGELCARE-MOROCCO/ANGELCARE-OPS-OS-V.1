export type RetryOptions = { attempts?: number; baseDelayMs?: number; maxDelayMs?: number; signal?: AbortSignal; retryable?: (error: unknown) => boolean }
export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
}
export function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  return !/(401|403|INVALID|REVOKED|BLOCKED|ACCESS_CHANGED|APPROVAL_REQUIRED|UNAUTHORIZED)/i.test(message)
}
export async function withRetry<T>(operation: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const base = Math.max(50, options.baseDelayMs ?? 250)
  const max = Math.max(base, options.maxDelayMs ?? 4000)
  let last: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(attempt) }
    catch (error) {
      last = error
      if (attempt >= attempts || !(options.retryable || isRetryableError)(error)) throw error
      const jitter = Math.floor(Math.random() * 120)
      await sleep(Math.min(max, base * 2 ** (attempt - 1)) + jitter, options.signal)
    }
  }
  throw last
}
export function onlineState() { return typeof navigator === 'undefined' || navigator.onLine !== false }
export function normalizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'UNKNOWN_ERROR')
  const code = message.split(':')[0].slice(0, 100)
  return { code, message: message.slice(0, 500) }
}
