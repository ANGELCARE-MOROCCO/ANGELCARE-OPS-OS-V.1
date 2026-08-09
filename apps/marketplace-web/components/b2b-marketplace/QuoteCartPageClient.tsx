'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useQuoteCart } from './QuoteCartProvider'

function money(value: number) {
  if (!value || value <= 0) return 'Prix catalogue à confirmer'
  return `${value.toLocaleString('fr-FR')} MAD`
}

export default function QuoteCartPageClient({ settings }: { settings?: Record<string, any> }) {
  const cart = useQuoteCart()
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setStatus('submitting')
    setMessage('')
    const payload = {
      schoolName: String(form.get('schoolName') || ''),
      contactName: String(form.get('contactName') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      city: String(form.get('city') || ''),
      message: String(form.get('message') || ''),
      lines: cart.lines,
    }
    try {
      const response = await fetch('/api/b2b-marketplace/public/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await response.json()) as { ok?: boolean; error?: string; reference?: string }
      if (!response.ok || !json.ok) throw new Error(json.error || 'Erreur de demande de devis')
      setStatus('success')
      setMessage(`Demande enregistrée: ${json.reference || 'AC-B2B-QUOTE'}`)
      cart.clear()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Erreur inconnue')
    }
  }

  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#eef5ff_55%,#fff7e4_100%)]">
        <div className="absolute right-[-12rem] top-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[#dcecff] blur-3xl" />
        <div className="absolute left-[-16rem] bottom-[-16rem] h-[36rem] w-[36rem] rounded-full bg-amber-100 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#092e63] via-[#2f69b2] to-[#d8a84a]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1.06fr_0.94fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-[#dbe6f3] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#092e63] shadow-sm">Panier B2B • Devis wholesale</div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-slate-950 md:text-7xl">{settings?.title || 'Demande de devis professionnelle'}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{settings?.subtitle || 'Configurez votre sélection, transmettez vos besoins, et recevez une proposition AngelCare adaptée aux quantités, formats, personnalisation et délais.'} Aucun paiement en ligne.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-black text-slate-700">
              {['Catalogue authentique', 'Prix de gros', 'Personnalisation logo', 'Réponse commerciale'].map((tag) => <span key={tag} className="rounded-full border border-[#dbe6f3] bg-white px-4 py-2 shadow-sm">{tag}</span>)}
            </div>
          </div>
          <div className="grid gap-3 rounded-[38px] border border-white/80 bg-white/70 p-4 shadow-2xl shadow-slate-300/40 backdrop-blur-2xl sm:grid-cols-3">
            {[
              ['01', 'Sélection', 'Produits, formations, packs'],
              ['02', 'Qualification', 'Crèche, ville, notes'],
              ['03', 'Proposition', 'Prix final AngelCare'],
            ].map(([n, label, note]) => <div key={n} className="rounded-[28px] border border-[#edf2f8] bg-white p-5 shadow-sm"><div className="text-xs font-black text-[#092e63]">{n}</div><div className="mt-1 text-sm font-black text-slate-900">{label}</div><div className="mt-2 text-xs leading-5 text-slate-500">{note}</div></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_0.82fr]">
        <div className="grid gap-6">
          <section className="rounded-[42px] border border-[#dbe6f3] bg-white p-6 shadow-sm shadow-slate-200/80">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#092e63]">Sélection commerciale</div>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Panier B2B</h2>
              </div>
              <div className="w-fit rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-black text-[#092e63]">{cart.count} unités • {money(cart.total)}</div>
            </div>
            {cart.lines.length ? (
              <div className="grid gap-4">
                {cart.lines.map((line) => (
                  <div key={line.lineId} className="rounded-[34px] border border-[#edf2f8] bg-[#f9fbfe] p-4 transition hover:border-[#cfe0f5] hover:bg-white hover:shadow-lg hover:shadow-slate-200/70">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#092e63] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">{line.itemType}</span>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#092e63] shadow-sm">{line.reference}</span>
                        </div>
                        <div className="mt-3 text-lg font-black leading-tight text-slate-900">{line.title}</div>
                        <div className="mt-2 text-sm font-bold text-slate-500">Prix indicatif unitaire: {money(line.estimatedUnitPriceMad)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#dbe6f3] bg-white p-1.5 shadow-sm">
                        <button type="button" onClick={() => cart.updateQuantity(line.lineId, line.quantity - 1)} className="h-9 w-9 rounded-full bg-[#f4f7fb] font-black">−</button>
                        <span className="w-10 text-center font-black">{line.quantity}</span>
                        <button type="button" onClick={() => cart.updateQuantity(line.lineId, line.quantity + 1)} className="h-9 w-9 rounded-full bg-[#092e63] font-black text-white">+</button>
                        <button type="button" onClick={() => cart.removeLine(line.lineId)} className="ml-2 rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Retirer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[36px] border border-dashed border-[#cbdced] bg-[#f9fbfe] p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#092e63] text-2xl font-black text-white">0</div>
                <div className="mt-5 text-2xl font-black text-slate-900">Votre panier B2B est vide.</div>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Ajoutez des produits, formations ou packs sur-mesure depuis le catalogue avant d’envoyer votre demande de devis.</p>
                <Link href="/b2b-marketplace/categories" className="mt-6 inline-flex rounded-full bg-[#092e63] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15">Explorer le catalogue</Link>
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              ['Catalogue réel', 'Références issues des pages sources.'],
              ['Prix indicatifs', 'Validation finale selon quantité.'],
              ['Sans paiement', 'Un conseiller prépare le devis.'],
            ].map(([title, text]) => <div key={title} className="rounded-[30px] border border-[#dbe6f3] bg-white p-5 shadow-sm"><div className="text-sm font-black text-slate-950">{title}</div><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>)}
          </section>
        </div>

        <section className="rounded-[42px] border border-[#dbe6f3] bg-white p-5 shadow-2xl shadow-slate-300/40 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-[34px] bg-[linear-gradient(135deg,#092e63,#17477f_55%,#d8a84a)] p-6 text-white shadow-xl shadow-blue-950/20">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Coordonnées crèche</div>
            <h2 className="mt-3 text-3xl font-black">Recevoir une proposition</h2>
            <p className="mt-3 text-sm leading-6 text-blue-50">Les informations ci-dessous permettent à AngelCare de qualifier le besoin et préparer une offre sérieuse.</p>
          </div>
          <form onSubmit={submitQuote} className="mt-6 grid gap-4">
            {[
              ['schoolName', 'Nom de la crèche / établissement'],
              ['contactName', 'Nom du contact'],
              ['phone', 'Téléphone'],
              ['email', 'Email'],
              ['city', 'Ville'],
            ].map(([name, label]) => (
              <label key={name} className="grid gap-2 text-sm font-black text-slate-700">
                {label}
                <input name={name} required className="rounded-2xl border border-[#dbe6f3] bg-[#fbfdff] px-4 py-3 outline-none transition focus:border-[#092e63] focus:bg-white focus:ring-4 focus:ring-blue-50" />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Notes de personnalisation / quantité / logo
              <textarea name="message" rows={5} className="rounded-2xl border border-[#dbe6f3] bg-[#fbfdff] px-4 py-3 outline-none transition focus:border-[#092e63] focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <button disabled={!cart.lines.length || status === 'submitting'} className="rounded-full bg-[#092e63] px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-950/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
              {status === 'submitting' ? 'Envoi...' : 'Envoyer la demande de devis'}
            </button>
            {message ? <div className={`rounded-2xl p-4 text-sm font-black ${status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{message}</div> : null}
          </form>
        </section>
      </section>
    </main>
  )
}
