import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createCall, getCalls } from '@/lib/connect/connect-repository'

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ calls: [], error: 'Unauthorized' }, { status: 401 })
    const calls = await getCalls(user as any)
    return NextResponse.json({ calls })
  } catch (error) {
    return NextResponse.json({ calls: [], error: error instanceof Error ? error.message : 'Load Connect calls failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const call = await createCall(user as any, await req.json())
    return NextResponse.json({ call })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect call failed'
    return NextResponse.json({ error: message }, { status: message.toLowerCase().includes('private') ? 403 : 500 })
  }
}
