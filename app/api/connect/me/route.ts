import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { toConnectUser, touchConnectPresence } from '@/lib/connect/connect-repository'

export async function GET(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ user: null, error: 'Unauthorized' }, { status: 401 })
    const route = new URL(req.url).searchParams.get('route')
    await touchConnectPresence(user as any, route)
    return NextResponse.json({ user: toConnectUser(user as any) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Connect me failed' }, { status: 500 })
  }
}
