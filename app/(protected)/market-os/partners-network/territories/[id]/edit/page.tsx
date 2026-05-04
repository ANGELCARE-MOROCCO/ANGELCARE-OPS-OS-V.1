import { DatabaseCrudPage } from "@/components/market-os/database-crud-suite"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <DatabaseCrudPage domain="partners-network" resource="partner_territories" mode="edit" recordId={id} title="Edit Territory & Market Control" description="" />
}
