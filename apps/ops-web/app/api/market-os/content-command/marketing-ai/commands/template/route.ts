import { marketingAiCommandCsvTemplate } from '@/lib/market-os/marketing-ai/csv'
import { requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'

export async function GET() {
  await requireMarketingAiUser('view')
  return new Response(marketingAiCommandCsvTemplate(), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="marketing-ai-command-import-template.csv"' } })
}
