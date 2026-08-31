import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeProductRealityCommand, getProductRealitySnapshot } from '@/lib/angelcare360/server/product-reality'
import type { ProductRealityCommandRequest } from '@/types/angelcare360/product-reality'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authority = request.nextUrl.searchParams.get('authority') === 'operator' ? 'operator' : 'customer'
    const schoolId = request.nextUrl.searchParams.get('schoolId')
    return NextResponse.json({ ok: true, snapshot: await getProductRealitySnapshot({ authority, schoolId }) })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ProductRealityCommandRequest | null
    if (!body?.operationKey) return NextResponse.json({ ok: false, error: 'operationKey est requis.' }, { status: 422 })
    const result = await executeProductRealityCommand(body)
    return NextResponse.json(result, { status: result.ok ? 200 : 409 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 500 })
  }
}
