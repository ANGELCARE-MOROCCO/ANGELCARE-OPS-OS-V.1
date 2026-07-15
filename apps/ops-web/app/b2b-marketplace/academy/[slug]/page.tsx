import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AcademyCard, ProductCard, PackCard, SectionHeader, TagPill } from '@/components/b2b-marketplace/MarketplaceCards'
import { AddToQuoteButton } from '@/components/b2b-marketplace/QuoteCartProvider'
import { getAcademyModule, listAcademyModulesByCategory, listPacks, listProducts, moneyMad } from '@/lib/b2b-marketplace/repository'

export default async function AcademyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categoryModules = await listAcademyModulesByCategory(slug)
  const exactModule = await getAcademyModule(slug)

  if (!exactModule && categoryModules.length) {
    const categoryTitle = categoryModules[0].category
    return (
      <main>
        <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#f5f1ff_52%,#eef7ff_100%)]">
          <div className="absolute right-[-12rem] top-[-12rem] h-[38rem] w-[38rem] rounded-full bg-violet-100 blur-3xl" />
          <div className="absolute left-[-12rem] bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-700 via-[#092e63] to-[#d8a84a]" />
          <div className="relative mx-auto grid max-w-7xl gap-9 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Link href="/b2b-marketplace/academy" className="w-fit rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-sm font-black text-[#092e63] shadow-sm">← Academy</Link>
              <div className="mt-7 flex flex-wrap gap-2"><TagPill tone="violet">Catégorie Academy</TagPill><TagPill tone="navy">{categoryModules.length} formations réelles</TagPill><TagPill>Catalogue source</TagPill></div>
              <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">{categoryTitle}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Chaque carte correspond à une formation réelle du catalogue Academy, avec référence TR, prix indicatif catalogue, e-learning, certification et ajout au panier B2B.</p>
            </div>
            <div className="rounded-[46px] border border-white/80 bg-white/72 p-4 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl">
              <div className="overflow-hidden rounded-[38px] border border-[#dbe6f3] bg-[#f8fbff] p-4">
                {categoryModules[0]?.sourceImage ? <img src={categoryModules[0].sourceImage} alt={categoryTitle} className="h-[430px] w-full rounded-[30px] bg-white object-contain p-3 shadow-inner" /> : null}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-14">
          <SectionHeader eyebrow="Formations" title="Modules catalogue cliquables" subtitle="Ouvrez une formation pour lire sa fiche détaillée, contrôler sa page source ou l’ajouter directement à la demande de devis." />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categoryModules.map((module) => <AcademyCard key={module.id} module={module} />)}
          </div>
        </section>
      </main>
    )
  }

  const module = exactModule
  if (!module) notFound()
  const products = (await listProducts()).filter((product) => module.relatedProductRefs.includes(product.reference))
  const packs = (await listPacks()).filter((pack) => module.relatedPackSlugs.includes(pack.slug))

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#f7f2ff_50%,#f2f8ff_100%)]">
        <div className="absolute left-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-violet-100 blur-3xl" />
        <div className="absolute bottom-[-14rem] right-[-12rem] h-[36rem] w-[36rem] rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-700 via-[#092e63] to-[#d8a84a]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link href={`/b2b-marketplace/academy/${module.categorySlug}`} className="w-fit rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-sm font-black text-[#092e63] shadow-sm">← {module.category}</Link>
            <div className="mt-7 flex flex-wrap gap-2">
              <TagPill tone="violet">{module.reference}</TagPill>
              <TagPill tone="navy">Formation catalogue</TagPill>
              {module.includesCertificate ? <TagPill tone="green">Certificat</TagPill> : null}
              {module.includesElearning ? <TagPill tone="navy">E-learning</TagPill> : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">{module.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{module.shortDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AddToQuoteButton itemType="training" reference={module.reference} title={module.title} estimatedUnitPriceMad={module.startingPriceMad} label="Ajouter à la demande formation" />
              <Link href="/b2b-marketplace/request-quote" className="rounded-full border border-[#d7e3f3] bg-white px-5 py-2.5 text-sm font-black text-[#092e63] shadow-sm">Demander programme</Link>
            </div>
          </div>
          <div className="rounded-[46px] border border-white/80 bg-white/72 p-4 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl">
            <div className="rounded-[38px] border border-[#dbe6f3] bg-white p-5 shadow-sm">
              <div className="grid gap-3">
                {[
                  ['Durée', module.duration],
                  ['Participants', module.participants],
                  ['Format', module.format],
                  ['Prix indicatif', moneyMad(module.startingPriceMad)],
                ].map(([label, value]) => <div key={label} className="rounded-[26px] border border-[#edf2f8] bg-[#f8fbff] p-5"><div className="text-xs font-black uppercase tracking-[0.16em] text-[#092e63]">{label}</div><div className="mt-2 text-xl font-black text-slate-900">{value}</div></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <SectionHeader eyebrow="Objectifs opérationnels" title="Ce que la formation doit produire sur le terrain" subtitle="Une fiche formation orientée B2B: objectifs, format, impact terrain, preuve catalogue et ajout au devis." />
        <div className="grid gap-5 md:grid-cols-3">
          {module.objectives.map((objective, index) => <div key={`${objective}-${index}`} className="rounded-[34px] border border-[#dbe6f3] bg-white p-7 shadow-sm shadow-slate-200/70"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-sm font-black text-violet-800">✓</div><p className="mt-5 text-sm font-bold leading-7 text-slate-700">{objective}</p></div>)}
        </div>
      </section>

      <section className="border-y border-[#dbe6f3] bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeader eyebrow="Méthode" title="Parcours de formation prêt à vendre" subtitle="La formation est traitée comme un module B2B premium: claire pour le décideur, utile pour le terrain et intégrable dans un pack catalogue." />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Brief', 'Cadrer le besoin et les participants.'],
              ['Session', 'Former avec supports et exemples terrain.'],
              ['Refresh', 'Maintenir les standards via e-learning.'],
            ].map(([title, text], index) => <div key={title} className="rounded-[30px] border border-[#dbe6f3] bg-[#f8fbff] p-6"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#092e63] text-xs font-black text-white">{index + 1}</div><h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></div>)}
          </div>
        </div>
      </section>

      {module.sourceImage ? <section className="bg-[#f5f8fc]"><div className="mx-auto max-w-6xl px-5 py-14"><SectionHeader eyebrow="Source catalogue" title="Page source catalogue" subtitle="Affichage de la page source pour vérifier visuellement les références, prix et intitulés." /><img src={module.sourceImage} alt={module.title} className="max-h-[820px] w-full rounded-[40px] border border-[#dbe6f3] bg-white object-contain p-4 shadow-2xl shadow-slate-300/50" /></div></section> : null}
      {products.length ? <section className="mx-auto max-w-7xl px-5 py-14"><SectionHeader eyebrow="Produits liés" title="Produits compatibles" subtitle="Associez la formation à des supports terrain réels pour renforcer l’impact." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section> : null}
      {packs.length ? <section className="border-t border-[#dbe6f3] bg-white"><div className="mx-auto max-w-7xl px-5 py-14"><SectionHeader eyebrow="Packs" title="Packs compatibles" subtitle="Configurations B2B construites depuis des références catalogue." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{packs.map((pack) => <PackCard key={pack.id} pack={pack} />)}</div></div></section> : null}
    </main>
  )
}
