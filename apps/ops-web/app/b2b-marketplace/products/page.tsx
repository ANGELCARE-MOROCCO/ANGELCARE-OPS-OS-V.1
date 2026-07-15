import { ProductCard, SectionHeader, PremiumStat } from '@/components/b2b-marketplace/MarketplaceCards'
import { listProducts } from '@/lib/b2b-marketplace/repository'

export default async function ProductsPage() {
  const products = await listProducts()
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#eef5ff_52%,#fff7e4_100%)]">
        <div className="absolute right-[-12rem] top-[-12rem] h-[38rem] w-[38rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63] shadow-sm">Produits & équipements</div>
            <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">Catalogue produits B2B authentique</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Références réelles extraites du catalogue Produits & Équipements AngelCare, organisées pour une navigation B2B, un panier de devis et une demande de prix de gros.</p>
          </div>
          <div className="grid gap-3 rounded-[38px] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-slate-300/40 backdrop-blur-2xl sm:grid-cols-2">
            <PremiumStat value={`${products.length}`} label="Références" />
            <PremiumStat value="P0" label="Catalogue Integrity" />
            <PremiumStat value="B2B" label="Quote cart" />
            <PremiumStat value="MAD" label="Prix indicatifs" />
          </div>
          <form action="/b2b-marketplace/search" className="lg:col-span-2 flex max-w-4xl flex-col gap-3 rounded-[32px] border border-[#dbe6f3] bg-white/80 p-3 shadow-sm backdrop-blur md:flex-row">
            <input name="q" placeholder="Rechercher une référence, un besoin, un pack..." className="min-w-0 flex-1 rounded-full border border-[#dbe6f3] bg-white px-5 py-3 text-sm outline-none focus:border-[#092e63]" />
            <button className="rounded-full bg-[#092e63] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15">Rechercher</button>
          </form>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <SectionHeader eyebrow="Références" title={`${products.length} produits disponibles`} subtitle="Chaque carte ouvre une fiche produit premium avec prix indicatif, source catalogue, tags B2B, usage terrain et ajout au panier de devis." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </main>
  )
}
