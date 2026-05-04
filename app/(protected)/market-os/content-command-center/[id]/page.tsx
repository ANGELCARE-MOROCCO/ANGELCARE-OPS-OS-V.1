import ContentTaskEditor from "@/components/market-os/content-task-editor"

export const dynamic = "force-dynamic"

export default function Page({ params }: { params: { id: string } }) {
  return <ContentTaskEditor taskId={params.id} />
}
