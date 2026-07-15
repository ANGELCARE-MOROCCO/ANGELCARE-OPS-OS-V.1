import Link from 'next/link'
import { AcademyCard, GatewayCard, PremiumStat, ProductCard, SectionHeader } from '@/components/b2b-marketplace/MarketplaceCards'
import { getMarketplaceHome } from '@/lib/b2b-marketplace/repository'

export default async function B2BMarketplaceHomePage() {
  const home = await getMarketplaceHome()
  const getSection = (key: string) => home.sections.find((section) => section.id === key || section.type === key)
  const hero = getSection('hero')
  const search = getSection('search')
  const gatewaySection = getSection('gateways')
  const packSection = getSection('wholesale-cta') || getSection('featured-packs')
  const productSection = getSection('featured-products')
  const academySection = getSection('academy-highlight')

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#eef5ff_48%,#fff6dd_100%)]">
        <div className="absolute right-[-14rem] top-[-14rem] h-[46rem] w-[46rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div className="absolute bottom-[-18rem] left-[-16rem] h-[42rem] w-[42rem] rounded-full bg-[#ffebb9] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#092e63] via-[#2f69b2] to-[#d8a84a]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-[#dbe6f3] bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63] shadow-sm backdrop-blur">Marketplace public • sans login • catalogue authentique</div>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.92] tracking-tight text-slate-950 md:text-8xl">{hero?.title || 'Le showroom B2B AngelCare pour crèches premium'}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">{hero?.subtitle || 'Explorez les produits, équipements, supports pédagogiques, formations Academy et packs sur-mesure. Un parcours wholesale moderne: références réelles, source catalogue, panier B2B et devis professionnel.'}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/b2b-marketplace/categories" className="rounded-full bg-[#092e63] px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5">{hero?.ctaLabel || 'Explorer le catalogue'}</Link>
              <Link href="/b2b-marketplace/custom-pack-builder" className="rounded-full border border-[#d7e3f3] bg-white px-7 py-4 text-sm font-black text-[#092e63] shadow-sm transition hover:-translate-y-0.5">Créer un pack B2B</Link>
              <Link href="/b2b-marketplace/request-quote" className="rounded-full border border-[#d7e3f3] bg-[#f9fbfe] px-7 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5">Demander un devis</Link>
            </div>
          </div>
          <div className="rounded-[46px] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl">
            <div className="rounded-[38px] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#092e63]">{search?.title || 'Recherche intelligente'}</div>
                  <div className="mt-1 text-sm font-bold text-slate-500">{search?.subtitle || 'Référence, besoin, pack, formation'}</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#092e63] font-black text-white">⌕</div>
              </div>
              <form action="/b2b-marketplace/search" className="mt-5 flex gap-2 rounded-full border border-[#dbe6f3] bg-[#f8fbff] p-2 shadow-inner">
                <input name="q" placeholder="Open Day, hygiène, PB-01, formation parents..." className="min-w-0 flex-1 rounded-full border-0 bg-transparent px-4 py-3 text-sm outline-none" />
                <button className="rounded-full bg-[#092e63] px-5 py-3 text-sm font-black text-white">Rechercher</button>
              </form>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                <PremiumStat value="14" label="Espaces B2B" />
                <PremiumStat value="P0" label="Data Integrity" />
                <PremiumStat value="B2B" label="Prix de gros" />
                <PremiumStat value="0" label="Paiement en ligne" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <SectionHeader eyebrow="Espaces Catalogue B2B" title={gatewaySection?.title || 'Choisissez votre besoin, votre espace ou votre moment scolaire'} subtitle={gatewaySection?.subtitle || 'Le marketplace est organisé comme un department store B2B: admissions, image premium, parents, classe, sécurité, accueil, événements, rentrée, mobilier, formations et packs.'} />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {home.gateways.map((gateway) => <GatewayCard key={gateway.id} gateway={gateway} />)}
        </div>
      </section>

      <section className="border-y border-[#dbe6f3] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">P0 Catalogue Data Integrity</div>
            <h2 className="mt-5 text-4xl font-black leading-tight text-slate-950 md:text-6xl">{packSection?.title || 'Pack Builder avec références réelles uniquement'}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{packSection?.subtitle || 'Aucun pack officiel inventé: les sélections se composent uniquement depuis les références produits et formations réelles du catalogue, puis passent en devis B2B.'}</p>
            <Link href="/b2b-marketplace/custom-pack-builder" className="mt-7 inline-flex rounded-full bg-[#092e63] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15">Créer un pack</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Produits réels', 'Cartes source catalogue, référence, prix et page.'],
              ['Formations réelles', 'Catégories Academy et modules cliquables.'],
              ['Devis validé', 'Aucun paiement: proposition par AngelCare.'],
            ].map(([label, text], index) => <div key={label} className="rounded-[34px] border border-[#dbe6f3] bg-[#f8fbff] p-6 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#092e63] text-sm font-black text-white">{index + 1}</div><div className="mt-5 text-xl font-black text-slate-950">{label}</div><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <SectionHeader eyebrow="Produits vedettes" title={productSection?.title || 'Références catalogue prêtes pour le devis B2B'} subtitle={productSection?.subtitle || 'Chaque référence peut être ajoutée au panier B2B avec quantité, personnalisation et demande de prix de gros.'} href="/b2b-marketplace/products" cta="Voir produits" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {home.featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="border-t border-[#dbe6f3] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <SectionHeader eyebrow="Academy" title={academySection?.title || 'Formations commercialisées comme modules B2B'} subtitle={academySection?.subtitle || 'Les formations peuvent être achetées seules, ajoutées à un pack ou connectées à des produits terrain.'} href="/b2b-marketplace/academy" cta="Voir Academy" />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {home.academyModules.map((module) => <AcademyCard key={module.id} module={module} />)}
          </div>
        </div>
      </section>
    </main>
  )
}
