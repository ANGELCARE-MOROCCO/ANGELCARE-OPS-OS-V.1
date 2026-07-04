import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AcademyCard, ProductCard, SectionHeader } from '@/components/b2b-marketplace/MarketplaceCards'
import { AddToQuoteButton } from '@/components/b2b-marketplace/QuoteCartProvider'
import { getPack, listAcademyModules, listProducts, moneyMad } from '@/lib/b2b-marketplace/repository'

export default async function PackDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pack = await getPack(slug)
  if (!pack) notFound()
  const products = (await listProducts()).filter((product) => pack.includedProductRefs.includes(product.reference))
  const modules = (await listAcademyModules()).filter((module) => pack.includedTrainingSlugs.includes(module.slug))

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[#092e63] text-white">
        <div className="absolute right-[-10rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-white/10" />
        <div className="absolute bottom-[-12rem] left-[-12rem] h-[28rem] w-[28rem] rounded-full bg-[#d8a84a]/20" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link href="/b2b-marketplace/packs" className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-blue-50 backdrop-blur">← Packs</Link>
            <div className="mt-7 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">Pack B2B prêt à déployer</div>
            <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">{pack.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50">{pack.shortDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AddToQuoteButton itemType="pack" reference={pack.slug} title={pack.title} estimatedUnitPriceMad={pack.startingPriceMad} label="Ajouter le pack" variant="dark" />
              <Link href="/b2b-marketplace/custom-pack-builder" className="rounded-full border border-white/25 bg-white px-5 py-2.5 text-sm font-black text-[#092e63] shadow-lg">Personnaliser</Link>
            </div>
          </div>
          <div className="rounded-[38px] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur">
            <div className="text-sm font-black uppercase tracking-[0.16em] text-blue-100">Versions commerciales</div>
            <div className="mt-5 grid gap-3">
              {pack.variants.map((variant) => <div key={variant.name} className="rounded-[24px] bg-white p-5 text-[#0f172a] shadow-sm"><div className="flex items-center justify-between gap-4"><span className="font-black">{variant.name}</span><span className="font-black text-[#092e63]">{moneyMad(variant.priceMad)}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{variant.note}</p></div>)}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <SectionHeader eyebrow="Produits" title="Produits inclus" subtitle="Références catalogue associées à ce pack." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      {modules.length ? <section className="border-y border-[#dbe6f3] bg-white"><div className="mx-auto max-w-7xl px-5 py-14"><SectionHeader eyebrow="Academy" title="Formations incluses" subtitle="Modules de montée en compétences associés." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{modules.map((module) => <AcademyCard key={module.id} module={module} />)}</div></div></section> : null}
    </main>
  )
}
