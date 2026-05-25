import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getConnectRooms } from '@/lib/connect/connect-repository'

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ rooms: [], error: 'Unauthorized' }, { status: 401 })
    const rooms = await getConnectRooms(user as any)
    return NextResponse.json({ rooms })
  } catch (error) {
    return NextResponse.json({ rooms: [], error: error instanceof Error ? error.message : 'Load Connect rooms failed' }, { status: 500 })
  }
}
