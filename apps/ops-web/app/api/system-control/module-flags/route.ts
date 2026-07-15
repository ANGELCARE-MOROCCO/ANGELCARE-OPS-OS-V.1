import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isAdmin(user: any) {
  return ['ceo', 'admin', 'super_admin', 'owner'].includes(String(user?.role || '').toLowerCase())
}

export async function GET() {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('system_module_flags')
      .select('module_key,module_label,enabled,status,reason,last_action,updated_at,updated_by_email')
      .order('module_label', { ascending: true })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      canManage: isAdmin(user),
      data: data || [],
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to load module flags.' },
      { status: 500 },
    )
  }
}
