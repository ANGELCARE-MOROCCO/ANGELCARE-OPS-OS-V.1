import QuoteCartPageClient from '@/components/b2b-marketplace/QuoteCartPageClient'
import { getQuoteSettings } from '@/lib/b2b-marketplace/repository'

export default async function QuoteCartPage() {
  const settings = await getQuoteSettings()
  return <QuoteCartPageClient settings={settings} />
}
