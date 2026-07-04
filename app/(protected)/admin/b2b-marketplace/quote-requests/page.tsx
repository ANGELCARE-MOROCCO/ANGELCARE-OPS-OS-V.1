import QuoteRequestsCRMPage from '@/components/b2b-marketplace/QuoteRequestsCRMPage'

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <QuoteRequestsCRMPage searchParams={await searchParams} />
}
