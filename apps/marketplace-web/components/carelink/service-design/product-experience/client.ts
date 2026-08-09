export async function productExperienceApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body?.ok) throw new Error(body?.error || 'Action Service Design impossible.')
  return body.data as T
}
