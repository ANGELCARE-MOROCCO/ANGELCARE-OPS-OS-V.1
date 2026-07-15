import ProspectFullProfileCommandCenter from "@/components/revenue-command-center/ProspectFullProfileCommandCenter"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#050b16]">
      <ProspectFullProfileCommandCenter prospectId={id} />
    </div>
  )
}
