import Link from 'next/link'
import AdminResourceManager from './AdminResourceManager'
import { getAdminResource } from '@/lib/b2b-marketplace/repository'
import { getAdminResourceDefinition, listAdminResourceDefinitions } from '@/lib/b2b-marketplace/admin-resources'

export function AdminStudioHome() {
  const adminCards = listAdminResourceDefinitions()
  return (
    <main className="min-h-screen bg-[#f7faff] px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[38px] border border-[#dbe7f6] bg-white p-8 shadow-sm">
          <div className="absolute right-[-10rem] top-[-10rem] h-80 w-80 rounded-full bg-[#e8f2ff] blur-3xl" />
          <div className="absolute bottom-[-8rem] left-[-8rem] h-72 w-72 rounded-full bg-[#fff0c2] blur-3xl" />
          <div className="relative">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#0f2f5f]">AngelCare Marketplace Admin Studio</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Backoffice synchronisé avec le front public</h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">Contrôlez exactement ce que les crèches voient: thème, logo, taille logo, announcement bar, menu horizontal, homepage, sections, catégories, produits, prix, références, images, formations, packs, devis, templates et navigation.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/b2b-marketplace" className="rounded-full bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white">Voir marketplace public</Link>
              <Link href="/admin/b2b-marketplace/preview" className="rounded-full border border-[#d7e3f3] bg-white px-5 py-3 text-sm font-black text-[#0f2f5f]">Prévisualiser</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Link href="/admin/b2b-marketplace/quote-requests" className="group rounded-[30px] border border-[#d8a84a]/35 bg-[#fff8e8] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-100">
            <div className="mb-4 inline-flex rounded-full bg-[#0f2f5f] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">crm-command-center</div>
            <h2 className="text-xl font-black text-slate-950">CRM & Demandes B2B</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Traitez chaque demande front: devis, prix de gros, pack sur-mesure, produit, formation, notes, statuts, assignation, actions call/email/WhatsApp et conversion proposition.</p>
            <div className="mt-5 text-sm font-black text-[#0f2f5f]">Ouvrir le CRM →</div>
          </Link>
          {adminCards.map((card) => (
            <Link key={card.resource} href={`/admin/b2b-marketplace/${card.resource === 'home-sections' ? 'homepage' : card.resource === 'gateway-cards' ? 'gateways' : card.resource === 'quote-settings' ? 'quote-settings' : card.resource}`} className="group rounded-[30px] border border-[#dbe7f6] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
              <div className="mb-4 inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0f2f5f]">{card.resource}</div>
              <h2 className="text-xl font-black text-slate-950">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              <div className="mt-5 text-sm font-black text-[#0f2f5f]">Gérer →</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

export async function AdminResourcePage({ title, resource, description }: { title: string; resource: string; description: string }) {
  const definition = getAdminResourceDefinition(resource)
  const data = await getAdminResource(resource)
  if (!definition) {
    return (
      <main className="min-h-screen bg-[#f7faff] px-6 py-8 text-slate-950">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-[#dbe7f6] bg-white p-8 shadow-sm">
          <Link href="/admin/b2b-marketplace" className="text-sm font-black text-[#0f2f5f]">← Marketplace Admin Studio</Link>
          <h1 className="mt-6 text-4xl font-black">Resource not found</h1>
        </div>
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-[#f7faff] px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/b2b-marketplace" className="text-sm font-black text-[#0f2f5f]">← Marketplace Admin Studio</Link>
        <div className="mt-6 rounded-[34px] border border-[#dbe7f6] bg-white p-8 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[#0f2f5f]">Admin module • {resource}</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{definition.title || title}</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">{definition.description || description}</p>
          <div className="mt-5 rounded-[24px] border border-[#dbe7f6] bg-[#f9fbfe] p-5 text-sm font-bold leading-7 text-slate-600">
            <span className="font-black text-[#0f2f5f]">Impact front:</span> {definition.publicImpact}
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <Link href="/b2b-marketplace" target="_blank" className="rounded-full border border-[#d7e3f3] bg-[#f9fbfe] px-4 py-3 text-center text-sm font-black text-[#0f2f5f]">Preview public</Link>
            <Link href="/admin/b2b-marketplace/preview" className="rounded-full border border-[#d7e3f3] bg-[#f9fbfe] px-4 py-3 text-center text-sm font-black text-[#0f2f5f]">Preview Studio</Link>
            <button className="rounded-full border border-[#d7e3f3] bg-[#f9fbfe] px-4 py-3 text-sm font-black text-[#0f2f5f]">Draft-safe edits</button>
            <button className="rounded-full border border-[#d7e3f3] bg-[#f9fbfe] px-4 py-3 text-sm font-black text-[#0f2f5f]">Audit ready</button>
          </div>
        </div>

        <section className="mt-6">
          <AdminResourceManager definition={definition} initialRows={data} />
        </section>
      </div>
    </main>
  )
}
