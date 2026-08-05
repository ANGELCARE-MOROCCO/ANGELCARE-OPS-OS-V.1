import { NextResponse } from 'next/server'
import { errorPayload, runMasteryAction } from '@/lib/service-design-mastery/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ domain: string; id: string }> }

export async function POST(request: Request, context: Context) {
  try {
    const { domain, id } = await context.params
    const body = await request.json()
    return NextResponse.json({ ok: true, data: await runMasteryAction(domain, id, body) })
  } catch (error) {
    const payload = errorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
