import ProductRealityControlCenter from '@/components/angelcare360/operator/product-reality/ProductRealityControlCenter'
import { getProductRealitySnapshot } from '@/lib/angelcare360/server/product-reality'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams?: Promise<{ schoolId?: string }> }

export default async function ProductRealityAuthorityPage({ searchParams }: PageProps) {
  const params = await searchParams
  return <ProductRealityControlCenter initialSnapshot={await getProductRealitySnapshot({ authority: 'operator', schoolId: params?.schoolId || null })} />
}
