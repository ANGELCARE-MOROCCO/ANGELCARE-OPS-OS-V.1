import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole(['ceo', 'manager'])

  const { id } = await params
  const form = await request.formData()
  const intent = String(form.get('intent') || '')

  if (!['suspend', 'restore'].includes(intent)) {
    return NextResponse.redirect(new URL(`/users/${id}?error=invalid_access_intent`, request.url))
  }

  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (authUser?.id === id) {
    return NextResponse.redirect(new URL(`/users/${id}?error=cannot_suspend_self`, request.url))
  }

  const nextStatus = intent === 'suspend' ? 'suspended' : 'active'

  const { error } = await supabase
    .from('app_users')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    const retry = await supabase
      .from('app_users')
      .update({ status: nextStatus })
      .eq('id', id)

    if (retry.error) {
      return NextResponse.redirect(new URL(`/users/${id}?error=access_update_failed`, request.url))
    }
  }

  return NextResponse.redirect(new URL(`/users/${id}?access=${nextStatus}`, request.url))
}
