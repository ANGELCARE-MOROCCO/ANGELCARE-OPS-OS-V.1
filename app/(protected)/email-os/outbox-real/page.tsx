import RealOutboxQueue from "@/components/email-os-core/RealOutboxQueue"

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <RealOutboxQueue />
      </div>
    </main>
  )
}
