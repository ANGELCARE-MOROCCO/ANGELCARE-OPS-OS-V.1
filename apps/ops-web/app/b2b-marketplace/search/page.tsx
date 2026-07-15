import { AcademyCard, CategoryCard, PackCard, ProductCard, SectionHeader } from '@/components/b2b-marketplace/MarketplaceCards'
import { searchMarketplace } from '@/lib/b2b-marketplace/repository'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const results = await searchMarketplace(q)
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-white">
        <div className="absolute right-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#eef5ff]" />
        <div className="relative mx-auto max-w-7xl px-5 py-14">
          <div className="inline-flex rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63] shadow-sm">Recherche catalogue</div>
          <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight text-slate-950 md:text-6xl">{q ? `Résultats pour “${q}”` : 'Recherche marketplace'}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Recherchez dans les produits, formations Academy, packs et espaces catalogue.</p>
          <form className="mt-8 flex max-w-4xl flex-col gap-3 rounded-[30px] border border-[#dbe6f3] bg-[#f8fbff] p-3 shadow-sm md:flex-row">
            <input name="q" defaultValue={q} placeholder="Open Day, hygiène, formation, référence..." className="min-w-0 flex-1 rounded-full border border-[#dbe6f3] bg-white px-5 py-3 text-sm outline-none focus:border-[#092e63]" />
            <button className="rounded-full bg-[#092e63] px-6 py-3 text-sm font-black text-white">Rechercher</button>
          </form>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <ResultBlock title="Espaces" count={results.categories.length}>{results.categories.map((category) => <CategoryCard key={category.id} category={category} />)}</ResultBlock>
        <ResultBlock title="Produits" count={results.products.length}>{results.products.map((product) => <ProductCard key={product.id} product={product} />)}</ResultBlock>
        <ResultBlock title="Academy" count={results.academyModules.length}>{results.academyModules.map((module) => <AcademyCard key={module.id} module={module} />)}</ResultBlock>
        <ResultBlock title="Packs" count={results.packs.length}>{results.packs.map((pack) => <PackCard key={pack.id} pack={pack} />)}</ResultBlock>
      </section>
    </main>
  )
}

function ResultBlock({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <SectionHeader title={`${title} (${count})`} subtitle={count ? 'Résultats disponibles dans cette famille.' : 'Aucun résultat pour cette famille.'} />
      {count ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div> : <div className="rounded-[34px] border border-dashed border-[#cbdced] bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">Aucun résultat.</div>}
    </section>
  )
}
