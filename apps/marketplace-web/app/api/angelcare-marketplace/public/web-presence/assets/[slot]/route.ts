import { NextResponse } from 'next/server'
import { publicAsset, WebPresencePublicAssetError } from '@/angelcare-marketplace/web-presence/runtime'
import { parseScope, WebPresenceInputError } from '@/angelcare-marketplace/web-presence/schema'

const SLOTS = new Set(['favicon', 'icon', 'apple-touch-icon', 'manifest-192', 'manifest-512', 'mask-icon', 'organization-logo'])

export async function GET(request: Request, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params
  const requestReference = crypto.randomUUID()
  if (!SLOTS.has(slot)) {
    return NextResponse.json(
      { error: { code: 'ASSET_SLOT_NOT_FOUND', message: 'Slot Web Presence inconnu.' }, requestId: requestReference },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const url = new URL(request.url)
    const scope = parseScope(url.searchParams.get('scope'))
    const revision = Number(url.searchParams.get('revision') || 0)
    const asset = await publicAsset(slot, scope, revision)
    return new NextResponse(asset.blob, {
      status: 200,
      headers: {
        'Content-Type': asset.type,
        'Content-Length': String(asset.blob.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: asset.etag,
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `inline; filename="${asset.fileName.replace(/["\r\n]/g, '')}"`,
        'X-Web-Presence-Revision': String(asset.revision),
        'X-Web-Presence-Request-Id': requestReference,
      },
    })
  } catch (error) {
    if (error instanceof WebPresencePublicAssetError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message }, requestId: requestReference },
        { status: error.status, headers: { 'Cache-Control': 'no-store', 'X-Web-Presence-Asset-Error': error.code } },
      )
    }
    if (error instanceof WebPresenceInputError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message }, requestId: requestReference },
        { status: error.status, headers: { 'Cache-Control': 'no-store', 'X-Web-Presence-Asset-Error': error.code } },
      )
    }
    console.error(`[web-presence-public-asset:${requestReference}]`, error)
    return NextResponse.json(
      { error: { code: 'PUBLIC_ASSET_UNAVAILABLE', message: 'Le média Web Presence ne peut pas être livré actuellement.' }, requestId: requestReference },
      { status: 500, headers: { 'Cache-Control': 'no-store', 'X-Web-Presence-Asset-Error': 'PUBLIC_ASSET_UNAVAILABLE' } },
    )
  }
}
