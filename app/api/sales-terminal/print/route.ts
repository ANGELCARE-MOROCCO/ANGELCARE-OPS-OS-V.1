import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const esc = (v: unknown) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;")
const money = (v: unknown) => Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateFr = () => new Date().toLocaleDateString('fr-FR')

function styles() {
  return `
  @page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:white}.page{min-height:100vh;position:relative;padding-bottom:70px}
  .actions{position:fixed;right:18px;top:18px;z-index:9}.actions button{border:0;border-radius:10px;padding:10px 12px;background:#0f172a;color:#fff;font-weight:900;cursor:pointer}
  .top{display:grid;grid-template-columns:1fr 1fr;gap:18px}.logo{font-size:27px;font-weight:950;color:#173da5;line-height:1}.logo span{color:#16a34a}.tag{color:#173da5;font-size:11px;font-weight:800;margin-top:-2px}
  .box{border:2px solid #222;padding:8px 10px;font-size:10px;line-height:1.35;font-weight:800}.title{text-align:right}.docTitle{font-size:58px;line-height:1;font-weight:950;margin:0 0 8px;letter-spacing:1px}
  .infoGrid{display:grid;grid-template-columns:70px 1fr;gap:10px;align-items:center;margin-top:8px}.pour{font-weight:900;font-size:12px;text-align:right}.info{border:2px solid #222;padding:8px 10px;text-align:left;font-size:10px;line-height:1.45;font-weight:800}
  table{width:100%;border-collapse:collapse}.offer{margin-top:22px;font-size:10px}.offer th{background:#050505;color:#fff;border:2px solid #111;padding:5px;font-size:11px}.offer td{border:1.7px solid #222;padding:6px 7px;vertical-align:top;font-weight:700}
  .desc{font-weight:950}.sub{font-style:italic;font-size:9px;font-weight:700}.num{text-align:right;white-space:nowrap}.center{text-align:center}.noteLine{font-size:9px;font-weight:800;margin:7px 0 8px}
  .totalBox{width:38%;margin-left:auto;border:2px solid #111;display:grid;grid-template-columns:1fr 1fr;align-items:center;margin-top:-1px}.totalBox div{padding:7px;font-weight:950}.value{font-size:15px}
  .sectionTitle{margin:22px 0 10px;font-size:14px;font-weight:950;text-decoration:underline}.program th{background:#d9d9d9;border:1.6px solid #111;padding:6px;font-size:10px}.program td{border:1.6px solid #111;padding:6px;height:58px;vertical-align:top;font-size:9.5px;font-weight:750}
  .sessionTitle{margin-top:28px;font-size:13px;font-weight:950}.sessionSub{font-size:10px;font-style:italic;font-weight:700;margin-bottom:8px}.session{width:58%;font-size:9px}.session th,.session td{border:1.5px solid #111;padding:5px;text-align:center}.session th{background:#d9d9d9;font-weight:950}
  .noteDevis{margin-top:28px;font-size:13px}.noteDevis strong{text-decoration:underline}.bottom{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:86px;align-items:end}.contact{font-size:11px;line-height:1.25;font-weight:800}.contact .big{font-size:21px;font-weight:950}
  .stamp{text-align:center;color:#173da5;font-weight:950}.red{color:#e11d48;font-size:12px;margin-top:4px}.footer{position:absolute;left:0;right:0;bottom:0;font-size:7.5px;text-align:center;font-weight:800;line-height:1.35}
  @media print{.actions{display:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `
}

