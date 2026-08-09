'use client'

type AcademyPrintActionsProps = {
  backHref: string
}

export default function AcademyPrintActions({ backHref }: AcademyPrintActionsProps) {
  return (
    <div className="no-print fixed right-6 top-6 z-[9999] flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <a
        href={backHref}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
      >
        Back
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-black text-white shadow-lg hover:bg-slate-800"
      >
        Print / Save PDF
      </button>
    </div>
  )
}
