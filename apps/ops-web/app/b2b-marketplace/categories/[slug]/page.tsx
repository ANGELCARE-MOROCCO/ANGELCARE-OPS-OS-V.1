import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AcademyCard, PackCard, ProductCard, SectionHeader, TagPill } from '@/components/b2b-marketplace/MarketplaceCards'
import { getCategory, listAcademyModules, listPacks, listProducts } from '@/lib/b2b-marketplace/repository'

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) notFound()
  const products = await listProducts({ categorySlug: slug })
  const relatedModules = (await listAcademyModules()).filter((module) => products.some((product) => product.relatedTrainingSlugs.includes(module.slug))).slice(0, 4)
  const relatedPacks = (await listPacks()).filter((pack) => products.some((product) => product.relatedPackSlugs.includes(pack.slug))).slice(0, 3)

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#eef5ff_55%,#fff7e4_100%)]">
        <div className="absolute right-[-12rem] top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div className="absolute bottom-[-14rem] left-[-12rem] h-[34rem] w-[34rem] rounded-full bg-amber-100 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#092e63] via-[#2f69b2] to-[#d8a84a]" />
        <div className="relative mx-auto max-w-7xl px-5 py-14">
          <Link href="/b2b-marketplace/categories" className="w-fit rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-sm font-black text-[#092e63] shadow-sm">← Espaces catalogue</Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2"><TagPill tone="navy">{category.layoutTemplate}</TagPill><TagPill>Rayon B2B</TagPill><TagPill tone="gold">Premium UIX</TagPill></div>
              <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">{category.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{category.promise}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {category.tags.map((tag, index) => <TagPill key={`${tag}-${index}`} tone={index === 0 ? 'navy' : 'slate'}>{tag}</TagPill>)}
              </div>
            </div>
            <div className="rounded-[42px] border border-white/80 bg-white/70 p-5 shadow-2xl shadow-slate-300/40 backdrop-blur-2xl">
              <div className="rounded-[34px] border border-[#dbe6f3] bg-white p-6 shadow-sm">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#092e63]">Walkaround B2B</div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{category.heroNote}</p>
                <div className="mt-5 grid gap-3">
                  {category.useCases.map((item, index) => <div key={`${item}-${index}`} className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-black text-slate-700">✓ {item}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <SectionHeader eyebrow="Produits" title={`${products.length} références disponibles`} subtitle="Ajoutez les références au panier B2B ou ouvrez la fiche produit pour voir les détails de personnalisation, quantité et source catalogue." />
        {products.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState />}
      </section>

      {relatedPacks.length ? (
        <section className="border-y border-[#dbe6f3] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <SectionHeader eyebrow="Bundles" title="Packs recommandés" subtitle="Des combinaisons prêtes à déployer pour ce besoin B2B." />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{relatedPacks.map((pack) => <PackCard key={pack.id} pack={pack} />)}</div>
          </div>
        </section>
      ) : null}

      {relatedModules.length ? (
        <section className="mx-auto max-w-7xl px-5 py-14">
          <SectionHeader eyebrow="Academy" title="Modules de formation liés" subtitle="Ajoutez une formation pour transformer l’achat produit en montée en compétences terrain." />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{relatedModules.map((module) => <AcademyCard key={module.id} module={module} />)}</div>
        </section>
      ) : null}
    </main>
  )
}

function EmptyState() {
  return <div className="rounded-[38px] border border-dashed border-[#cddced] bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">Les références de cet espace sont prêtes à être enrichies depuis le Marketplace Admin Studio.</div>
}
