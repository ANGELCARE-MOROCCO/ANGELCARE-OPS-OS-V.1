import Link from "next/link"

async function getSnapshots() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
    const response = await fetch(`${baseUrl}/api/persistence/local-storage`, { cache: "no-store" })
    if (!response.ok) return { ok: false, snapshots: [] as any[] }
    return response.json()
  } catch {
    return { ok: false, snapshots: [] as any[] }
  }
}

export const dynamic = "force-dynamic"

export default async function ProductionPersistenceCenterPage() {
  const data = await getSnapshots()
  const snapshots = Array.isArray(data.snapshots) ? data.snapshots : []
  const totalSize = snapshots.reduce((sum: number, item: any) => sum + Number(item.size || 0), 0)

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">AngelCare Production Persistence OS</p>
              <h1 className="mt-3 text-4xl font-black text-white">Global browser-only data recovery and live persistence</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                This page confirms which former localStorage-only stores are now backed by Supabase snapshots. Revenue, Market OS, Ambassadors, SEO, Content Command, CSV imports, tasks and staff memo acknowledgements are protected here.
              </p>
            </div>
            <Link href="/" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15">
              Back to app
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Protected stores</p>
              <p className="mt-2 text-3xl font-black text-white">{snapshots.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Saved payload</p>
              <p className="mt-2 text-3xl font-black text-white">{Math.round(totalSize / 1024)} KB</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Workspace</p>
              <p className="mt-2 text-3xl font-black text-white">{data.workspaceId || "angelcare-main"}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-2xl">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-black text-white">Synced local stores</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Store key</th>
                  <th className="px-5 py-4">Size</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Last sync</th>
                  <th className="px-5 py-4">Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {snapshots.map((item: any) => (
                  <tr key={item.key} className="text-slate-200">
                    <td className="px-5 py-4 font-black text-white">{item.key}</td>
                    <td className="px-5 py-4">{Math.round(Number(item.size || 0) / 1024)} KB</td>
                    <td className="px-5 py-4">{item.source || "browser"}</td>
                    <td className="px-5 py-4">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}</td>
                    <td className="px-5 py-4">{item.origin || "—"}</td>
                  </tr>
                ))}
                {snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No snapshots yet. Open the app in the browser that contains the old local data, then refresh this page.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
