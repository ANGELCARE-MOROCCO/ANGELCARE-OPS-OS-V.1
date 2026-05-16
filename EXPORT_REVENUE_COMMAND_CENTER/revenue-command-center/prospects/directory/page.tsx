import ProspectsDirectoryCommandCenter from "@/components/revenue-command-center/ProspectsDirectoryCommandCenter"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <div className="fixed inset-x-0 bottom-0 top-[86px] z-[999] overflow-y-auto bg-[#050b16]">
      <ProspectsDirectoryCommandCenter />
    </div>
  )
}
