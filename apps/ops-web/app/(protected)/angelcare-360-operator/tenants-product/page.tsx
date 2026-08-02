import Link from 'next/link'
import ProductKernelStudio, { type ProductKernelMode } from '@/components/angelcare360/operator/product-kernel/ProductKernelStudio'
import { loadProductKernelSnapshot } from '@/lib/angelcare360/operator/product-kernel'

export const dynamic = 'force-dynamic'

const MODES = new Set<ProductKernelMode>(['catalogue','modules','features','addons','meters','packages','pricing','compatibility','deployments','scanner','versions'])

export default async function Angelcare360OperatorProductKernelPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const snapshot = await loadProductKernelSnapshot()
  const query = await searchParams
  const requested = Array.isArray(query.view) ? query.view[0] : query.view
  const initialMode: ProductKernelMode = requested && MODES.has(requested as ProductKernelMode) ? requested as ProductKernelMode : 'catalogue'
  return <><div style={{display:'flex',justifyContent:'flex-end',padding:'10px 18px 0'}}><Link href="/angelcare-360-operator/tenants-product/constitution" style={{padding:'10px 14px',borderRadius:12,background:'#0f2747',color:'#fff',textDecoration:'none',fontSize:11,fontWeight:850}}>Ouvrir la Constitution Produit</Link></div><ProductKernelStudio initialSnapshot={snapshot} initialMode={initialMode} /></>
}
