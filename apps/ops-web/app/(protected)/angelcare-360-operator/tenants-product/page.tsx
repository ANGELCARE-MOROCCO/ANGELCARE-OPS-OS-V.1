import ProductKernelStudio, { type ProductKernelMode } from '@/components/angelcare360/operator/product-kernel/ProductKernelStudio'
import { loadProductKernelSnapshot } from '@/lib/angelcare360/operator/product-kernel'

export const dynamic = 'force-dynamic'

const MODES = new Set<ProductKernelMode>(['catalogue','modules','features','addons','meters','packages','pricing','compatibility','deployments','scanner','versions'])

export default async function Angelcare360OperatorProductKernelPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const snapshot = await loadProductKernelSnapshot()
  const query = await searchParams
  const requested = Array.isArray(query.view) ? query.view[0] : query.view
  const initialMode: ProductKernelMode = requested && MODES.has(requested as ProductKernelMode) ? requested as ProductKernelMode : 'catalogue'
  return <ProductKernelStudio initialSnapshot={snapshot} initialMode={initialMode} />
}
