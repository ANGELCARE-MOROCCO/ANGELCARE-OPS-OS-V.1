import { governRoute } from '@/lib/runtime/governor/route'
import { marketingAiCommandCsvTemplate } from '@/lib/market-os/marketing-ai/csv'
import { requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'

async function GET__angelcareGovernedImpl() {
  await requireMarketingAiUser('view')
  return new Response(marketingAiCommandCsvTemplate(), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="marketing-ai-command-import-template.csv"' } })
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/commands/template',
  },
  GET__angelcareGovernedImpl,
)
