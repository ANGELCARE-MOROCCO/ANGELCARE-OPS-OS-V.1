import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { buildExperienceDeveloperContract, developerContractCsv, developerContractTxt } from '@/angelcare-marketplace/experience-builder/developer-contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await requireMarketplaceApiContext('marketplace.cms.export')
  const format = new URL(request.url).searchParams.get('format') || 'json'
  const contract = buildExperienceDeveloperContract()
  const headers = { 'Cache-Control': 'no-store', 'X-Experience-Contract-SHA256': contract.contractHash }
  if (format === 'txt') return new Response(developerContractTxt(contract), { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="angelcare-experience-developer-contract.txt"' } })
  if (format === 'csv') return new Response(developerContractCsv(contract), { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="angelcare-experience-developer-contract.csv"' } })
  return new Response(JSON.stringify(contract, null, 2), { headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="angelcare-experience-developer-contract.json"' } })
}
