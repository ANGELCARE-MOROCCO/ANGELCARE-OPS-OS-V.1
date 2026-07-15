'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Snapshot = {
  counts?: Record<string, number>
  recent?: Array<{ id: string; type: string; title: string; partner: string; date: string }>
  score?: { health?: number; certification_rate?: number; conversion_rate?: number; presence_rate?: number }
  finance?: { revenue_mad?: number; forecast_mad?: number }
  alerts?: { high_risks?: number; partners_at_risk?: number; sla_rate?: number }
  generated_at?: string
  warning?: string
}

type KpiTone = 'blue' | 'green' | 'purple'

type SideItem = { label: string; href: string; icon: string; active?: boolean }

type SideGroup = { title: string; items: SideItem[] }

const sideGroups: SideGroup[] = [
  { title: 'Pilotage', items: [{ label: 'Command Center', href: '/traininghub', icon: '⌘', active: true }] },
  { title: 'Partenaires', items: [{ label: 'Partenaires', href: '/traininghub/partners', icon: '◇' }, { label: 'Dossier partenaire', href: '/traininghub/partners', icon: '▣' }] },
  { title: 'Revenus', items: [{ label: 'Commercial', href: '/traininghub/commercial', icon: '◉' }, { label: 'Offres', href: '/traininghub/offres', icon: '▱' }, { label: 'Commandes', href: '/traininghub/orders', icon: '▰' }, { label: 'Facturation', href: '/traininghub/billing', icon: '◌' }, { label: 'Crédits formation', href: '/traininghub/credits', icon: '✺' }] },
  { title: 'Catalogue', items: [{ label: 'Catalogue', href: '/traininghub/catalogue', icon: '▤' }, { label: 'Catégories', href: '/traininghub/categories', icon: '⬡' }, { label: 'Sessions', href: '/traininghub/sessions', icon: '◷' }, { label: 'Participants', href: '/traininghub/participants', icon: '♙' }, { label: 'Formateurs', href: '/traininghub/trainers', icon: '♟' }, { label: 'Inscriptions', href: '/traininghub/attendance', icon: '✓' }] },
  { title: 'Administration', items: [{ label: 'Certificats', href: '/traininghub/certificates', icon: '✦' }, { label: 'Documents', href: '/traininghub/documents', icon: '▣' }, { label: 'Batch', href: '/traininghub/reports', icon: '▧' }, { label: 'Qualité', href: '/traininghub/quality', icon: '★' }, { label: 'Rapports', href: '/traininghub/reports', icon: '◫' }] },
  { title: 'Pilotage partenaires', items: [{ label: 'Demandes partenaires', href: '/traininghub/requests', icon: '✉' }, { label: 'Notifications', href: '/traininghub/notifications', icon: '◔' }] },
]

const chain = [
  ['01', 'Partenaires', 'partners', 'actifs'],
  ['02', 'Offres', 'proposals', 'ouvertes'],
  ['03', 'Commandes', 'orders', 'confirmées'],
  ['04', 'Factures', 'invoices', 'à livrer'],
  ['05', 'Crédits', 'credits', 'disponibles'],
  ['06', 'Sessions', 'sessions', 'à venir'],
  ['07', 'Présence', 'participants', 'participants'],
  ['08', 'Certificat', 'certificates', 'en attente'],
  ['09', 'Archivage', 'documents', 'à traiter'],
] as const

