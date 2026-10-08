import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'

import { NextRequest, NextResponse } from 'next/server'
import { getBrandAssetResponse } from '@/lib/angelcare360/operator/branding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = request.nextUrl.searchParams.get('token')
    const { asset, bytes } = await getBrandAssetResponse(id, token)
    return new NextResponse(bytes, {
      headers: {
        'content-type': String(asset.mime_type || 'application/octet-stream'),
        'content-length': String(bytes.byteLength),
        'cache-control': token ? 'public, max-age=86400, immutable' : 'private, max-age=300',
        etag: `"${String(asset.sha256_hash || '')}"`,
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 404 })
  }
}
