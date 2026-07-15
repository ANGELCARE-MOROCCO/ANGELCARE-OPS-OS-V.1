import { NextResponse } from 'next/server'
import { getAc360CurrentContext } from '@/lib/ac360/runtime'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId') || undefined
  const result = await getAc360CurrentContext(orgId)
  const response = NextResponse.json(result, { status: result.ok ? 200 : 500 })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
