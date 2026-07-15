'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Angelcare360AdministrationOverview } from '@/types/angelcare360/administration'
import Angelcare360SetupChecklistDrawer from './Angelcare360SetupChecklistDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360AuditEventDrawer from './Angelcare360AuditEventDrawer'

type Angelcare360AdministrationHubProps = {
  overview: Angelcare360AdministrationOverview
}

export default function Angelcare360AdministrationHub({ overview }: Angelcare360AdministrationHubProps) {
  const router = useRouter()
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)
  const selectedAudit = overview.latestAuditEvents.find((event) => event.id === selectedAuditId) || null

  return (
    <div style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Administration</div>
          <h2 style={titleStyle}>Vue d’ensemble du paramétrage</h2>
          <p style={subtitleStyle}>
            La configuration administrative pilote les établissements, l’année scolaire, les classes, les sections, les matières et le socle RBAC.
          </p>
        </div>
        <div style={actionRowStyle}>
          <button type="button" onClick={() => router.refresh()} style={primaryButtonStyle}>
            Rafraîchir
          </button>
          <button type="button" onClick={() => setChecklistOpen(true)} style={secondaryButtonStyle}>
            Ouvrir la checklist
          </button>
        </div>
      </section>

      <section style={kpiGridStyle}>
        {[
          ['Établissements', overview.schoolCount],
          ['Années scolaires', overview.academicYearCount],
          ['Classes', overview.classCount],
          ['Sections', overview.sectionCount],
          ['Matières', overview.subjectCount],
          ['Rôles actifs', overview.activeRoleCount],
        ].map(([label, value]) => (
          <article key={String(label)} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{label}</div>
            <div style={kpiValueStyle}>{String(value)}</div>
          </article>
        ))}
      </section>

      <section style={statusPanelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Paramétrage</div>
            <h3 style={panelTitleStyle}>Score de préparation</h3>
          </div>
          <div style={scoreBadgeStyle}>{overview.setupScore}/8</div>
        </div>
        <p style={panelTextStyle}>
          {overview.permissionCatalogReady
            ? 'Le catalogue de permissions est chargé et le command center peut appliquer les contrôles d’accès.'
            : 'Le catalogue de permissions n’est pas encore chargé complètement.'}
        </p>
        <div style={progressBarStyle}>
          <div style={{ ...progressFillStyle, width: `${Math.max(10, overview.setupScore * 12.5)}%` }} />
        </div>
      </section>

      <section style={splitGridStyle}>
        <article style={cardStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelEyebrowStyle}>Séquence de configuration</div>
              <h3 style={panelTitleStyle}>Risques et manques</h3>
            </div>
          </div>
          {overview.risks.length > 0 ? (
            <ul style={riskListStyle}>
              {overview.risks.map((risk) => (
                <li key={risk} style={riskItemStyle}>{risk}</li>
              ))}
            </ul>
          ) : (
            <Angelcare360EmptyState
              title="Aucun risque bloquant détecté"
              description="Le socle administratif est complet pour le périmètre actif."
            />
          )}
        </article>

        <article style={cardStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelEyebrowStyle}>Accès rapides</div>
              <h3 style={panelTitleStyle}>Ouvrir les modules</h3>
            </div>
          </div>
          <div style={quickLinksStyle}>
            {[
              ['Établissements', '/angelcare-360-command-center/administration/etablissements'],
              ['Années scolaires', '/angelcare-360-command-center/administration/annees-scolaires'],
              ['Périodes', '/angelcare-360-command-center/administration/periodes'],
              ['Classes', '/angelcare-360-command-center/administration/classes'],
              ['Sections', '/angelcare-360-command-center/administration/sections'],
              ['Matières', '/angelcare-360-command-center/administration/matieres'],
              ['Affectations enseignants', '/angelcare-360-command-center/administration/affectations'],
              ['Rôles & permissions', '/angelcare-360-command-center/administration/roles-permissions'],
              ['Paramètres', '/angelcare-360-command-center/administration/parametres'],
              ['Audit', '/angelcare-360-command-center/administration/audit'],
            ].map(([label, href]) => (
              <Link key={String(href)} href={String(href)} style={quickLinkStyle}>
                {String(label)}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section style={cardStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Derniers événements</div>
            <h3 style={panelTitleStyle}>Audit d’administration</h3>
          </div>
          <Link href="/angelcare-360-command-center/administration/audit" style={inlineLinkStyle}>
            Voir tout
          </Link>
        </div>
        {overview.latestAuditEvents.length > 0 ? (
          <div style={auditListStyle}>
            {overview.latestAuditEvents.map((event) => (
              <button key={event.id} type="button" onClick={() => setSelectedAuditId(event.id)} style={auditItemStyle}>
                <div style={auditMetaStyle}>
                  <div style={auditTitleStyle}>{event.module} · {event.action}</div>
                  <div style={auditSubtitleStyle}>{event.actor_role || '—'} · {event.entity_type || '—'}</div>
                </div>
                <span style={severityStyle}>{event.severity}</span>
              </button>
            ))}
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucun événement récent" description="Les opérations administratives apparaîtront ici après les premiers enregistrements." />
        )}
      </section>

      <Angelcare360SetupChecklistDrawer open={checklistOpen} overview={overview} onClose={() => setChecklistOpen(false)} />
      <Angelcare360AuditEventDrawer open={Boolean(selectedAudit)} event={selectedAudit} onClose={() => setSelectedAuditId(null)} />
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  padding: 20,
  borderRadius: 26,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
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
  fontSize: 28,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
  maxWidth: 900,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
}

const kpiCardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const kpiValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 30,
  fontWeight: 950,
}

const statusPanelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 12,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 900,
}

const scoreBadgeStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '8px 12px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontWeight: 900,
}

const panelTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const progressBarStyle: React.CSSProperties = {
  height: 12,
  borderRadius: 999,
  background: '#e2e8f0',
  overflow: 'hidden',
}

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, #60a5fa, #2563eb)',
}

const splitGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const riskListStyle: React.CSSProperties = {
  margin: '12px 0 0',
  paddingInlineStart: 18,
  display: 'grid',
  gap: 8,
}

const riskItemStyle: React.CSSProperties = {
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}

const quickLinksStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const quickLinkStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '10px 12px',
  fontWeight: 800,
}

const inlineLinkStyle: React.CSSProperties = {
  color: '#1d4ed8',
  textDecoration: 'none',
  fontWeight: 800,
}

const auditListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const auditItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  textAlign: 'left',
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: '12px 14px',
  cursor: 'pointer',
}

const auditMetaStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const auditTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const auditSubtitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const severityStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}
