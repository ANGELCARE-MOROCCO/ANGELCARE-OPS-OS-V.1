import { Inbox } from "lucide-react"

export default function EnterpriseEmptyState({ title = "No records yet", description = "Create or sync records to begin." }: { title?: string; description?: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="h-8 w-8 text-slate-400" />
      <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}
