import { handleTemplateVersions } from '@/angelcare-marketplace/enterprise-command/api-handlers'
import type { DocumentTemplateKey } from '@/angelcare-marketplace/enterprise-command/types'
export async function GET(request:Request,{params}:{params:Promise<{templateKey:string}>}){return handleTemplateVersions(request,(await params).templateKey as DocumentTemplateKey)}
export async function POST(request:Request,{params}:{params:Promise<{templateKey:string}>}){return handleTemplateVersions(request,(await params).templateKey as DocumentTemplateKey)}
