import { NextResponse } from 'next/server'
import { getObservatoryProbe } from '@/lib/saas-factory/observatory'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> | { id: string } }

export async function GET(_request: Request, context: Context) {
  try {
    const params = await Promise.resolve(context.params as any)
    const result = await getObservatoryProbe(params.id)
    return NextResponse.json(result, { status: result.ok ? 200 : 404 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown Observatory probe detail error' }, { status: 500 })
  }
}
