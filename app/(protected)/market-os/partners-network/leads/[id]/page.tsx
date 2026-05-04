import { DatabaseCrudPage } from "@/app/components/market-os/database-crud-suite"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <DatabaseCrudPage domain="partners-network" resource="partner_leads" mode="detail" recordId={id} title="Partner Lead Engine" description="" />
}
