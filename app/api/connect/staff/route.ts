import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getConnectStaff } from '@/lib/connect/connect-repository'

export async function GET(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: { staff: [] }, staff: [], error: 'Unauthorized' }, { status: 401 })
    const query = new URL(req.url).searchParams.get('q')
    const staff = await getConnectStaff(user as any, query)
    return NextResponse.json({ ok: true, data: { staff }, staff, error: null })
  } catch (error) {
    return NextResponse.json({ ok: false, data: { staff: [] }, staff: [], error: error instanceof Error ? error.message : 'Load Connect staff failed' }, { status: 500 })
  }
}
