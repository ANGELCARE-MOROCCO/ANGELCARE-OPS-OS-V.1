import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { STAFF_PROFILE_PHOTO_BUCKET } from '@/lib/users/profile-photo-constants'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function canReadProfilePhoto(actor: any, targetUserId: string) {
  if (String(actor?.id || '') === targetUserId) return true

  const role = String(actor?.role || '').trim().toLowerCase()
  if (['ceo', 'owner', 'super_admin', 'admin', 'manager', 'hr'].includes(role)) return true

  const permissions = Array.isArray(actor?.permissions) ? actor.permissions.map(String) : []
  return (
    permissions.includes('*') ||
    permissions.includes('users.view') ||
    permissions.includes('users.manage') ||
    permissions.some((permission: string) => permission.startsWith('page:/users'))
  )
}

export async function GET(_request: Request, context: RouteContext) {
  const actor = await getCurrentAppUser()
  if (!actor) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { id } = await context.params
  if (!canReadProfilePhoto(actor, id)) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('profile_photo_path')
    .eq('id', id)
    .maybeSingle()

  if (userError || !user?.profile_photo_path) {
    return new NextResponse(null, { status: 404 })
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(STAFF_PROFILE_PHOTO_BUCKET)
    .download(String(user.profile_photo_path))

  if (downloadError || !file) {
    return new NextResponse(null, { status: 404 })
  }

  const bytes = await file.arrayBuffer()

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': file.type || 'image/jpeg',
      'Content-Length': String(file.size),
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
