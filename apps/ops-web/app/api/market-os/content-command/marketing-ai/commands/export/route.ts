import { requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { serializeMarketingAiCommandsCsv } from '@/lib/market-os/marketing-ai/csv'
import { listMarketingAiCommands } from '@/lib/market-os/marketing-ai/repository'

export async function GET() {
  await requireMarketingAiUser('view')
  const result = await listMarketingAiCommands({ page: 1, pageSize: 5000 })
  return new Response(serializeMarketingAiCommandsCsv(result.items), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="sanila-marketing-ai-command-registry.csv"' } })
}
