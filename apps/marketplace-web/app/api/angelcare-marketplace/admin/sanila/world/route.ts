import { NextRequest, NextResponse } from 'next/server'
import type { Data } from '@puckeditor/core'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { getSanilaWorldState, publishSanilaWorld, saveSanilaWorldImport, saveSanilaWorldPage } from '@/angelcare-marketplace/sanila-world/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireMarketplaceApiContext('marketplace.public.inquiries.manage')
    return NextResponse.json({ ok: true, state: await getSanilaWorldState() })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Accès refusé.' }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireMarketplaceApiContext('marketplace.public.inquiries.manage')
    const body = await request.json() as Record<string, unknown>
    const action = String(body.action || '')
    if (action === 'register_import') {
      const packageName = String(body.packageName || '').slice(0, 240)
      const fingerprint = String(body.fingerprint || '').slice(0, 128)
      if (!packageName || !fingerprint) return NextResponse.json({ ok: false, error: 'Package SANILA incomplet.' }, { status: 422 })
      return NextResponse.json({ ok: true, state: await saveSanilaWorldImport({ packageName, fingerprint, context }) })
    }
    if (action === 'save_page') {
      const slug = String(body.slug || '')
      const data = body.data as Data
      if (!slug || !data || typeof data !== 'object') return NextResponse.json({ ok: false, error: 'Document SANILA invalide.' }, { status: 422 })
      return NextResponse.json({ ok: true, state: await saveSanilaWorldPage({ slug, data, context }) })
    }
    if (action === 'publish') return NextResponse.json({ ok: true, state: await publishSanilaWorld(context) })
    return NextResponse.json({ ok: false, error: 'Action SANILA inconnue.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Action SANILA impossible.' }, { status: 400 })
  }
}
