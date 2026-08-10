import { proxyAc360RequestToOps } from '@/lib/ac360-portability/ops-bridge'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  return proxyAc360RequestToOps(request, '/api/operation-completion/autonomous')
}
export async function POST(request: Request) {
  return proxyAc360RequestToOps(request, '/api/operation-completion/autonomous')
}
