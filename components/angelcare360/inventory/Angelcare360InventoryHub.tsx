import Link from 'next/link'
import type { Angelcare360InventoryOverviewRecord } from '@/types/angelcare360/inventory'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360InventoryRiskPanel from './Angelcare360InventoryRiskPanel'

type Props = {
  overview: Angelcare360InventoryOverviewRecord
}

export default function Angelcare360InventoryHub({ overview }: Props) {
  const metrics = [
    ['Catégories', overview.categoryCount],
    ['Articles', overview.itemCount],
    ['Mouvements', overview.movementCount],
    ['Stock bas', overview.lowStockCount],
    ['Ruptures', overview.outOfStockCount],
    ['Endommagés', overview.damagedItemCount],
    ['Perdus', overview.lostItemCount],
    ['Sans responsable', overview.unassignedItemCount],
  ]

  return (
    <section style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Bibliothèque & Inventaire</div>
          <h2 style={titleStyle}>Cockpit inventaire contrôlé</h2>
          <p style={subtitleStyle}>
            Les catégories, articles, quantités et mouvements de stock sont pilotés côté serveur. Les exports et la lecture code-barres restent verrouillés sans infrastructure réelle.
          </p>
        </div>
        <div style={actionRowStyle}>
          <Link href="/angelcare-360-command-center/inventaire/articles" style={primaryLinkStyle}>Articles</Link>
          <Link href="/angelcare-360-command-center/inventaire/mouvements" style={secondaryLinkStyle}>Mouvements</Link>
          <Link href="/angelcare-360-command-center/inventaire/stock-bas" style={secondaryLinkStyle}>Stock bas</Link>
        </div>
      </section>

      <section style={quickActionGridStyle}>
        <span style={lockedActionStyle}>Export PDF verrouillé</span>
        <span style={lockedActionStyle}>Lecture code-barres verrouillée</span>
        <span style={lockedActionStyle}>Achat fournisseur hors périmètre</span>
      </section>

      <section style={kpiGridStyle}>
        {metrics.map(([label, value]) => (
          <article key={String(label)} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{label}</div>
            <div style={kpiValueStyle}>{String(value)}</div>
          </article>
        ))}
      </section>

      <section style={snapshotGridStyle}>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Établissement</div>
          <h3 style={snapshotTitleStyle}>{overview.schoolName}</h3>
          <p style={snapshotTextStyle}>Année active: {overview.activeAcademicYearLabel || 'Non résolue'}</p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Stock</div>
          <h3 style={snapshotTitleStyle}>{overview.lowStockCount} article(s) sous seuil</h3>
          <p style={snapshotTextStyle}>Les niveaux de stock sont calculés à partir des quantités réelles.</p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Audit</div>
          <h3 style={snapshotTitleStyle}>Événements récents</h3>
          {overview.latestAuditEvents.length > 0 ? (
            <ul style={auditListStyle}>
              {overview.latestAuditEvents.slice(0, 4).map((event) => <li key={event.id} style={auditItemStyle}>{event.module} · {event.action}</li>)}
            </ul>
          ) : (
            <Angelcare360EmptyState title="Aucun événement récent" description="Les mutations inventaire apparaîtront ici après les premières opérations." />
          )}
        </article>
      </section>

      <Angelcare360InventoryRiskPanel risks={overview.risks} />
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const heroStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'start', padding: 20, borderRadius: 26, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const eyebrowStyle: React.CSSProperties = { color: '#0284c7', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 12, fontWeight: 900 }
const titleStyle: React.CSSProperties = { margin: '8px 0 0', color: '#0f172a', fontSize: 28, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600, maxWidth: 900 }
const actionRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const quickActionGridStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
const primaryLinkStyle: React.CSSProperties = { border: '1px solid #0f172a', borderRadius: 14, padding: '11px 14px', background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 800 }
const secondaryLinkStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 14, padding: '11px 14px', background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 800 }
const lockedActionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: '1px solid #dbe4ef', background: '#f8fafc', color: '#64748b', padding: '12px 14px', fontWeight: 850 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }
const kpiCardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 16px 40px rgba(15,23,42,.04)' }
const kpiLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const kpiValueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 26, fontWeight: 950 }
const snapshotGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }
const snapshotCardStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const snapshotLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const snapshotTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 900 }
const snapshotTextStyle: React.CSSProperties = { margin: 0, color: '#475569', lineHeight: 1.6, fontWeight: 600 }
const auditListStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }
const auditItemStyle: React.CSSProperties = { color: '#334155', lineHeight: 1.5, fontWeight: 600 }
