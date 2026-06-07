import { NextResponse } from 'next/server'
import { createAcademyTrainer, listAcademyTrainers } from '@/lib/academy-trainers/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await listAcademyTrainers()
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load trainers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const data = await createAcademyTrainer(body)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to create trainer' }, { status: 500 })
  }
}
