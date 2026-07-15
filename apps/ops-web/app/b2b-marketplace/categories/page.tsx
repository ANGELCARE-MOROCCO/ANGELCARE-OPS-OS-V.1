import { CategoryCard, SectionHeader, PremiumStat } from '@/components/b2b-marketplace/MarketplaceCards'
import { listCategories } from '@/lib/b2b-marketplace/repository'

export default async function CategoriesPage() {
  const categories = await listCategories()
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#eef5ff_55%,#fff7e4_100%)]">
        <div className="absolute right-[-12rem] top-[-12rem] h-[38rem] w-[38rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63] shadow-sm">Catalogue B2B</div>
            <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">Espaces Catalogue B2B</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Parcourez les départements commerciaux du marketplace AngelCare: chaque espace relie catégories, produits, packs et formations.</p>
          </div>
          <div className="grid gap-3 rounded-[38px] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-slate-300/40 backdrop-blur-2xl sm:grid-cols-2">
            <PremiumStat value={`${categories.length}`} label="Rayons" />
            <PremiumStat value="B2B" label="Walkaround" />
            <PremiumStat value="P0" label="Data Lock" />
            <PremiumStat value="360" label="Vision catalogue" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <SectionHeader eyebrow="Walkaround" title="Choisissez votre besoin ou votre espace" subtitle="Une navigation pensée comme un showroom B2B premium, pas comme une simple liste de produits." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
        </div>
      </section>
    </main>
  )
}
