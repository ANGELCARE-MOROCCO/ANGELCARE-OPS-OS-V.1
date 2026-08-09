import { ArchetypePage } from '@/angelcare-marketplace/category-native/admin-pages'
export default async function Page({ params }: { params: Promise<{ schemaKey: string }> }){ const { schemaKey }=await params; return <ArchetypePage schemaKey={schemaKey}/> }
