import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextResponse } from 'next/server'
import { getSovereignPulseSnapshot } from '@/lib/angelcare360/operator/sovereign-pulse'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'
import { createEmailOSCoreDb } from '@/lib/email-os-core/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const snapshot = await getSovereignPulseSnapshot()
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return NextResponse.json({ error: publicAngelcare360Error(error) }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAngelcare360OperatorPermission('operator.audit.view')
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const operation = String(body.operation || '')
    const payload = (body.payload && typeof body.payload === 'object' ? body.payload : {}) as Record<string, unknown>
    const supabase = createEmailOSCoreDb()

    if (operation === 'preference.save') {
      const { error } = await supabase.from('angelcare360_operator_pulse_preferences').upsert({
        user_id: session.user.id,
        display_mode: String(payload.displayMode || 'desk'),
        privacy_mode: String(payload.privacyMode || 'team_safe'),
        active_scene: String(payload.activeScene || 'overview'),
        rotation_seconds: Number(payload.rotationSeconds || 24),
        reduced_motion: Boolean(payload.reducedMotion),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (operation === 'alert.acknowledge') {
      const { error } = await supabase.from('angelcare360_operator_pulse_alert_acknowledgements').insert({
        alert_key: String(payload.alertKey || 'unknown'),
        alert_title: String(payload.alertTitle || 'Alerte Sovereign Pulse'),
        acknowledged_by: session.user.id,
        note: String(payload.note || 'Acknowledged from Sovereign Pulse'),
      })
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (operation === 'snapshot.capture') {
      const snapshot = await getSovereignPulseSnapshot()
      const { error } = await supabase.from('angelcare360_operator_pulse_snapshots').insert({
        captured_by: session.user.id,
        global_health: snapshot.globalHealth,
        source_state: snapshot.sourceState,
        snapshot,
      })
      if (error) throw error
      return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt })
    }

    return NextResponse.json({ error: 'Opération Sovereign Pulse inconnue.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: publicAngelcare360Error(error) }, { status: 400 })
  }
}
