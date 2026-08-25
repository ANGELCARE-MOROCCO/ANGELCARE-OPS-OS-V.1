import{handleTemplates}from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function GET(request:Request){return handleTemplates(request)}
export async function POST(request:Request){return handleTemplates(request)}
