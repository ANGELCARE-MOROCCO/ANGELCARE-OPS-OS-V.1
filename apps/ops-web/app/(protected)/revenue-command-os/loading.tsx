export default function RevenueCommandOsLoading() {
  return (
    <div className="min-h-[calc(100vh-86px)] bg-[#f4f7fb] p-6">
      <div className="mx-auto max-w-[1720px] animate-pulse space-y-5">
        <div className="h-72 rounded-[30px] border border-slate-200 bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 rounded-[22px] border border-slate-200 bg-white" />)}</div>
        <div className="h-72 rounded-[28px] border border-slate-200 bg-white" />
      </div>
    </div>
  )
}