function number(value: unknown) { return new Intl.NumberFormat('fr-MA').format(Number(value || 0)) }
function money(value: unknown) {
  const n = Number(value || 0)
  if (n >= 1000) return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(n / 1000)} K MAD`
  return `${new Intl.NumberFormat('fr-MA').format(n)} MAD`
}
function dateLabel(value?: string) {
  if (!value) return 'Aujourd’hui'
  try { return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) } catch { return 'Aujourd’hui' }
}

export default function TrainingHubCommandCenterFinal() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/traininghub/internal/command-center', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      setSnapshot(payload?.data || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const counts = snapshot?.counts || {}
  const score = snapshot?.score || {}
  const finance = snapshot?.finance || {}
  const alerts = snapshot?.alerts || {}
  const visualFallback = !snapshot || Object.values(counts).every((value) => !value)
  const v = (key: string, fallback: number) => visualFallback ? fallback : Number(counts[key] || 0)

  const health = Number(score.health || (visualFallback ? 86 : 72))
  const certificationRate = Number(score.certification_rate || (visualFallback ? 92.7 : 0))
  const conversionRate = Number(score.conversion_rate || (visualFallback ? 73.6 : 0))
  const presenceRate = Number(score.presence_rate || (visualFallback ? 89.2 : 0))

  const kpis = useMemo(() => [
    { icon: '♙', label: 'Partenaires actifs', value: v('partners', 128), note: 'vs mois précédent', delta: '+6', tone: 'blue' as KpiTone },
    { icon: '▤', label: 'Offres ouvertes', value: v('proposals', 87), note: 'vs mois précédent', delta: '+4', tone: 'blue' as KpiTone },
    { icon: '▰', label: 'Commandes confirmées', value: v('orders', 64), note: 'vs mois précédent', delta: '+2', tone: 'green' as KpiTone },
    { icon: '▣', label: 'Factures à livrer', value: v('invoices', 23), note: '82,4 K MAD', delta: '', tone: 'purple' as KpiTone },
    { icon: '◈', label: 'Crédits disponibles', value: v('credits', 312), note: '12,4 K MAD', delta: '', tone: 'blue' as KpiTone },
    { icon: '▣', label: 'Sessions à venir', value: v('sessions', 42), note: 'cette semaine', delta: '+6', tone: 'green' as KpiTone },
    { icon: '🛡', label: 'Certificats émis', value: v('certificates', 56), note: 'vs mois précédent', delta: '+4', tone: 'purple' as KpiTone },
    { icon: '✉', label: 'Demandes ouvertes', value: v('requests', 19), note: 'vs mois précédent', delta: '+3', tone: 'blue' as KpiTone },
  ], [counts, visualFallback])

  const recent = snapshot?.recent?.length ? snapshot.recent : [
    { id: '1', type: 'Commande', title: 'Commande CMD-2025-064 confirmée', partner: 'Partenaire Alpha', date: '2025-06-10T11:45:00Z' },
    { id: '2', type: 'Session', title: 'Session Leadership exécutif créée', partner: 'Partenaire Beta', date: '2025-06-10T09:30:00Z' },
    { id: '3', type: 'Certificat', title: 'Certificat délivré', partner: 'Partenaire Gamma', date: '2025-06-10T09:12:00Z' },
    { id: '4', type: 'Facture', title: 'Facture FAC-2025-023 générée', partner: 'Partenaire Delta', date: '2025-06-10T08:14:00Z' },
  ]

  return (
    <main className="thcc-page">
      <aside className="thcc-sidebar">
        <div className="thcc-logo-zone"><img src="/logo.png" alt="AngelCare" /><div><strong>TrainingHub</strong><span>Portail partenaires</span></div></div>
        <nav className="thcc-nav">
          {sideGroups.map((group) => <div key={group.title} className="thcc-nav-group"><div className="thcc-nav-title">{group.title}</div>{group.items.map((item) => <Link key={`${group.title}-${item.label}`} href={item.href} className={item.active ? 'thcc-nav-link active' : 'thcc-nav-link'}><span>{item.icon}</span><b>{item.label}</b></Link>)}</div>)}
        </nav>
        <button className="thcc-reduce">‹ Réduire</button>
      </aside>

      <section className="thcc-main">
        <header className="thcc-header"><div><h1>TrainingHub Command Center</h1><p>Pilotage central des partenaires, revenus, sessions, certificats, demandes, risques et opérations.</p></div><div className="thcc-actions"><button className="ghost">▣ Vue portefeuille</button><button className="primary">⚡ Action prioritaire</button><button className="ghost">▽ Filtres⌄</button><label className="search"><span>⌕</span><input placeholder="Rechercher…" /></label><button className="ghost">▣ 01 - 30 juin 2025</button><button className="ghost">⇩ Exporter</button><div className="profile"><strong>MC</strong><span>Marie Carbonneau<small>Admin système</small></span></div></div></header>
        {snapshot?.warning ? <div className="thcc-warning">{snapshot.warning}</div> : null}

        <section className="thcc-hero-grid"><div className="hero"><i /><em /><div><span>Bienvenue Marie</span><h2>Pilotez vos partenaires, revenus, sessions, certificats, demandes, risques et opérations en temps réel.</h2><p>ⓘ Chaîne opérationnelle intégrée du partenariat à la délivrance et au renouvellement.</p></div></div><div className="overview"><div className="card-top"><strong>Vue d’ensemble</strong><button>Ce mois-ci⌄</button></div><div className="overview-grid"><OverviewMetric label="Chiffre d’affaires" value={money(finance.revenue_mad || (visualFallback ? 128400 : 0))} delta="+4,8% vs mai" /><OverviewMetric label="Sessions délivrées" value={v('sessions', 42)} delta="+9,5% vs mai" /><OverviewMetric label="Taux de certification" value={`${certificationRate}%`} delta="+4,3pts vs mai" /></div></div><div className="health"><div className="rail-title"><span>●</span><strong>Score de santé globale</strong></div><div className="gauge"><div className="gauge-track" /><div className="gauge-fill" style={{ transform: `rotate(${Math.max(0, Math.min(100, health)) * 1.8 - 90}deg)` }} /><div className="gauge-center"><strong>{health}</strong><span>/100</span><small>{health >= 80 ? 'Excellent' : 'À renforcer'}</small></div></div></div></section>

        <section className="kpi-grid">{kpis.map((kpi) => <Kpi key={kpi.label} {...kpi} />)}</section>

        <section className="chain-card"><div className="section-head"><p><strong>Chaîne opérationnelle</strong> — De la relation partenaire au certificat</p><button>Voir le détail de la chaîne ›</button></div><div className="chain-row">{chain.map(([idx, label, key, unit], index) => <div key={label} className="chain-wrap"><div className="chain-item"><b>{idx}</b><strong>{label}</strong><span>{number(v(key, index === 0 ? 128 : index === 1 ? 87 : index === 2 ? 64 : index === 3 ? 23 : index === 4 ? 312 : index === 5 ? 42 : index === 6 ? 136 : index === 7 ? 56 : 8))} {unit}</span></div>{index < chain.length - 1 ? <em>→</em> : null}</div>)}</div></section>

        <section className="content-grid"><div className="content-left"><Panel title="Portefeuille partenaires — Pipeline" footer="Voir tous les partenaires"><div className="pipeline"><Donut value={v('partners', 128)} /><div className="legend"><Legend color="#075cff" label="Actifs" value={`${v('partners', 128)} (52%)`} /><Legend color="#4d8dff" label="En croissance" value="32 (21%)" /><Legend color="#9cc1ff" label="À risque" value="24 (20%)" /><Legend color="#dbe7ff" label="Inactifs" value="56 (22%)" /></div></div></Panel><Panel title="Suivi commercial — Conversion" right="Ce mois-ci⌄" footer="Voir le tunnel commercial"><Bar label="Offres créées" value={v('proposals', 87)} width={82} delta="+2,1pts" /><Bar label="Taux de conversion" value={`${conversionRate}%`} width={74} delta="+2,1pts" /><Bar label="Commandes confirmées" value={v('orders', 64)} width={76} delta="+3" /><Bar label="Montant commandé" value={money(finance.revenue_mad || (visualFallback ? 189700 : 0))} width={62} delta="+15%" /></Panel><Panel title="Planning — Sessions à venir" right="2 prochaines semaines⌄" footer="Voir toutes les sessions"><Session title="Sécurité des dirigeants" date="19 juin 2025 • Casablanca" count="12" /><Session title="Leadership exécutif" date="05 juin 2025 • Rabat" count="8" /><Session title="Gestion de crise" date="10 juin 2025 • Online" count="15" /><Session title="Pilotage stratégique" date="18 juin 2025 • Tanger" count="7" /></Panel><Panel title="Puissance & Certifications" footer="Voir le détail des performances"><div className="spark-grid"><Spark label="Taux de présence" value={`${presenceRate}%`} /><Spark label="Taux de certification" value={`${certificationRate}%`} /></div></Panel><Panel title="Demandes partenaires" footer="Voir toutes les demandes"><Request title="Accès catalogue personnalisé" partner="Partenaire Alpha • 10 juin 2025" status="En cours" tone="red" /><Request title="Ajout formateur agréé" partner="Partenaire Beta • 9 juin 2025" status="Prioritaire" tone="orange" /><Request title="Report session entreprise" partner="Partenaire Gamma • 8 juin 2025" status="Basse" tone="green" /></Panel><Panel title="Activité récente" right="Filtrer" footer="Voir toute l’activité">{recent.slice(0, 4).map((item) => <Activity key={item.id || item.title} {...item} />)}</Panel></div><aside className="rail"><RailCard title="SLA & Risques"><Risk label="SLA respectés" value={`${alerts.sla_rate || (visualFallback ? 92.1 : 0)}%`} tone="green" /><Risk label="Risques élevés" value={alerts.high_risks || (visualFallback ? 3 : 0)} tone="red" /><Risk label="Partenaires à risque" value={alerts.partners_at_risk || (visualFallback ? 5 : 0)} tone="orange" /><button className="rail-btn">Voir le registre des risques ›</button></RailCard><RailCard title="État des modules" action="Tous les modules⌄">{['Partenaires', 'Commercial', 'Delivery', 'Finances', 'Qualité'].map((module) => <ModuleStatus key={module} label={module} />)}</RailCard><RailCard title="Alertes prioritaires" badge={alerts.high_risks || (visualFallback ? 3 : 0)}><Alert text="3 factures en retard de paiement" note="Échéance ≥ 7 jours" /><Alert text="2 sessions sans capacité" note="Action requise" /><Alert text="1 partenaire à risque élevé" note="Suivi commercial requis" /><button className="rail-btn">Voir toutes les alertes ›</button></RailCard><RailCard title="Actions recommandées"><Action text="Relancer 5 factures en retard" /><Action text="Contacter 2 partenaires inactifs" /><Action text="Valider 56 certificats en attente" /><button className="rail-btn">Voir toutes les actions ›</button></RailCard></aside></section>
      </section>
      {loading ? <div className="loading-pill">Synchronisation du cockpit…</div> : null}
      <style jsx global>{css}</style>
    </main>
  )
}

function OverviewMetric({ label, value, delta }: { label: string; value: React.ReactNode; delta: string }) { return <div className="overview-metric"><span>{label}</span><strong>{value}</strong><small>▲ {delta}</small></div> }
function Kpi({ icon, label, value, note, delta, tone }: { icon: string; label: string; value: React.ReactNode; note: string; delta: string; tone: KpiTone }) { return <article className="kpi"><div className={`kpi-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{delta ? `▲ ${delta} ${note}` : note}</small></div></article> }
function Panel({ title, right, footer, children }: { title: string; right?: string; footer?: string; children: React.ReactNode }) { return <article className="panel"><div className="panel-top"><strong>{title}</strong>{right ? <button>{right}</button> : null}</div><div className="panel-body">{children}</div>{footer ? <button className="panel-footer">{footer} ›</button> : null}</article> }
function Donut({ value }: { value: React.ReactNode }) { return <div className="donut"><div><strong>{value}</strong><span>Actifs</span></div></div> }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="legend-row"><i style={{ background: color }} /><span>{label}</span><strong>{value}</strong></div> }
function Bar({ label, value, width, delta }: { label: string; value: React.ReactNode; width: number; delta: string }) { return <div className="bar-row"><span>{label}</span><strong>{value}</strong><div><i style={{ width: `${width}%` }} /></div><small>▲ {delta}</small></div> }
function Session({ title, date, count }: { title: string; date: string; count: string }) { return <div className="session-row"><div><strong>{title}</strong><span>{date}</span></div><b>{count}<small>Inscrits</small></b></div> }
function Spark({ label, value }: { label: string; value: string }) { return <div className="spark"><span>{label}</span><strong>{value}</strong><small>▲ 5,3 pts vs mai</small><svg viewBox="0 0 190 68"><polyline points="3,52 28,31 53,43 78,25 103,32 128,29 153,16 186,5" fill="none" stroke="#075cff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg></div> }
function Request({ title, partner, status, tone }: { title: string; partner: string; status: string; tone: 'red' | 'orange' | 'green' }) { return <div className="request-row"><div><strong>{title}</strong><span>{partner}</span></div><em className={tone}>{status}</em></div> }
function Activity({ type, title, partner, date }: { type: string; title: string; partner: string; date: string }) { return <div className="activity-row"><i>{type.slice(0, 1)}</i><div><strong>{title}</strong><span>{partner}</span></div><time>{dateLabel(date)}</time></div> }
function RailCard({ title, action, badge, children }: { title: string; action?: string; badge?: React.ReactNode; children: React.ReactNode }) { return <article className="rail-card"><div className="rail-top"><strong>{title}</strong>{badge !== undefined ? <b>{badge}</b> : action ? <button>{action}</button> : null}</div>{children}</article> }
function Risk({ label, value, tone }: { label: string; value: React.ReactNode; tone: 'green' | 'red' | 'orange' }) { return <div className="risk-row"><span>{tone === 'green' ? '◎' : tone === 'red' ? '●' : '▲'} {label}</span><strong className={tone}>{value}</strong></div> }
function ModuleStatus({ label }: { label: string }) { return <div className="module-row"><span>{label}</span><strong>Opérationnel ●</strong></div> }
function Alert({ text, note }: { text: string; note: string }) { return <div className="alert-row"><i>⚠</i><div><strong>{text}</strong><span>{note}</span></div></div> }
function Action({ text }: { text: string }) { return <div className="action-row">✦ <span>{text}</span></div> }

const css = `
.thcc-page{min-height:100vh;display:grid;grid-template-columns:258px minmax(0,1fr);background:#f4f7fd;color:#071736;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.thcc-sidebar{position:sticky;top:0;height:100vh;overflow:auto;background:#fff;border-right:1px solid #dfe8f6;padding:18px;display:grid;align-content:start;gap:18px}.thcc-logo-zone{display:grid;gap:12px;padding-bottom:14px;border-bottom:1px solid #e7edf7}.thcc-logo-zone img{width:160px;height:50px;object-fit:contain;object-position:left center}.thcc-logo-zone div{display:grid;gap:2px;font-weight:900;color:#12203b}.thcc-logo-zone span{color:#6c7a92;font-size:12px}.thcc-nav{display:grid;gap:16px}.thcc-nav-group{display:grid;gap:7px}.thcc-nav-title{font-size:11px;letter-spacing:.14em;color:#2462ef;text-transform:uppercase;font-weight:950}.thcc-nav-link{display:flex;align-items:center;gap:11px;min-height:38px;padding:9px 12px;border-radius:10px;text-decoration:none;color:#233958;font-size:13px;font-weight:850}.thcc-nav-link span{width:18px;display:grid;place-items:center}.thcc-nav-link.active{color:#fff;background:linear-gradient(135deg,#075cff,#0751df);box-shadow:0 12px 26px rgba(7,92,255,.26)}.thcc-reduce{margin-top:18px;min-height:40px;border:1px solid #dde7f6;background:#fff;border-radius:12px;color:#71809a;font-weight:850}.thcc-main{min-width:0;padding:20px 28px 28px;display:grid;gap:18px}.thcc-header{height:60px;display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff;margin:-20px -28px 0;padding:14px 28px;border-bottom:1px solid #dfe8f6}.thcc-header h1{margin:0;font-size:24px;letter-spacing:-.035em}.thcc-header p{margin:4px 0 0;color:#657791;font-size:12px;font-weight:750}.thcc-actions{display:flex;gap:10px;align-items:center;justify-content:flex-end}.thcc-actions button,.overview button,.panel-top button,.rail-top button{height:42px;border:1px solid #d8e2f3;border-radius:9px;padding:0 14px;background:#fff;color:#173969;font-weight:850}.thcc-actions .primary{border:0;background:linear-gradient(135deg,#075cff,#064ad1);color:#fff;font-weight:950;box-shadow:0 12px 25px rgba(7,92,255,.22)}.search{height:42px;width:205px;display:flex;align-items:center;gap:8px;padding:0 12px;border:1px solid #d8e2f3;border-radius:9px;color:#71809a;background:#fff}.search input{width:100%;border:0;outline:0;font-weight:800;color:#132544}.profile{display:flex;align-items:center;gap:8px;font-size:12px;color:#172a4b;font-weight:850}.profile span{display:grid}.profile small{color:#657791}.thcc-warning{padding:12px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-weight:850}.thcc-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 490px 310px;gap:14px;align-items:stretch}.hero{position:relative;overflow:hidden;min-height:205px;border:1px solid #d6e2f4;border-radius:15px;background:linear-gradient(135deg,#eaf3ff 0%,#fff 58%,#eaf2ff 100%);box-shadow:0 12px 30px rgba(15,42,90,.055)}.hero>i,.hero>em{position:absolute;border-radius:50%;border:1px solid rgba(80,132,255,.24);font-style:normal}.hero>i{right:-140px;top:-220px;width:620px;height:620px}.hero>em{right:-40px;top:-260px;width:530px;height:530px}.hero>div{position:relative;padding:30px;max-width:780px}.hero span{color:#075cff;font-weight:950}.hero h2{margin:14px 0;font-size:36px;line-height:1.02;letter-spacing:-.055em}.hero p{margin:0;color:#657791;font-weight:800}.overview{align-self:center;min-height:150px;border:1px solid #d6e2f4;border-radius:14px;background:#fff;padding:20px;box-shadow:0 12px 30px rgba(15,42,90,.055)}.card-top{display:flex;justify-content:space-between;align-items:center;gap:12px;font-weight:950}.overview-grid{margin-top:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.overview-metric{display:grid;gap:7px;padding-left:15px;border-left:1px solid #dde6f4}.overview-metric span,.kpi span,.spark span{color:#5b6d86;font-size:12px;font-weight:850}.overview-metric strong{font-size:26px}.overview-metric small,.kpi small,.spark small{color:#16a34a;font-weight:900}.health{border:1px solid #d6e2f4;border-radius:15px;background:#fff;padding:18px;box-shadow:0 12px 30px rgba(15,42,90,.055)}.rail-title{display:flex;gap:9px;align-items:center;font-weight:950}.rail-title span{color:#075cff}.gauge{position:relative;width:168px;height:100px;margin:20px auto 0;overflow:hidden}.gauge-track,.gauge-fill{position:absolute;width:168px;height:168px;border-radius:50%;border:12px solid #e4ebf7;border-bottom-color:transparent;border-left-color:transparent;transform:rotate(-45deg)}.gauge-fill{border-color:#13a157;border-bottom-color:transparent;border-left-color:transparent;transform-origin:50% 50%}.gauge-center{position:absolute;inset:44px 0 0;display:grid;place-items:center;line-height:1.05}.gauge-center strong{font-size:28px}.kpi-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:12px}.kpi{min-height:104px;display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #d9e4f4;border-radius:13px;background:#fff;box-shadow:0 10px 24px rgba(15,42,90,.045)}.kpi-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:999px;font-size:20px}.kpi-icon.blue{background:#edf4ff;color:#075cff}.kpi-icon.green{background:#ecfdf5;color:#16a34a}.kpi-icon.purple{background:#f4f0ff;color:#7c3aed}.kpi strong{display:block;font-size:24px;letter-spacing:-.03em;margin:4px 0}.chain-card{border:1px solid #d9e4f4;border-radius:13px;background:#fff;padding:15px;box-shadow:0 10px 24px rgba(15,42,90,.045)}.section-head{display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:14px}.section-head p{margin:0}.section-head button{border:0;background:transparent;color:#075cff;font-weight:950}.chain-row{margin-top:12px;display:grid;grid-template-columns:repeat(17,minmax(0,auto));gap:8px;align-items:center}.chain-wrap{display:contents}.chain-item{min-height:72px;min-width:122px;display:grid;place-items:center;gap:3px;padding:8px;border:1px solid #bed2f4;border-radius:10px;background:#f9fbff;color:#075cff;text-align:center}.chain-wrap em{color:#2b4d7f;font-style:normal;font-weight:950}.content-grid{display:grid;grid-template-columns:minmax(0,1fr) 315px;gap:14px;align-items:start}.content-left{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.panel{min-height:234px;display:grid;gap:13px;border:1px solid #d9e4f4;border-radius:13px;background:#fff;padding:16px;box-shadow:0 10px 24px rgba(15,42,90,.045)}.panel-top{display:flex;justify-content:space-between;gap:10px;align-items:center;font-weight:950}.panel-body{display:grid;gap:10px}.panel-footer{align-self:end;border:1px solid #e4ebf7;background:#fbfcff;color:#075cff;border-radius:9px;padding:10px;font-weight:950}.pipeline{display:grid;grid-template-columns:175px 1fr;gap:20px;align-items:center}.donut{width:160px;height:160px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#075cff 0 52%,#4d8dff 52% 73%,#9cc1ff 73% 88%,#dbe7ff 88% 100%)}.donut>div{width:90px;height:90px;border-radius:50%;display:grid;place-items:center;background:#fff;box-shadow:inset 0 0 0 1px #dfe8f6}.donut strong{font-size:28px}.legend{display:grid;gap:10px}.legend-row{display:grid;grid-template-columns:14px 1fr auto;gap:9px;align-items:center;font-weight:850;color:#344867}.legend-row i{width:12px;height:12px;border-radius:3px}.bar-row{display:grid;grid-template-columns:1.35fr auto 130px 55px;gap:10px;align-items:center;font-weight:850;color:#2c4161}.bar-row>div{height:8px;background:#e6eefb;border-radius:99px;overflow:hidden}.bar-row>div i{display:block;height:100%;background:linear-gradient(90deg,#075cff,#4c8dff);border-radius:99px}.bar-row small{color:#16a34a;font-weight:900}.session-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #edf2fa}.session-row div,.request-row div,.activity-row div{display:grid;gap:3px}.session-row span,.request-row span,.activity-row span,.activity-row time,.alert-row span{color:#667895;font-size:12px}.session-row b{display:grid;text-align:right}.spark-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.spark{min-height:140px;display:grid;gap:7px;padding:14px;background:#fbfcff;border:1px solid #e0e9f6;border-radius:12px}.spark strong{font-size:24px}.spark svg{width:100%;height:62px}.request-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #edf2fa}.request-row em{font-style:normal;border-radius:999px;padding:7px 10px;font-weight:950}.request-row em.red{background:#fff1f2;color:#e11d48}.request-row em.orange{background:#fff7ed;color:#ea580c}.request-row em.green{background:#ecfdf5;color:#16a34a}.activity-row{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #edf2fa}.activity-row>i{width:30px;height:30px;border-radius:999px;display:grid;place-items:center;background:#075cff;color:#fff;font-style:normal;font-weight:950}.rail{display:grid;gap:14px}.rail-card{display:grid;gap:12px;border:1px solid #d9e4f4;border-radius:13px;background:#fff;padding:16px;box-shadow:0 10px 24px rgba(15,42,90,.045)}.rail-top{display:flex;justify-content:space-between;gap:10px;align-items:center;font-weight:950}.rail-top>b{width:26px;height:26px;display:grid;place-items:center;border-radius:999px;background:#ef4444;color:#fff}.risk-row,.module-row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #edf2fa;font-weight:850}.risk-row .green,.module-row strong{color:#16a34a}.risk-row .red{color:#e11d48}.risk-row .orange{color:#ea580c}.rail-btn{border:1px solid #e1e9f5;background:#fbfcff;color:#075cff;border-radius:9px;padding:10px;font-weight:950}.alert-row{display:grid;grid-template-columns:24px 1fr;gap:9px;padding:8px 0;color:#9f1239}.alert-row div{display:grid;gap:3px}.action-row{display:flex;gap:8px;color:#1d4ed8;font-weight:850;padding:8px 0}.loading-pill{position:fixed;right:24px;bottom:24px;border-radius:999px;padding:12px 16px;background:#075cff;color:#fff;font-weight:950;box-shadow:0 18px 38px rgba(7,92,255,.25)}@media(max-width:1500px){.thcc-page{grid-template-columns:235px minmax(0,1fr)}.thcc-hero-grid{grid-template-columns:minmax(0,1fr) 380px 260px}.kpi-grid{grid-template-columns:repeat(4,1fr)}.content-grid{grid-template-columns:1fr}.rail{grid-template-columns:repeat(4,1fr)}.content-left{grid-template-columns:repeat(2,1fr)}}@media(max-width:1050px){.thcc-page{grid-template-columns:1fr}.thcc-sidebar{position:relative;height:auto}.thcc-header,.thcc-hero-grid,.content-left,.rail{grid-template-columns:1fr}.thcc-actions{justify-content:flex-start;flex-wrap:wrap}.chain-row{display:flex;overflow:auto}.chain-wrap{display:flex;align-items:center;gap:8px}.kpi-grid{grid-template-columns:repeat(2,1fr)}}
`
