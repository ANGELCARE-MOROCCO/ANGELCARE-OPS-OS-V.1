import type { FlightDeckOrder, FlightDeckSnapshot } from '../transaction-flight-deck/types'
import type { OrderCommandPermissions } from '../customer-commerce/order-permissions'

export type Row = Record<string, unknown>
export type Area = 'pilotage' | 'commandes' | 'planning' | 'execution' | 'fournisseurs'
export type Permissions = OrderCommandPermissions & { supplier: boolean; supplierApprove: boolean; dispatch: boolean; assign: boolean }
export type Query = { area: Area; q: string; type: string; status: string; source: string; payment: string; territory: string; period: string; order: string }
export const base = '/angelcare-marketplace/admin'
export const tabs = [
  ['pilotage','Pilotage'], ['commandes','Commandes'], ['planning','Planning'],
  ['execution','Exécution'], ['fournisseurs','Fournisseurs'],
] as const
export const kinds = [
  ['product','Produits & kits'],['service','Services'],['subscription','Abonnements'],
  ['academy','Academy'],['b2b','B2B'],['assessment','Évaluations'],['partner','Partenaires'],
] as const
export const stageLabels: Record<string,string> = {
  new:'À accueillir',payment:'Paiement attendu',confirmed:'Confirmée',preparation:'Préparation',
  assigned:'Affectation',scheduled:'Planifiée',executing:'En exécution',blocked:'Bloquée',
  recovery:'Recovery',completed:'Terminée',financial_close:'À rapprocher',closed:'Clôturée',cancelled:'Annulée',
}
export const paymentLabels:Record<string,string>={captured:'Capturé',partially_captured:'Partiellement capturé',authorized:'Autorisé',reconciled:'Rapproché',pending:'En attente',created:'Créé',not_started:'Non initié',paid:'Payé',refunded:'Remboursé',partially_refunded:'Partiellement remboursé',failed:'Échoué',cancelled:'Annulé',requires_method:'Moyen requis',requires_customer_action:'Action client requise'}
export const stateLabel=(value:string)=>paymentLabels[value]||({eligible:'Éligible',active:'Actif',assigned:'Affectée',brief_acknowledged:'Brief confirmé',travel_ready:'Prête au départ',completed:'Terminée',staffing_required:'Affectation requise',proposed:'Proposée',selected:'Sélectionnée',rejected:'Rejetée',accepted:'Acceptée',awaiting_acceptance:'Acceptation attendue',in_progress:'En cours',validated:'Validée',closed:'Clôturée',scheduled:'Planifiée',preparing:'Préparation',pending:'En attente',draft:'Brouillon'} as Record<string,string>)[value]||value.replaceAll('_',' ')
export const paymentTone=(o:FlightDeckOrder)=>['failed','cancelled'].includes(o.paymentStatus)?'red':o.outstanding>.009?'amber':o.captured>0?'green':'blue'
export const text = (v: unknown): string => typeof v === 'string' ? v : v == null ? '' : String(v)
export const number = (v: unknown): number => Number.isFinite(Number(v)) ? Number(v) : 0
export const object = (v: unknown): Row => v && typeof v === 'object' && !Array.isArray(v) ? v as Row : {}
export const rows = (v: unknown): Row[] => Array.isArray(v) ? v.filter(x => x && typeof x === 'object') as Row[] : []
export const amount = (v: unknown, currency = 'MAD') => `${number(v).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} ${currency}`
export const date = (v: unknown) => {
  const d = new Date(text(v)); return Number.isFinite(d.valueOf()) ? new Intl.DateTimeFormat('fr-FR',{timeZone:'Africa/Casablanca',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(d) : 'Non défini'
}
export const dayKey = (v: string) => {
  const d = new Date(v); return Number.isFinite(d.valueOf()) ? new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit',day:'2-digit'}).format(d) : ''
}
export function family(type: string) {
  if (['product_order','kit_order'].includes(type)) return 'product'
  if (['family_booking','service_booking'].includes(type)) return 'service'
  if (type === 'recurring_service') return 'subscription'
  if (type === 'academy_enrollment') return 'academy'
  if (['b2b_quotation','hospitality_programme','corporate_benefit'].includes(type)) return 'b2b'
  if (type === 'quality_assessment') return 'assessment'
  if (type === 'partner_activation') return 'partner'
  return type || 'other'
}
export const kindLabel = (type: string) => kinds.find(k => k[0] === family(type))?.[1] || type.replaceAll('_',' ')
export const serviceOrder = (o: FlightDeckOrder) => ['service','subscription','academy','assessment','b2b'].includes(family(o.journeyType))
export function parseQuery(input: Record<string, string | undefined>): Query {
  return { area: tabs.some(t => t[0] === input.area) ? input.area as Area : 'pilotage', q: input.q || input.customer || '', type: input.type || '', status: input.status || '', source: input.source || '', payment: input.payment || '', territory: input.territory || '', period: ['7','30','90'].includes(input.period || '') ? input.period! : '', order: input.order || '' }
}
export function filterOrders(orders: FlightDeckOrder[], query: Query, now = Date.now()) {
  const q = query.q.trim().toLocaleLowerCase('fr')
  return orders.filter(o => (!q || [o.reference,o.customerName,o.customerId,o.title,o.providerName,o.id].join(' ').toLocaleLowerCase('fr').includes(q))
    && (!query.type || family(o.journeyType) === query.type || o.journeyType === query.type)
    && (!query.status || query.status.split('|').includes(o.stage) || query.status.split('|').includes(o.status))
    && (!query.source || o.source === query.source)
    && (!query.payment || o.paymentStatus === query.payment)
    && (!query.territory || o.territoryId === query.territory)
    && (!query.period || new Date(o.createdAt).valueOf() >= now - Number(query.period)*86400000))
}
export function groupedMoney(orders: FlightDeckOrder[], field: 'amount'|'captured'|'outstanding') {
  const byCurrency = new Map<string,number>()
  orders.forEach(o => { const c=o.currency || 'MAD'; byCurrency.set(c,(byCurrency.get(c)||0)+o[field]) })
  return [...byCurrency].map(([c,n]) => amount(n,c)).join(' · ') || '—'
}
export function lanes(orders: FlightDeckOrder[]) {
  return [
    {label:'À préparer',tone:'amber',orders:orders.filter(o=>['new','payment','confirmed','preparation','assigned','scheduled','blocked','recovery'].includes(o.stage))},
    {label:'En cours',tone:'blue',orders:orders.filter(o=>o.stage==='executing')},
    {label:'À valider',tone:'violet',orders:orders.filter(o=>o.stage==='financial_close'||o.stage==='completed')},
    {label:'Terminées',tone:'green',orders:orders.filter(o=>o.stage==='closed')},
  ]
}
export function decoder(o: FlightDeckOrder, snapshot: FlightDeckSnapshot) {
  const result: Array<{key:string;title:string;cause:string;impact:string;action:string;kind:'provider'|'schedule'|'payment'|'exception'|'proof'|'dossier'}> = []
  if (serviceOrder(o) && !o.providerId) result.push({key:'provider',title:'Intervenant à affecter',cause:o.missionId?'La mission existe ; le moteur de dispatch peut calculer des propositions.':'Aucune mission canonique reliée. La matérialiser depuis Mission Control.',impact:'Affectation non confirmée',action:o.missionId?'Comparer les propositions':'Ouvrir Mission Control',kind:'provider'})
  if (serviceOrder(o) && !o.scheduledStart) result.push({key:'schedule',title:'Créneau à définir',cause:'Le début et la fin de la prestation ne sont pas renseignés.',impact:'Planning incomplet',action:'Planifier ici',kind:'schedule'})
  if (o.outstanding > .009) result.push({key:'payment',title:'Solde client à examiner',cause:`Net capturé ${amount(o.captured-o.refunded,o.currency)} ; solde ${amount(o.outstanding,o.currency)}.`,impact:'Décision financière requise',action:'Ouvrir les paiements',kind:'payment'})
  const exception=snapshot.exceptions.find(e=>e.orderId===o.id)
  if (exception) result.push({key:exception.id,title:exception.title,cause:exception.nextAction,impact:exception.status,action:'Traiter le cas ici',kind:'exception'})
  if (o.fulfillmentCaseId && !o.closure.evidence) result.push({key:'proof',title:'Preuves à examiner',cause:'Aucune preuve validée remontée pour ce fulfillment.',impact:'Validation qualité ouverte',action:'Ouvrir le dossier de preuves',kind:'proof'})
  if (!result.length) result.push({key:'dossier',title:o.nextAction || 'Examiner les engagements',cause:'Les contrôles visibles ne suffisent pas à déclarer le dossier clos. Le dossier expose les obligations et pièces liées.',impact:stageLabels[o.stage]||o.status,action:'Examiner le dossier 360',kind:'dossier'})
  return result
}
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url,{credentials:'same-origin',cache:'no-store',...init})
  const packet = await response.json().catch(()=>null) as { data?: T; error?: {message?:string} } | null
  if (!response.ok || packet?.data === undefined) throw new Error(packet?.error?.message || `Requête impossible (${response.status}).`)
  return packet.data
}
export function csvCell(v: unknown) { return `"${text(v).replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')}"` }
export function downloadCsv(filename: string, headings: string[], values: unknown[][]) {
  const content='\uFEFF'+[headings,...values].map(r=>r.map(csvCell).join(',')).join('\r\n')
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)
}
