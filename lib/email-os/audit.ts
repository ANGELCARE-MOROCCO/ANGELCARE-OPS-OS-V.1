type AuditPayload = Record<string, unknown>

export async function auditEmailAction(action: string, payload: AuditPayload = {}) {
  try {
    const { db } = await import('./supabase')
    const supabase = await db()
    if (!supabase || typeof (supabase as any).from !== 'function') {
      return { ok: true, mode: 'local', action, payload }
    }
    await (supabase as any).from('email_os_audit').insert({
      action,
      payload,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Build-safe and runtime-safe: audit must never break email routes.
  }

  return { ok: true, action, payload }
}
