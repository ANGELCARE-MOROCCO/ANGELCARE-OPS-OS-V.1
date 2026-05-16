import ProspectFullProfileCommandCenter from "@/components/revenue-command-center/ProspectFullProfileCommandCenter"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="fixed inset-x-0 bottom-0 top-[86px] z-[999] overflow-y-auto bg-[#050b16]">
      <ProspectFullProfileCommandCenter prospectId={id} />
    </div>
  )
}
