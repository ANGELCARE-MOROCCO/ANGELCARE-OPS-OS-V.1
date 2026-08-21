import { governCustomerPlatformRoute } from '@/lib/runtime/customer-platform/governor'
import { NextResponse } from 'next/server'
import { getAngelcare360CustomerBroadcastSnapshot } from '@/lib/angelcare360/customer-broadcasts'

export const dynamic = 'force-dynamic'

async function GET__customerPlatformImpl(request: Request) {
  const snapshot = await getAngelcare360CustomerBroadcastSnapshot()
  const etag = `W/\"${snapshot.version}\"`

  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  }

  return NextResponse.json(snapshot, {
    headers: {
      ETag: etag,
      'Cache-Control': 'private, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export const GET = governCustomerPlatformRoute(
  { workloadClass: 'interactive', operation: 'GET:/api/angelcare360/customer-broadcasts' },
  GET__customerPlatformImpl,
)
