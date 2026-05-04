import { DatabaseCrudPage } from "@/app/components/market-os/database-crud-suite"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <DatabaseCrudPage domain="ambassador-program" resource="ambassador_payouts" mode="detail" recordId={id} title="Commissions & Payouts" description="" />
}
