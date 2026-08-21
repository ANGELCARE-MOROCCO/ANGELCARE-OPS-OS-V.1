import { governRoute } from '@/lib/runtime/governor/route'
import { requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { serializeMarketingAiCommandsCsv } from '@/lib/market-os/marketing-ai/csv'
import { listMarketingAiCommands } from '@/lib/market-os/marketing-ai/repository'

async function GET__angelcareGovernedImpl() {
  await requireMarketingAiUser('view')
  const result = await listMarketingAiCommands({ page: 1, pageSize: 5000 })
  return new Response(serializeMarketingAiCommandsCsv(result.items), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="sanila-marketing-ai-command-registry.csv"' } })
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/commands/export',
  },
  GET__angelcareGovernedImpl,
)
