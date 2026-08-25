import ProductConstitutionStudio from '@/components/angelcare360/operator/product-constitution/ProductConstitutionStudio'
import { loadProductConstitutionSnapshot } from '@/lib/angelcare360/operator/product-constitution'
export default async function Page(){return <ProductConstitutionStudio initialSnapshot={await loadProductConstitutionSnapshot()}/>}