function quoteHtml(doc:any, order:any) {
  const ref = doc?.document_ref || `D-${order?.order_ref || ''}`
  const total = order?.total_amount || doc?.total_amount || 0
  const client = order?.client_name || 'CLIENT'
  const service = order?.service_type || 'SERVICE ANGELCARE'
  const cat = order?.service_category || 'SVC'
  const city = order?.city || '—'
  return `<!doctype html><html><head><meta charset="utf-8"/><title>DEVIS ${esc(ref)}</title><style>${styles()}</style></head><body>
  <div class="actions"><button onclick="window.print()">Imprimer / PDF</button></div><main class="page">
  <section class="top"><div><div class="logo"><span>●</span> ANGEL CARE</div><div class="tag">Preschool & Kindergarten</div><br/><div class="box">N°13 QUARTIER ALAWYN RUE KUWAIT 077 APT3<br/>CENTRE VILLE 12000 TÉMARA.<br/>Contact : SERVICE CLIENT<br/>Tél : +212 695 342 566<br/>E-mail : commercial@angelcare.ma</div></div>
  <div class="title"><h1 class="docTitle">DEVIS</h1><div class="infoGrid"><div class="pour">POUR:</div><div class="info">DATE : ${esc(dateFr())}<br/>N° DEVIS: ${esc(ref)}<br/>OBJET: ${esc(service)}<br/>CONTACT: ${esc(client)}<br/>TÉL : ${esc(order?.client_phone || '')}<br/>RÉGION : ${esc(city)}</div></div></div></section>
  <table class="offer"><thead><tr><th style="width:7%">REF</th><th>DESIGNATION /DESCRIPTION</th><th style="width:8%">CAT</th><th style="width:10%">P.U</th><th style="width:10%">QTÉ</th><th style="width:13%">TOTAL</th></tr></thead><tbody>
  <tr><td></td><td class="desc">OFFRE SERVICE ${esc(service).toUpperCase()}</td><td class="center">${esc(cat).toUpperCase()}</td><td></td><td></td><td></td></tr>
  <tr><td></td><td><strong>FORFAIT / SERVICE</strong> <span class="sub">(${esc(order?.notes || 'Selon besoin client')})</span></td><td class="center">SVC</td><td class="num">${money(order?.unit_price || total)}</td><td class="center">${esc(order?.quantity || 1)}</td><td class="num">${money(total)}</td></tr>
  <tr><td></td><td><strong>OPTION AJUSTABLE</strong> <span class="sub">(à confirmer selon disponibilité et planning)</span></td><td class="center">SVC</td><td class="num">—</td><td class="center">—</td><td class="num">EN COURS</td></tr>
  </tbody></table><div class="noteLine">NOTE: Veuillez prendre le temps de choisir la formule qui répond le mieux à votre besoin.</div><div class="totalBox"><div>TOTAL <em>T.T.C</em>:</div><div class="value">(EN COURS) DHS*</div></div>
  <h2 class="sectionTitle">Proposition de programme d’activités:</h2><table class="program"><thead><tr><th>Jour 1 et Jour 6</th><th>Jour 2 et Jour 7</th><th>Jour 3 - Jour 8</th><th>Jour 4 - Jour 9</th><th>Jour 5 - Jour 10</th></tr></thead><tbody><tr><td><b>J1</b> - ART CRÉATIVE<br/><b>J6</b> - ATELIER SENSORIEL</td><td><b>J2</b> - ATELIER FLASH CARTES LINGUISTIQUE.<br/><b>J7</b> - ATELIER FLASH CARTES ZOOLOGIE.</td><td><b>J3</b> - ACTIVITÉ SENSORIEL.<br/><b>J8</b> - COORDINATION MOTRICE</td><td><b>J4</b> - ART CRÉATIVE.<br/><b>J9</b> - ATELIER FLASH CARTES LINGUISTIQUE.</td><td><b>J5</b> - ATELIER COGNITIF.<br/><b>J10</b> - ACTIVITÉ DOMESTIQUE.</td></tr></tbody></table>
  <div class="sessionTitle">N.B: VOICI LE DÉROULEMENT DE NOS SESSION 8 HEURES:</div><div class="sessionSub">(Nous pourrons s’adapter à votre routine en cas de besoin)</div><table class="session"><thead><tr><th colspan="4">SESSION DE 3 HEURES</th></tr></thead><tbody><tr><td><b>15 - 30 mins</b></td><td><b>60 mins</b></td><td><b>15 - 30 mins</b></td><td><b>45 - 60 mins</b></td></tr><tr><td>-Commencement<br/>-Rituels stimulants</td><td>Activité matinale</td><td>Pause Snack</td><td>Suite activité matinale</td></tr></tbody></table>
  <div class="noteDevis"><strong>NOTE DEVIS:</strong><br/>Nous restons bien entendu à votre disposition pour ajuster l’offre en fonction de vos préférences.<br/>Dans l’attente de votre retour pour confirmation.</div>
  <section class="bottom"><div class="contact"><div class="big">ANGELCARE</div>CENTRE D’OPÉRATION<br/>& TRAITEMENT DE SERVICE<br/>SERVICE CLIENT<br/>+212 695 342 566<br/>commercial@angelcare.ma<br/><u>www.angelcarehub.com</u></div><div class="stamp">ANGEL CARE<br/>WWW.ANGELCAREHUB.COM<br/>BACKOFFICE@ANGELCAREHUB.COM<div class="red">CACHET & SIGNATURE ELECTRONIQUE</div></div></section>
  <footer class="footer">ANGELCARE UNITÉ D’AFFAIRE ARTAB S.A.R.L (A.U) CAPITAL 100.000.00Dhs &nbsp; SIEGE : N°44 RUE , AGULEMANE SIDI ALI N°7 1ER ETAGE BAS AGDAL RABAT, MAROC. R.C : 137987 / IF : 37514792 / ICE : 002176718000041 / T.P : 25702977 / CNSS : 1507193 / +212 695342566 E-MAIL : SUPPORT@ANGELCAREHUB.COM / WWW.ANGELCAREHUB.COM</footer>
  </main></body></html>`
}

