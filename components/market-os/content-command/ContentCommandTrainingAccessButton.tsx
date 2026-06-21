import Link from "next/link"

export function ContentCommandTrainingAccessButton(): React.ReactElement {
  return (
    <Link
      href="/training/content-command-center-training.html"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-base ring-1 ring-amber-200">🎓</span>
      <span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-amber-700">Académie interne</span>
        <span className="block text-sm text-slate-950">Formation complète</span>
      </span>
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-950">Ouvrir →</span>
    </Link>
  )
}

export default ContentCommandTrainingAccessButton