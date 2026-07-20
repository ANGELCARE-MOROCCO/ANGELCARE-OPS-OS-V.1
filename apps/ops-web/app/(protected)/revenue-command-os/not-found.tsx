import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'

export default function RevenueCommandOsNotFound() {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,.06)]">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><SearchX size={25} /></span>
      <h2 className="mt-5 text-2xl font-black text-slate-950">Workspace non contracté</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500">Cette surface n’appartient pas au registre Revenue Command OS Phase 1 ou a été appelée avec un identifiant invalide.</p>
      <Link href="/revenue-command-os" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><ArrowLeft size={17} /> Retour à la vue stratégique</Link>
    </div>
  )
}
