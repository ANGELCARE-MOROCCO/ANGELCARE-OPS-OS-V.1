import { NextResponse } from 'next/server'
import { getCategory, listProducts } from '@/lib/b2b-marketplace/repository'

export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return NextResponse.json({ ok: false, error: 'Category not found' }, { status: 404 })
  return NextResponse.json({ ok: true, data: { category, products: await listProducts({ categorySlug: slug }) } })
}
