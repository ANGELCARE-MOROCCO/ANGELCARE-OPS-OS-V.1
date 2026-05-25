import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getConnectStaff } from '@/lib/connect/connect-repository'

export async function GET(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ staff: [], error: 'Unauthorized' }, { status: 401 })
    const query = new URL(req.url).searchParams.get('q')
    const staff = await getConnectStaff(user as any, query)
    return NextResponse.json({ staff })
  } catch (error) {
    return NextResponse.json({ staff: [], error: error instanceof Error ? error.message : 'Load Connect staff failed' }, { status: 500 })
  }
}