function simpleHtml(title:string, doc:any, order:any) {
  const ref = doc?.document_ref || order?.order_ref || ''
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(title)} ${esc(ref)}</title><style>${styles()}</style></head><body><div class="actions"><button onclick="window.print()">Imprimer / PDF</button></div><main class="page"><section class="top"><div><div class="logo"><span>●</span> ANGEL CARE</div><div class="tag">Preschool & Kindergarten</div><br/><div class="box">SERVICE CLIENT<br/>+212 695 342 566<br/>commercial@angelcare.ma<br/>www.angelcarehub.com</div></div><div class="title"><h1 class="docTitle">${esc(title)}</h1><div class="info">DATE : ${dateFr()}<br/>REF : ${esc(ref)}<br/>CLIENT : ${esc(order?.client_name || '')}</div></div></section><table class="offer"><thead><tr><th>DESIGNATION</th><th>P.U</th><th>QTÉ</th><th>TOTAL</th></tr></thead><tbody><tr><td>${esc(order?.service_type || 'Service AngelCare')}</td><td class="num">${money(order?.unit_price || order?.total_amount)}</td><td class="center">${esc(order?.quantity || 1)}</td><td class="num">${money(order?.total_amount)}</td></tr></tbody></table><div class="totalBox"><div>TOTAL:</div><div class="value">${money(order?.total_amount)} DHS</div></div><section class="bottom"><div class="contact"><div class="big">ANGELCARE</div>Service Client<br/>+212 695 342 566</div><div class="stamp">CACHET & SIGNATURE</div></section><footer class="footer">ANGELCARE UNITÉ D’AFFAIRE ARTAB S.A.R.L (A.U) / WWW.ANGELCAREHUB.COM</footer></main></body></html>`
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok:false, message:'Missing document id.' }, { status:400 })
  const supabase = await createClient()
  const { data: doc, error: docError } = await supabase.from('sales_terminal_documents').select('*').eq('id', id).single()
  if (docError) return NextResponse.json({ ok:false, message:docError.message }, { status:500 })
  const { data: order, error: orderError } = await supabase.from('sales_terminal_orders').select('*').eq('id', doc.order_id).single()
  if (orderError) return NextResponse.json({ ok:false, message:orderError.message }, { status:500 })
  const html = doc.document_type === 'quote' ? quoteHtml(doc, order) : doc.document_type === 'invoice' ? simpleHtml('FACTURE', doc, order) : doc.document_type === 'delivery' ? simpleHtml('BON DE LIVRAISON', doc, order) : simpleHtml('DOCUMENT', doc, order)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
