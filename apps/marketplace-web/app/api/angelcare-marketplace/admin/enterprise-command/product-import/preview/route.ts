import{handleProductImportPreview}from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function POST(request:Request){return handleProductImportPreview(request)}
