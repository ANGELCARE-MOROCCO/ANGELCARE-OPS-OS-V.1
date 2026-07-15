import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AcademyCard, PackCard, SectionHeader, TagPill } from '@/components/b2b-marketplace/MarketplaceCards'
import { AddToQuoteButton } from '@/components/b2b-marketplace/QuoteCartProvider'
import { getProduct, listAcademyModules, listPacks, moneyMad } from '@/lib/b2b-marketplace/repository'

export default async function ProductDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const product = await getProduct(decodeURIComponent(ref))
  if (!product) notFound()
  const trainings = (await listAcademyModules()).filter((module) => product.relatedTrainingSlugs.includes(module.slug))
  const packs = (await listPacks()).filter((pack) => product.relatedPackSlugs.includes(pack.slug))
  const chips = [product.format, product.schoolArea, product.eventType].filter(Boolean)
  const metaCards = [
    ['Délai', product.leadTime],
    ['Quantité minimum', `${product.minQuantity}`],
    ['Set catalogue', product.setName],
    ['Page source', product.sourcePage ? `Catalogue page ${product.sourcePage}` : 'Catalogue'],
  ]

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#f4f8fd_50%,#fff9ec_100%)]">
        <div className="absolute right-[-12rem] top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div className="absolute bottom-[-16rem] left-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#ffe9b8] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#092e63] via-[#2f69b2] to-[#d8a84a]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-[46px] border border-white/80 bg-white/72 p-4 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl">
              <div className="overflow-hidden rounded-[38px] border border-[#dbe6f3] bg-[#f8fbff]">
                <div className="flex items-center justify-between border-b border-[#e6eef8] bg-white/90 px-5 py-4">
                  <span className="rounded-full bg-[#092e63] px-4 py-2 text-xs font-black uppercase tracking-[0.20em] text-white">{product.reference}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">Devis B2B</span>
                </div>
                <div className="relative flex h-[520px] items-center justify-center p-4">
                  {product.sourceImage ? <img src={product.sourceImage} alt={product.title} className="max-h-full w-full rounded-[28px] bg-white object-contain p-3 shadow-inner" /> : <div className="text-center text-lg font-black text-slate-700">Page source catalogue</div>}
                  <div className="absolute bottom-6 left-6 right-6 rounded-[26px] border border-white/80 bg-white/88 p-4 shadow-xl shadow-slate-300/40 backdrop-blur-xl">
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Source visuelle catalogue</div>
                    <div className="mt-1 line-clamp-2 text-sm font-black text-slate-900">{product.setName}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {chips.map((item, index) => <div key={`${item}-${index}`} className="rounded-2xl border border-[#edf2f8] bg-white p-3 text-center text-[11px] font-black leading-4 text-slate-600 shadow-sm">{item}</div>)}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center py-4">
            <Link href="/b2b-marketplace/products" className="w-fit rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-sm font-black text-[#092e63] shadow-sm">← Produits</Link>
            <div className="mt-6 flex flex-wrap gap-2">
              <TagPill tone="navy">Produit catalogue AngelCare</TagPill>
              {product.personalizable ? <TagPill tone="gold">Personnalisable</TagPill> : null}
              {product.wholesaleAvailable ? <TagPill tone="green">Prix de gros</TagPill> : null}
              <TagPill>Référence source</TagPill>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">{product.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{product.longDescription}</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.86fr]">
              <div className="rounded-[38px] border border-[#dbe6f3] bg-white p-6 shadow-xl shadow-slate-200/60">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Prix indicatif catalogue</div>
                <div className="mt-2 text-5xl font-black text-[#092e63]">{moneyMad(product.startingPriceMad)}</div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{product.priceNote}. Le prix final est validé selon format, quantité, personnalisation, disponibilité, production et livraison.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <AddToQuoteButton itemType="product" reference={product.reference} title={product.title} estimatedUnitPriceMad={product.startingPriceMad} label="Ajouter au panier B2B" />
                  <Link href="/b2b-marketplace/request-quote" className="rounded-full border border-[#d7e3f3] bg-white px-5 py-2.5 text-sm font-black text-[#092e63] shadow-sm">Demander prix de gros</Link>
                </div>
              </div>
              <div className="rounded-[38px] border border-[#dbe6f3] bg-[#092e63] p-6 text-white shadow-xl shadow-blue-950/20">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Procurement B2B</div>
                <h2 className="mt-3 text-2xl font-black">Processus sans paiement en ligne</h2>
                <div className="mt-5 grid gap-3 text-sm font-bold text-blue-50">
                  {['Ajouter la référence', 'Configurer quantité & logo', 'Recevoir une proposition'].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#092e63]">{index + 1}</span>{item}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metaCards.map(([label, value]) => (
            <div key={label} className="rounded-[32px] border border-[#dbe6f3] bg-white p-6 shadow-sm shadow-slate-200/70">
              <div className="text-[11px] font-black uppercase tracking-[0.20em] text-[#092e63]">{label}</div>
              <div className="mt-3 text-lg font-black leading-7 text-slate-900">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#dbe6f3] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <SectionHeader eyebrow="Lecture B2B" title="Pourquoi cette référence est utile dans un établissement" subtitle="La fiche produit est pensée pour aider un directeur de crèche à comprendre l’usage, l’impact et la logique d’achat avant de demander un prix de gros." />
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ['Impact visible', 'Renforce l’image de l’établissement, la perception parent et la cohérence visuelle du lieu.'],
              ['Déploiement terrain', 'S’intègre dans un espace, un événement, une routine ou un parcours parent selon le besoin réel.'],
              ['Achat professionnel', 'Référence ajoutable au panier B2B avec quantités, personnalisation et validation par devis.'],
            ].map(([title, text]) => <div key={title} className="rounded-[34px] border border-[#dbe6f3] bg-[#f8fbff] p-7"><h3 className="text-2xl font-black text-slate-950">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></div>)}
          </div>
        </div>
      </section>

      {packs.length ? <section className="mx-auto max-w-7xl px-5 py-14"><SectionHeader eyebrow="Packs" title="Packs compatibles" subtitle="Ces packs ne sont composés que de références réelles ou de configurations validées depuis le catalogue." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{packs.map((pack) => <PackCard key={pack.id} pack={pack} />)}</div></section> : null}
      {trainings.length ? <section className="border-t border-[#dbe6f3] bg-white"><div className="mx-auto max-w-7xl px-5 py-14"><SectionHeader eyebrow="Academy" title="Formations liées" subtitle="Modules de montée en compétences associés à ce type de déploiement terrain." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{trainings.map((module) => <AcademyCard key={module.id} module={module} />)}</div></div></section> : null}
    </main>
  )
}
