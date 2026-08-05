import { NextResponse } from 'next/server'
import { deleteMasteryRecord, errorPayload, getMasteryRecord, updateMasteryRecord } from '@/lib/service-design-mastery/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ domain: string; id: string }> }

export async function GET(_: Request, context: Context) {
  try {
    const { domain, id } = await context.params
    return NextResponse.json({ ok: true, data: await getMasteryRecord(domain, id) })
  } catch (error) {
    const payload = errorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { domain, id } = await context.params
    const body = await request.json()
    return NextResponse.json({ ok: true, data: await updateMasteryRecord(domain, id, body) })
  } catch (error) {
    const payload = errorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const { domain, id } = await context.params
    return NextResponse.json({ ok: true, data: await deleteMasteryRecord(domain, id) })
  } catch (error) {
    const payload = errorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
