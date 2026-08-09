export async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input.normalize('NFC').trim())
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value)=>value.toString(16).padStart(2,'0')).join('')
}
export function stableSemanticKey(parts: Array<string|undefined|null>): string {
  return parts.filter(Boolean).map((p)=>String(p).trim().toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')).filter(Boolean).join('.')
}
