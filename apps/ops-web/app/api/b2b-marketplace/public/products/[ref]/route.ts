import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/b2b-marketplace/repository'

export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const product = await getProduct(decodeURIComponent(ref))
  if (!product) return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ ok: true, data: product })
}
