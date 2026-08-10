import { proxyAc360RequestToOps } from '@/lib/ac360-portability/ops-bridge'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return proxyAc360RequestToOps(
    request,
    `/api/storage/download/${encodeURIComponent(String(id || ''))}`,
  )
}
