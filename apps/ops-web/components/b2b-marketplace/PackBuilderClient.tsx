'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AddToQuoteButton } from './QuoteCartProvider'
import type { AcademyModule, MarketplaceProduct } from '@/lib/b2b-marketplace/types'

const objectives = ['Préparer la rentrée', 'Organiser une journée portes ouvertes', 'Améliorer l’accueil parents', 'Renforcer l’image premium', 'Structurer les classes', 'Sécuriser hygiène & enfant', 'Former l’équipe', 'Créer une expérience graduation']
const budgets = ['Starter', 'Growth', 'Premium']

export default function PackBuilderClient({ products, modules }: { products: MarketplaceProduct[]; modules: AcademyModule[] }) {
  const [objective, setObjective] = useState(objectives[0])
  const [budget, setBudget] = useState(budgets[0])

  const suggestedProducts = useMemo(() => {
    const q = objective.toLowerCase()
    return products.filter((product) => [product.title, product.categorySlug, product.eventType, ...product.bestFor].join(' ').toLowerCase().includes(q.split(' ')[1] || q)).slice(0, 6)
  }, [objective, products])

  const visibleProducts = suggestedProducts.length ? suggestedProducts : products.slice(0, 6)
  const visibleModules = modules.slice(0, budget === 'Starter' ? 2 : budget === 'Growth' ? 4 : 6)
  const estimate = visibleProducts.reduce((sum, product) => sum + product.startingPriceMad, 0) + visibleModules.reduce((sum, module) => sum + module.startingPriceMad, 0)

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#eef5ff_52%,#fff7e4_100%)]">
        <div className="absolute right-[-12rem] top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div className="absolute left-[-14rem] bottom-[-14rem] h-[34rem] w-[34rem] rounded-full bg-amber-100 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#092e63] via-[#2f69b2] to-[#d8a84a]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63] shadow-sm">Pack sur-mesure • références réelles</div>
            <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">Custom Pack Builder B2B</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Composez un pack depuis les produits et formations authentiques du catalogue, sans inventer de référence ni prix officiel. Le résultat part directement vers une demande de devis.</p>
          </div>
          <aside className="rounded-[42px] border border-white/80 bg-white/70 p-5 shadow-2xl shadow-slate-300/40 backdrop-blur-2xl">
            <div className="rounded-[34px] border border-[#dbe6f3] bg-white p-6 shadow-sm">
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Objectif commercial
                  <select value={objective} onChange={(event) => setObjective(event.target.value)} className="rounded-2xl border border-[#dbe6f3] bg-[#fbfdff] px-4 py-3 outline-none focus:border-[#092e63]">
                    {objectives.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Niveau budget
                  <select value={budget} onChange={(event) => setBudget(event.target.value)} className="rounded-2xl border border-[#dbe6f3] bg-[#fbfdff] px-4 py-3 outline-none focus:border-[#092e63]">
                    {budgets.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <div className="rounded-[30px] bg-[#092e63] p-5 text-white shadow-lg shadow-blue-950/15">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">Estimation indicative</div>
                  <div className="mt-2 text-4xl font-black">{estimate.toLocaleString('fr-FR')} MAD</div>
                  <p className="mt-2 text-sm leading-6 text-blue-50">Le prix final dépend des quantités, supports, personnalisation et validation AngelCare.</p>
                </div>
                <Link href="/b2b-marketplace/quote-cart" className="rounded-full bg-[#092e63] px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-blue-950/15">Ouvrir le panier B2B</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[42px] border border-[#dbe6f3] bg-white p-6 shadow-sm shadow-slate-200/80">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#092e63]">Produits recommandés</div>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Sélection catalogue</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Les lignes ci-dessous sont des références réelles. Ajoutez seulement ce qui doit entrer dans votre devis.</p>
          <div className="mt-6 grid gap-4">
            {visibleProducts.map((product) => <div key={product.id} className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#edf2f8] bg-[#f9fbfe] p-4 transition hover:bg-white hover:shadow-lg md:flex-row md:items-center"><div><div className="text-xs font-black uppercase tracking-[0.16em] text-[#092e63]">{product.reference}</div><div className="mt-1 font-black text-slate-900">{product.title}</div><p className="mt-1 text-sm leading-6 text-slate-600">{product.shortDescription}</p></div><AddToQuoteButton itemType="product" reference={product.reference} title={product.title} estimatedUnitPriceMad={product.startingPriceMad} label="Ajouter" /></div>)}
          </div>
        </div>
        <div className="rounded-[42px] border border-[#dbe6f3] bg-white p-6 shadow-sm shadow-slate-200/80">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Formations optionnelles</div>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Montée en compétences</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Ajoutez des modules Academy pour transformer le pack en programme terrain complet.</p>
          <div className="mt-6 grid gap-4">
            {visibleModules.map((module) => <div key={module.id} className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#edf2f8] bg-[#f9fbfe] p-4 transition hover:bg-white hover:shadow-lg md:flex-row md:items-center"><div><div className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">{module.reference}</div><div className="mt-1 font-black text-slate-900">{module.title}</div><p className="mt-1 text-sm leading-6 text-slate-600">{module.shortDescription}</p></div><AddToQuoteButton itemType="training" reference={module.reference} title={module.title} estimatedUnitPriceMad={module.startingPriceMad} label="Ajouter" /></div>)}
          </div>
        </div>
      </section>
    </main>
  )
}
