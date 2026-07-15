import { NextResponse } from 'next/server'
import { executeModuleAction, getModuleDetail } from '@/lib/saas-factory/modules-command-runtime'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ key: string }> }

export async function GET(_request: Request, context: Ctx) {
  try {
    const { key } = await context.params
    const result = await getModuleDetail(key)
    return NextResponse.json(result, { status: result.ok ? 200 : 404 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown module detail error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const { key } = await context.params
    const body = await request.json().catch(() => ({}))
    const result = await executeModuleAction('update', { ...body, key, module: { ...body.module, key } })
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown module update error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const { key } = await context.params
    const result = await executeModuleAction('delete', { key })
    return NextResponse.json(result, { status: 409 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown module delete block error' }, { status: 500 })
  }
}
