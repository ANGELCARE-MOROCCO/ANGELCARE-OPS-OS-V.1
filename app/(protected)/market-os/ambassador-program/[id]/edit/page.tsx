import { DatabaseCrudPage } from "@/components/market-os/database-crud-suite"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <DatabaseCrudPage domain="ambassador-program" resource="ambassadors" mode="edit" recordId={id} title="Edit Ambassador Profiles" description="" />
}
