import { NextResponse } from 'next/server'
import { getAcademyTrainer, updateAcademyTrainer } from '@/lib/academy-trainers/repository'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params
    const data = await getAcademyTrainer(params.id)
    if (!data) return NextResponse.json({ ok: false, error: 'Trainer not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load trainer' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await context.params
    const body = await request.json().catch(() => ({}))
    const data = await updateAcademyTrainer(params.id, body)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to update trainer' }, { status: 500 })
  }
}
