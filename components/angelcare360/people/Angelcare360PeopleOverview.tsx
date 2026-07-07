import Link from 'next/link'
import type { Angelcare360PeopleOverviewRecord } from '@/types/angelcare360/people'

type Angelcare360PeopleOverviewProps = {
  overview: Angelcare360PeopleOverviewRecord
}

export default function Angelcare360PeopleOverview({ overview }: Angelcare360PeopleOverviewProps) {
  const cards = [
    { label: 'Élèves actifs', value: overview.activeStudents, note: 'Dossiers élèves visibles.' },
    { label: 'Parents actifs', value: overview.activeParents, note: 'Fiches familles liées.' },
    { label: 'Enseignants actifs', value: overview.activeTeachers, note: 'Personnel pédagogique.' },
    { label: 'Personnel actif', value: overview.activeStaff, note: 'Effectif total opérationnel.' },
    { label: 'Dossiers incomplets', value: overview.incompleteDossiers, note: 'Infos manquantes à corriger.' },
    { label: 'Contacts urgents manquants', value: overview.missingEmergencyContacts, note: 'Familles / équipes à compléter.' },
    { label: 'Documents manquants', value: overview.missingDocuments, note: 'Références à compléter.' },
    { label: 'Couverture des classes', value: `${overview.classAssignmentCoverage}%`, note: 'Élèves rattachés à une classe.' },
  ]

  return (
    <section style={shellStyle}>
      <div style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Cockpit humain</div>
          <h1 style={titleStyle}>Vue d’ensemble des personnes</h1>
          <p style={subtitleStyle}>
            Le socle des dossiers humains pour l’établissement actif, avec un contrôle sur la complétude, les liens et les risques opérationnels.
          </p>
        </div>
        <div style={actionsStyle}>
          <Link href="/angelcare-360-command-center/eleves" style={primaryLinkStyle}>
            Aller aux élèves
          </Link>
          <Link href="/angelcare-360-command-center/personnes/documents" style={secondaryLinkStyle}>
            Voir les documents
          </Link>
        </div>
      </div>

      <div style={gridStyle}>
        {cards.map((card) => (
          <article key={card.label} style={cardStyle}>
            <div style={cardLabelStyle}>{card.label}</div>
            <div style={cardValueStyle}>{card.value}</div>
            <div style={cardNoteStyle}>{card.note}</div>
          </article>
        ))}
      </div>

      <article style={quickAccessCardStyle}>
        <div style={panelTitleStyle}>Accès rapides</div>
        <div style={quickGridStyle}>
          {[
            { href: '/angelcare-360-command-center/eleves', label: 'Élèves', note: 'Dossiers, familles et affectations.' },
            { href: '/angelcare-360-command-center/parents', label: 'Parents', note: 'Fiches familles et contacts.' },
            { href: '/angelcare-360-command-center/enseignants', label: 'Enseignants', note: 'Dossiers pédagogiques.' },
            { href: '/angelcare-360-command-center/personnel', label: 'Personnel', note: 'RH opérationnel.' },
            { href: '/angelcare-360-command-center/personnes/liens-parent-enfant', label: 'Liens', note: 'Relations parent/enfant.' },
            { href: '/angelcare-360-command-center/personnes/contacts-urgence', label: 'Urgence', note: 'Contacts prioritaires.' },
            { href: '/angelcare-360-command-center/personnes/documents', label: 'Documents', note: 'Pièces administratives.' },
            { href: '/angelcare-360-command-center/personnes/affectations-classes', label: 'Affectations', note: 'Inscriptions classe/section.' },
            { href: '/angelcare-360-command-center/personnes/audit', label: 'Audit', note: 'Traçabilité des mutations.' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={quickLinkStyle}>
              <span style={quickLinkLabelStyle}>{item.label}</span>
              <span style={quickLinkNoteStyle}>{item.note}</span>
            </Link>
          ))}
        </div>
      </article>

      <article style={riskCardStyle}>
        <div style={panelTitleStyle}>Audit récent et risques</div>
        <div style={riskGridStyle}>
          <div style={riskBlockStyle}>
            <div style={panelSubtitleStyle}>Derniers événements</div>
            <div style={auditListStyle}>
              {overview.latestAuditEvents.length > 0 ? overview.latestAuditEvents.map((event) => (
                <div key={event.id} style={auditItemStyle}>
                  <div style={auditItemTitleStyle}>{event.module} · {event.action}</div>
                  <div style={auditItemMetaStyle}>{event.severity} · {new Date(event.created_at).toLocaleString('fr-FR')}</div>
                </div>
              )) : (
                <div style={mutedTextStyle}>Aucun événement d’audit personne n’est disponible.</div>
              )}
            </div>
          </div>
          <div style={riskBlockStyle}>
            <div style={panelSubtitleStyle}>Points de vigilance</div>
            <div style={riskListStyle}>
              {overview.incompleteDossiers === 0 ? (
                <div style={positivePillStyle}>Aucun dossier incomplet détecté.</div>
              ) : (
                <div style={warningPillStyle}>{overview.incompleteDossiers} dossier(s) nécessitent une complétion.</div>
              )}
              {overview.missingEmergencyContacts === 0 ? (
                <div style={positivePillStyle}>Les contacts d’urgence sont couverts.</div>
              ) : (
                <div style={warningPillStyle}>{overview.missingEmergencyContacts} personne(s) sans contact d’urgence.</div>
              )}
              {overview.missingDocuments === 0 ? (
                <div style={positivePillStyle}>Les références documentaires sont complètes.</div>
              ) : (
                <div style={warningPillStyle}>{overview.missingDocuments} dossier(s) sans document référencé.</div>
              )}
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  flexWrap: 'wrap',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 26,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
  maxWidth: 860,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const primaryLinkStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
}

const secondaryLinkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const cardLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const cardValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 24,
  lineHeight: 1.1,
  fontWeight: 950,
}

const cardNoteStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}

const riskCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const quickAccessCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const panelTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const quickGridStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const quickLinkStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  padding: 14,
  textDecoration: 'none',
}

const quickLinkLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
}

const quickLinkNoteStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.55,
  fontWeight: 600,
}

const panelSubtitleStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const riskGridStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
}

const riskBlockStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: 14,
  display: 'grid',
  gap: 10,
}

const auditListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const auditItemStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#fff',
  padding: 12,
}

const auditItemTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
  fontSize: 13,
}

const auditItemMetaStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
}

const mutedTextStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 600,
}

const riskListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const positivePillStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #bbf7d0',
  background: '#f0fdf4',
  color: '#166534',
  padding: 12,
  fontWeight: 700,
}

const warningPillStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #fde68a',
  background: '#fffbeb',
  color: '#92400e',
  padding: 12,
  fontWeight: 700,
}
