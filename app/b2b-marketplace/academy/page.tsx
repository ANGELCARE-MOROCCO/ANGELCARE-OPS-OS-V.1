import Link from 'next/link'
import { AcademyCard, SectionHeader, PremiumStat } from '@/components/b2b-marketplace/MarketplaceCards'
import { listAcademyCategories, listAcademyModules } from '@/lib/b2b-marketplace/repository'

export default async function AcademyPage() {
  const modules = await listAcademyModules()
  const categories = await listAcademyCategories()
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#f4efff_55%,#eef7ff_100%)]">
        <div className="absolute right-[-12rem] top-[-12rem] h-[38rem] w-[38rem] rounded-full bg-violet-100 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-800 shadow-sm">AngelCare Academy</div>
            <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">Catalogue formations B2B</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Catégories Academy issues du catalogue Formations & Montée en Compétences. Chaque catégorie ouvre ses modules réels, cliquables et ajoutables au panier B2B.</p>
          </div>
          <div className="grid gap-3 rounded-[38px] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-slate-300/40 backdrop-blur-2xl sm:grid-cols-2">
            <PremiumStat value={`${categories.length}`} label="Catégories" />
            <PremiumStat value={`${modules.length}`} label="Modules réels" />
            <PremiumStat value="TR" label="Références" />
            <PremiumStat value="B2B" label="Devis formation" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <SectionHeader eyebrow="Catégories Academy" title="Parcours de montée en compétences" subtitle="Ouvrez une catégorie pour afficher la grille de formations réelles du catalogue, avec source visuelle, prix indicatif et ajout au devis." />
        <div className="mb-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.slug} href={`/b2b-marketplace/academy/${category.slug}`} className="group relative overflow-hidden rounded-[38px] border border-[#dbe6f3] bg-white p-6 shadow-sm shadow-slate-200/80 transition hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-300/40">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-50 blur-xl" />
              <div className="relative text-xs font-black uppercase tracking-[0.18em] text-violet-700">Catégorie Academy • {category.count} modules</div>
              <h2 className="relative mt-4 text-2xl font-black leading-tight text-slate-950">{category.title}</h2>
              <p className="relative mt-4 text-sm leading-7 text-slate-600">Ouvrir les formations du catalogue, avec références TR, prix à partir de, e-learning et ajout au devis B2B.</p>
              <div className="relative mt-6 flex items-center justify-between border-t border-[#edf2f8] pt-5 text-sm font-black text-[#092e63]"><span>Voir les cours</span><span className="transition group-hover:translate-x-1">→</span></div>
            </Link>
          ))}
          <div className="rounded-[38px] border border-dashed border-[#dbe6f3] bg-[#f8fbff] p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#092e63]">Catalogue TOC</div>
            <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">Académie des leaders & futurs managers</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Catégorie listée dans la table des matières. Page détaillée non présente dans le PDF chargé: aucun module inventé.</p>
          </div>
        </div>
        <SectionHeader eyebrow="Modules" title="Toutes les formations disponibles" subtitle="Toutes les formations ci-dessous proviennent des pages détaillées disponibles dans le catalogue." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => <AcademyCard key={module.id} module={module} />)}
        </div>
      </section>
    </main>
  )
}
