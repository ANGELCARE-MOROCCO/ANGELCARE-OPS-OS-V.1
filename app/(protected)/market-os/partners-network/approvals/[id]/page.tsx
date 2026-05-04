import { DatabaseCrudPage } from "@/app/components/market-os/database-crud-suite"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <DatabaseCrudPage domain="partners-network" resource="partner_approvals" mode="detail" recordId={id} title="Validation & Compliance" description="" />
}
