import { NextResponse } from 'next/server'
import { getOptionsSummary, handleOptionsWorkflowAction } from '../../../../lib/saas-factory/options-runtime'
import { listFactoryOptions, saveFactoryOption } from '@/lib/saas-factory/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const group = url.searchParams.get('group')
    const detailed = url.searchParams.get('detailed') === '1'
    if (detailed) return NextResponse.json({ ok: true, summary: await getOptionsSummary() })
    const result = await listFactoryOptions()
    const options = group ? result.data.filter((option) => option.group_key === group) : result.data
    return NextResponse.json({ ok: true, options, source: result.source, sourceConfidence: result.source === 'supabase' ? 'live' : 'fallback', error: result.error || null })
  } catch (error: any) {
    return NextResponse.json({ ok: false, options: [], error: error?.message || 'Unknown SaaS Factory options API error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const result = await saveFactoryOption(body)
    return NextResponse.json(result, { status: result.ok === false ? 500 : 200 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown SaaS Factory option save error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  return POST(request)
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = await handleOptionsWorkflowAction('blocked_delete', body)
  return NextResponse.json(result, { status: 200 })
}
