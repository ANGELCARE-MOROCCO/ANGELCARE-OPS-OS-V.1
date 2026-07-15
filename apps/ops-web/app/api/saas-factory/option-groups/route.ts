import { NextResponse } from 'next/server'
import { listFactoryOptionGroups, saveFactoryOptionGroup } from '@/lib/saas-factory/server'
import { handleOptionsWorkflowAction } from '../../../../lib/saas-factory/options-runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await listFactoryOptionGroups()
    return NextResponse.json({ ok: true, groups: result.data, source: result.source, sourceConfidence: result.source === 'supabase' ? 'live' : 'fallback', error: result.error || null })
  } catch (error: any) {
    return NextResponse.json({ ok: false, groups: [], error: error?.message || 'Unknown SaaS Factory option groups API error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await saveFactoryOptionGroup(body)
    return NextResponse.json(result, { status: result.ok === false ? 500 : 200 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown SaaS Factory option group save error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  return POST(request)
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await handleOptionsWorkflowAction('blocked_delete', { ...body, type: 'option_group' })
  return NextResponse.json(result, { status: 200 })
}
