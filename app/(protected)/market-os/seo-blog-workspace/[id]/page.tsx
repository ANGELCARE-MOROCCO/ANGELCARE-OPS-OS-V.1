import SeoBlogEditor from "@/components/market-os/seo-blog-editor"

export const dynamic = "force-dynamic"

export default function Page({ params }: { params: { id: string } }) {
  return <SeoBlogEditor taskId={params.id} />
}
