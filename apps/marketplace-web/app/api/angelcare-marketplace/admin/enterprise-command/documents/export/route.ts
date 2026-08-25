import{handleDocumentExport}from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function POST(request:Request){return handleDocumentExport(request)}
