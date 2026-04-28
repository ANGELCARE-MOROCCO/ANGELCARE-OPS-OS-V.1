import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireRole(['ceo'])
  const { id } = await params
  const supabase = await createClient()

  if (actor.id === id) {
    return NextResponse.redirect(new URL(`/users/${id}?error=self_delete_blocked`, request.url))
  }

  await supabase.from('app_sessions').delete().eq('user_id', id)

  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.redirect(new URL(`/users/${id}?error=delete_failed`, request.url))
  }

  await supabase.from('app_audit_logs').insert([
    {
      actor_user_id: actor.id,
      action: 'delete_user',
      target_table: 'app_users',
      target_id: id,
      details: { deleted_user_id: id },
    },
  ])

  return NextResponse.redirect(new URL('/users', request.url))
}