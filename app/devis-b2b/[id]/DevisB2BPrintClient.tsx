'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type Row = Record<string, any>
function money(value: any) { return `${Number(value || 0).toLocaleString('fr-FR')} MAD` }
function todayIso() { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}` }
function todayFr() { return new Date().toLocaleDateString('fr-FR') }
function shortId(id: string) { return String(id || '').replace(/-/g,'').slice(0,8).toUpperCase() }
function first(...values: any[]) { return values.find((v) => v !== undefined && v !== null && v !== '') ?? '' }
function qty(line: Row) { return Number(first(line.quantity, line.qty, 1)) || 1 }
function unit(line: Row) { return Number(first(line.unitPriceMad, line.estimatedUnitPriceMad, line.unit_price_mad, line.estimated_unit_price_mad, line.price_mad, 0)) || 0 }
function lineTotal(line: Row) { return Number(first(line.totalMad, line.total_mad, line.estimated_total_mad, line.line_total_mad, 0)) || qty(line) * unit(line) }
function ref(line: Row) { return first(line.referenceCode, line.reference_code, line.item_ref, line.ref, '—') }
function title(line: Row) { return first(line.title, line.item_title, line.product_title, line.training_title, line.name, 'Ligne devis') }
function desc(line: Row) { return first(line.description, line.personalizationNotes, line.personalization_notes, line.notes, '') }
function type(line: Row) { return first(line.itemType, line.item_type, line.type, 'Catalogue') }
function unwrap(payload: any) { const root = payload?.data || payload || {}; const request = root.request || root.quoteRequest || payload?.request || {}; const lines = root.lines || root.quoteLines || payload?.lines || []; return { request, lines: Array.isArray(lines) ? lines : [] } }

export default function DevisB2BPrintClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [request, setRequest] = useState<Row>({})
  const [lines, setLines] = useState<Row[]>([])

  useEffect(() => { let alive = true; async function load() { try { const res = await fetch(`/api/b2b-marketplace/admin/quote-requests/${id}`, { cache: 'no-store' }); const json = await res.json().catch(() => ({})); if (!res.ok || !json.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`); const normalized = unwrap(json); if (!alive) return; setRequest(normalized.request); setLines(normalized.lines) } catch (err: any) { if (alive) setError(err?.message || 'Impossible de charger le devis.') } finally { if (alive) setLoading(false) } } load(); return () => { alive = false } }, [id])
  const total = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0) || Number(request.estimatedTotalMad || request.estimated_total_mad || 0), [request, lines])
  useEffect(() => { if (!loading && !error) { const timer = window.setTimeout(() => window.requestAnimationFrame(() => window.print()), 1200); return () => window.clearTimeout(timer) } }, [loading, error])

  const client = first(request.schoolName, request.school_name, request.organization_name, request.title, 'Établissement à confirmer')
  const contact = first(request.contactName, request.contact_name, 'Contact à confirmer')
  const phone = first(request.phone, request.telephone)
  const email = first(request.email)
  const city = first(request.city, request.ville)
  const source = first(request.source, 'Marketplace B2B')
  const message = first(request.message, request.customer_message, 'Demande commerciale issue du catalogue marketplace AngelCare.')
  const devisRef = first(request.devis_reference, request.quoteReference, request.quote_reference, `DEV-ACB2B-${todayIso()}-${shortId(id)}`)

  if (loading) return <main className="loading">Préparation du devis B2B...</main>
  if (error) return <main className="loading"><h1>Erreur devis</h1><p>{error}</p></main>

  return <>
    <main className="devis-page">
      <div className="devis-doc-header">
        <div>
          <div className="brand"><Image src="/logo.png" alt="AngelCare" width={155} height={58} priority /><div><strong>ANGELCARE</strong><span>Preschool & Kindergarten — B2B Marketplace</span></div></div>
          <div className="docTitle"><span>Document commercial</span><h1>DEVIS B2B</h1><p>Proposition indicative structurée pour validation commerciale AngelCare.</p></div>
        </div>
        <div className="refBox"><span>Référence devis</span><strong>{devisRef}</strong><span>Date d’édition</span><strong>{todayFr()}</strong><span>Source</span><strong>{source}</strong></div>
      </div>
      <section className="executiveStrip"><div><span>Client</span><strong>{client}</strong></div><div><span>Lignes</span><strong>{lines.length}</strong></div><div><span>Total indicatif</span><strong>{money(total)}</strong></div></section>
      <section className="grid"><div className="card"><span className="eyebrow">Identité client</span><h2>{client}</h2><p><b>Contact:</b> {contact}</p><p><b>Téléphone:</b> {phone || '—'}</p><p><b>Email:</b> {email || '—'}</p><p><b>Ville:</b> {city || '—'}</p></div><div className="card navy"><span className="eyebrow">Synthèse commerciale</span><h2>{money(total)}</h2><p>{message}</p></div></section>
      <section className="lines"><div className="sectionHead"><span>Sélection demandée</span><strong>{lines.length} ligne(s)</strong></div><table><thead><tr><th>Réf.</th><th>Désignation</th><th>Type</th><th>Qté</th><th>PU MAD</th><th>Total MAD</th></tr></thead><tbody>{lines.map((line, index) => <tr key={line.id || `${ref(line)}-${index}`}><td>{ref(line)}</td><td><strong>{title(line)}</strong><small>{desc(line)}</small></td><td>{type(line)}</td><td>{qty(line)}</td><td>{money(unit(line))}</td><td>{money(lineTotal(line))}</td></tr>)}</tbody></table><div className="totalBox"><span>Total indicatif selon validation commerciale</span><strong>{money(total)}</strong></div></section>
      <section className="terms"><div><strong>Conditions</strong><p>Prix indicatifs selon disponibilité, quantités, personnalisation, format, délais et validation commerciale AngelCare.</p></div><div><strong>Validité</strong><p>Document préparatoire non contractuel. Le devis final peut être ajusté après confirmation.</p></div><div><strong>Prochaine étape</strong><p>Validation client, confirmation technique, génération du devis final et planification.</p></div></section>
      <footer><div><strong>AngelCare — Preschool & Kindergarten</strong><span>Catalogue B2B premium pour crèches, maternelles et établissements préscolaires.</span></div><div><span>Document généré depuis le CRM B2B Marketplace</span></div></footer>
    </main>
    <div className="noPrint actions"><button onClick={() => window.print()}>Imprimer A4</button><button onClick={() => window.close()}>Fermer</button></div>
    <style jsx global>{`html,body{margin:0!important;background:#eef3f8!important;color:#081226!important;font-family:Inter,Arial,sans-serif!important}.loading{padding:48px;font-size:18px}.devis-page{width:210mm;min-height:297mm;margin:20px auto;padding:17mm;box-sizing:border-box;background:#fff;color:#081226;border-radius:20px;box-shadow:0 22px 80px rgba(15,23,42,.18)}.devis-doc-header{display:grid;grid-template-columns:1fr 72mm;gap:18px;padding-bottom:16px;border-bottom:2px solid #0b2d5c}.brand{display:flex;align-items:center;gap:14px;margin-bottom:18px}.brand strong{display:block;letter-spacing:.2em;font-size:13px}.brand span{display:block;margin-top:4px;color:#64748b;font-size:10px}.docTitle span,.eyebrow,.sectionHead span{display:block;color:#0b2d5c;text-transform:uppercase;letter-spacing:.18em;font-size:9px;font-weight:900}h1{margin:6px 0;font-size:42px;line-height:.95;color:#081226;letter-spacing:-.06em}.docTitle p{margin:0;max-width:110mm;color:#475569;font-size:12px;line-height:1.55}.refBox{background:linear-gradient(135deg,#0b2d5c,#103e7a);color:white;border-radius:22px;padding:16px;display:grid;gap:5px}.refBox span{color:rgba(255,255,255,.72);font-size:8.5px;text-transform:uppercase;letter-spacing:.15em}.refBox strong{color:white;font-size:12px;margin-bottom:7px;word-break:break-word}.executiveStrip{margin-top:16px;display:grid;grid-template-columns:1.4fr .5fr .8fr;gap:10px}.executiveStrip div,.card{border:1px solid #dbe7f4;border-radius:16px;padding:12px;background:#f8fbff}.executiveStrip span{display:block;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:.14em;font-weight:800}.executiveStrip strong{display:block;margin-top:5px;color:#081226;font-size:17px}.grid{margin-top:14px;display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.card{border-radius:18px;padding:15px;background:#fff}.card h2{margin:6px 0 9px;font-size:20px;color:#081226}.card p{margin:5px 0;font-size:11px;color:#334155;line-height:1.5}.navy,.navy *{background:#0b2d5c;color:white!important}.lines{margin-top:16px}.sectionHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.sectionHead strong{color:#081226;font-size:11px}table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #dbe7f4;border-radius:16px;overflow:hidden}th{background:#0b2d5c;color:white;padding:9px;text-align:left;font-size:8.5px;letter-spacing:.13em;text-transform:uppercase}td{padding:10px 9px;border-bottom:1px solid #e6edf6;color:#081226;font-size:10.5px;vertical-align:top}td strong{display:block;color:#081226;font-size:11px}td small{display:block;margin-top:3px;color:#64748b;line-height:1.35}.totalBox{margin-left:auto;margin-top:12px;width:72mm;background:#0b2d5c;color:white;border-radius:16px;padding:13px}.totalBox span{display:block;font-size:9px;color:rgba(255,255,255,.75);line-height:1.4}.totalBox strong{display:block;margin-top:5px;color:white;font-size:24px}.terms{margin-top:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.terms div{border:1px solid #dbe7f4;border-radius:14px;padding:11px}.terms strong{color:#0b2d5c;font-size:11px}.terms p{color:#475569;font-size:9.5px;line-height:1.45}footer{margin-top:16px;padding-top:11px;border-top:1px solid #dbe7f4;display:flex;justify-content:space-between;gap:12px;color:#64748b;font-size:9px}footer strong{display:block;color:#0b2d5c;margin-bottom:3px}.actions{width:210mm;margin:0 auto 24px;display:flex;justify-content:flex-end;gap:10px}.actions button{border:0;background:#0b2d5c;color:white;border-radius:999px;padding:12px 18px;font-weight:800;cursor:pointer}@page{size:A4;margin:0}@media print{html,body{background:white!important}.noPrint{display:none!important}body *{visibility:hidden!important}.devis-page,.devis-page *{visibility:visible!important}.devis-page{position:fixed!important;inset:0!important;margin:0!important;width:210mm!important;min-height:297mm!important;border-radius:0!important;box-shadow:none!important;padding:15mm!important;page-break-after:avoid!important}}`}</style>
  </>
}
