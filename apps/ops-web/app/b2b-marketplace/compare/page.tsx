import Link from 'next/link'

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-14">
      <div className="relative overflow-hidden rounded-[42px] border border-[#dbe6f3] bg-white p-12 text-center shadow-2xl shadow-slate-200/70">
        <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#eef5ff]" />
        <div className="relative">
          <div className="inline-flex rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63]">Comparateur</div>
          <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 md:text-6xl">Comparateur B2B prêt pour extension</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">La base route est installée pour connecter la comparaison produit, pack et formation depuis les cards du marketplace.</p>
          <Link href="/b2b-marketplace/products" className="mt-7 inline-flex rounded-full bg-[#092e63] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15">Voir produits</Link>
        </div>
      </div>
    </main>
  )
}
