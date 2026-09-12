import { handleProductImportJobRollback } from '@/angelcare-marketplace/enterprise-command/api-handlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params
  return handleProductImportJobRollback(request, jobId)
}
