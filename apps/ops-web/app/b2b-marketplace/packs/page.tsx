import Link from 'next/link'
import { PackCard, SectionHeader } from '@/components/b2b-marketplace/MarketplaceCards'
import { listPacks } from '@/lib/b2b-marketplace/repository'

export default async function PacksPage() {
  const packs = await listPacks()
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-white">
        <div className="absolute right-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-amber-50" />
        <div className="relative mx-auto max-w-7xl px-5 py-14">
          <div className="inline-flex rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63] shadow-sm">Bundles B2B</div>
          <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight text-slate-950 md:text-6xl">Packs sur-mesure depuis références réelles</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Aucun pack officiel inventé: les packs doivent être créés depuis les produits et formations authentiques du catalogue ou depuis le Marketplace Admin Studio.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        {packs.length ? (
          <><SectionHeader eyebrow="Packs" title="Packs disponibles" subtitle="Packs construits uniquement à partir de références existantes." /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{packs.map((pack) => <PackCard key={pack.id} pack={pack} />)}</div></>
        ) : (
          <div className="rounded-[38px] border border-dashed border-[#cddced] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#092e63] text-white">P0</div>
            <h2 className="mt-5 text-3xl font-black text-slate-950">Aucun pack officiel inventé</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">La règle P0 Catalogue Data Integrity est active. Composez un pack sur-mesure à partir des produits et formations importés, puis envoyez-le en demande de devis.</p>
            <Link href="/b2b-marketplace/custom-pack-builder" className="mt-7 inline-flex rounded-full bg-[#092e63] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15">Créer un pack sur-mesure</Link>
          </div>
        )}
      </section>
    </main>
  )
}
