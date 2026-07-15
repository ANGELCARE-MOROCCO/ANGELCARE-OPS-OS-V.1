import PackBuilderClient from '@/components/b2b-marketplace/PackBuilderClient'
import { listAcademyModules, listProducts } from '@/lib/b2b-marketplace/repository'
export default async function CustomPackBuilderPage() { return <PackBuilderClient products={await listProducts()} modules={await listAcademyModules()} /> }
