'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import type { Angelcare360ToolbarScope } from '@/types/angelcare360/ui'
import { ANGELCARE360_DIRECTION_ROUTE, ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'
import { buildAngelcare360AuditEvent, recordAngelcare360AuditEvent } from '@/lib/angelcare360/audit'
import { getAngelcare360NavigationSections } from '@/data/angelcare360/navigation'
import { ANGELCARE360_MODULE_REGISTRY, getAngelcare360ModuleById } from '@/data/angelcare360/module-registry'
import { useAngelcare360Module } from '@/hooks/angelcare360/useAngelcare360Module'
import { useAngelcare360Session } from '@/hooks/angelcare360/useAngelcare360Session'
import { groupAngelcare360Modules, getAngelcare360VisibleModules } from '@/lib/angelcare360/module-access'
import Angelcare360EmptyState from './states/Angelcare360EmptyState'
import Angelcare360ModuleDrawer from './Angelcare360ModuleDrawer'
import Angelcare360SuccessState from './states/Angelcare360SuccessState'
import Angelcare360Toolbar from './layout/Angelcare360Toolbar'

type Angelcare360CommandCenterViewProps = {
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
  variant?: 'overview' | 'direction'
}

export default function Angelcare360CommandCenterView({
  user,
  access,
  variant = 'overview',
}: Angelcare360CommandCenterViewProps) {
  const session = useAngelcare360Session(user, access)
  const drawer = useAngelcare360Module('cockpit-direction')
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Angelcare360ToolbarScope>('all')

  const modules = getAngelcare360VisibleModules(ANGELCARE360_MODULE_REGISTRY, access)
  const sections = getAngelcare360NavigationSections()
  const groupedSections = groupAngelcare360Modules(modules)

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return groupedSections
      .map((section) => ({
        ...section,
        items: section.items.filter((module) => {
          const matchesScope = scope === 'all' || scope === getScopeKey(module.group)
          const haystack = [
            module.label,
            module.description,
            module.operationalPurpose,
            module.badge,
            ...(module.keywords || []),
          ]
            .join(' ')
            .toLowerCase()
          const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
          return matchesScope && matchesQuery
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [groupedSections, query, scope])

  const stats = useMemo(() => {
    const mappedModules = modules.length
    const activeModules = modules.filter((module) => module.stage === 'actif').length
    const plannedModules = modules.filter((module) => module.stage === 'prévu').length
    const sectionGroups = sections.length
    return { mappedModules, activeModules, plannedModules, sectionGroups }
  }, [modules, sections.length])

  const cockpitModule = getAngelcare360ModuleById('cockpit-direction')

  const alerts = [
    'Les modules Administration, Admissions et People Core sont désormais branchés au socle de données; les autres modules restent verrouillés.',
    'Les mutations actives sont server-side, validées et auditées; les modules non livrés restent volontairement fermés.',
    `La session active est contrôlée par le rôle ${session.roleLabel} et la route protégée.`,
  ]

  const onOpenAuditDrawer = () => {
    drawer.openModule('audit-securite')
    void recordAngelcare360AuditEvent({
      action: 'open_module',
      module: getAngelcare360ModuleById('audit-securite'),
      route: variant === 'direction' ? ANGELCARE360_DIRECTION_ROUTE : '/angelcare-360-command-center',
      userId: user.id,
      details: { query, scope, variant },
    })
  }

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={eyebrowStyle}>Produit indépendant</div>
        <div style={titleRowStyle}>
          <div>
            <h1 style={titleStyle}>{ANGELCARE360_PRODUCT_NAME}</h1>
            <p style={subtitleStyle}>
              {variant === 'direction'
                ? 'Cockpit de Direction, suivi des risques, et aperçu des modules à déployer en priorité.'
                : 'Vue d’ensemble opérationnelle, cartographie des modules et accès contrôlés pour la phase 1.'}
            </p>
          </div>
          <div style={titleActionsStyle}>
            <Link href={ANGELCARE360_DIRECTION_ROUTE} style={primaryLinkStyle}>
              Ouvrir le cockpit détaillé
            </Link>
            <Link href="#modules" style={secondaryLinkStyle}>
              Aller aux modules
            </Link>
          </div>
        </div>
      </section>

      <Angelcare360SuccessState
        title="Shell opérationnel et isolé"
        description="La navigation, le cockpit et les états contrôlés sont prêts sans toucher aux autres produits."
      />

      <section style={kpiGridStyle}>
        {[
          { label: 'Modules cartographiés', value: stats.mappedModules, note: 'Tous les futurs modules visibles dans la registry.' },
          { label: 'Surfaces actives', value: stats.activeModules, note: 'Seul le cockpit de direction est actif en phase 1.' },
          { label: 'Surfaces planifiées', value: stats.plannedModules, note: 'Les autres modules sont préparés mais verrouillés.' },
          { label: 'Familles fonctionnelles', value: stats.sectionGroups, note: 'Pilotage, Scolarité, Gestion, Services, Gouvernance.' },
        ].map((item) => (
          <article key={item.label} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{item.label}</div>
            <div style={kpiValueStyle}>{item.value}</div>
            <div style={kpiNoteStyle}>{item.note}</div>
          </article>
        ))}
      </section>

      <section style={snapshotGridStyle}>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Admissions</div>
          <h2 style={snapshotTitleStyle}>Admissions & inscriptions actives</h2>
          <p style={snapshotTextStyle}>
            Pipeline, suivi documentaire, suivi des décisions et conversion vers les dossiers personnes sont opérationnels dans un espace isolé.
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Présences</div>
          <h2 style={snapshotTitleStyle}>Suivi journalier à venir</h2>
          <p style={snapshotTextStyle}>
            Le contrôle des présences, retards et justifications sera branché sur une base dédiée lors de la phase suivante.
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Finance</div>
          <h2 style={snapshotTitleStyle}>Chaîne finance active</h2>
          <p style={snapshotTextStyle}>
            Frais scolaires, factures, paiements, reçus, remises et soldes sont désormais branchés sur le socle financier réel.
          </p>
        </article>
        <article style={snapshotCardStyle}>
          <div style={snapshotLabelStyle}>Académique</div>
          <h2 style={snapshotTitleStyle}>Chaîne académique active</h2>
          <p style={snapshotTextStyle}>
            Devoirs, examens, notes, bulletins et appréciations sont désormais branchés sur des entités réelles et auditées.
          </p>
        </article>
      </section>

      <section style={alertPanelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Alertes / risques</div>
            <h2 style={panelTitleStyle}>Points de vigilance pour le déploiement</h2>
          </div>
          <button type="button" onClick={onOpenAuditDrawer} style={panelButtonStyle}>
            Ouvrir l’audit
          </button>
        </div>
        <ul style={alertListStyle}>
          {alerts.map((alert) => (
            <li key={alert} style={alertItemStyle}>
              {alert}
            </li>
          ))}
        </ul>
      </section>

      <Angelcare360Toolbar
        query={query}
        scope={scope}
        onQueryChange={setQuery}
        onScopeChange={setScope}
        onReset={() => {
          setQuery('')
          setScope('all')
          drawer.closeModule()
          void recordAngelcare360AuditEvent({
            action: 'filter_modules',
            module: cockpitModule,
            route: variant === 'direction' ? ANGELCARE360_DIRECTION_ROUTE : '/angelcare-360-command-center',
            userId: user.id,
            details: { reset: true },
          })
        }}
        onOpenDrawer={() => drawer.openModule('cockpit-direction')}
      />

      <section id="modules" style={modulesShellStyle}>
        <div style={modulesHeaderStyle}>
          <div>
            <div style={modulesEyebrowStyle}>Accès rapides</div>
            <h2 style={modulesTitleStyle}>Modules cartographiés pour la phase 1</h2>
          </div>
          <div style={modulesHintStyle}>
            Les boutons de création restent désactivés tant que la base métier n’est pas mise en place.
          </div>
        </div>

        {filteredSections.length === 0 ? (
          <Angelcare360EmptyState
            title="Aucun module trouvé"
            description="Aucun module ne correspond à la recherche ou au filtre sélectionné."
            actionLabel="Réinitialiser les filtres"
            actionHref={ANGELCARE360_DIRECTION_ROUTE}
          />
        ) : (
          filteredSections.map((section) => (
            <section key={section.group} id={section.group.toLowerCase()} style={sectionBlockStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <div style={sectionGroupStyle}>{section.label}</div>
                  <div style={sectionSummaryStyle}>{section.summary}</div>
                </div>
                <div style={sectionCountStyle}>{section.items.length} module(s)</div>
              </div>

              <div style={cardGridStyle}>
                {section.items.map((module) => (
                  <article key={module.id} id={module.id} style={moduleCardStyle}>
                    <div style={moduleHeaderStyle}>
                      <div>
                        <div style={moduleBadgeStyle}>{module.badge}</div>
                        <h3 style={moduleTitleStyle}>{module.label}</h3>
                      </div>
                      <div style={stageChipStyle}>{module.stage === 'actif' ? 'Actif' : 'Prévu'}</div>
                    </div>

                    <p style={moduleDescriptionStyle}>{module.description}</p>
                    <p style={modulePurposeStyle}>{module.operationalPurpose}</p>
                    <p style={moduleAccessStyle}>{module.accessNote}</p>

                    <div style={moduleActionRowStyle}>
                      <button
                        type="button"
                        onClick={() => {
                          drawer.openRecord(module)
                          void recordAngelcare360AuditEvent({
                            action: 'open_module',
                            module,
                            route: variant === 'direction' ? ANGELCARE360_DIRECTION_ROUTE : '/angelcare-360-command-center',
                            userId: user.id,
                            details: { query, scope, variant },
                          })
                        }}
                        style={modulePrimaryButtonStyle}
                      >
                        {module.previewActionLabel}
                      </button>
                      <Link href={module.href} style={moduleSecondaryButtonStyle}>
                        Aller à la carte
                      </Link>
                    </div>

                    {module.stage === 'actif' ? (
                      <div style={moduleActiveStateStyle}>{module.disabledActionReason}</div>
                    ) : (
                      <button
                        type="button"
                        disabled
                        style={moduleDisabledButtonStyle}
                        title={module.disabledActionReason}
                      >
                        {module.disabledActionLabel}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </section>

      <section style={footerNoteStyle}>
        <div style={footerNoteTitleStyle}>Couche de garde prête</div>
        <p style={footerNoteTextStyle}>
          La session, le rôle et la navigation sont contrôlés côté route. Les modules actifs restent branchés sur des routes réelles, et les modules futurs demeurent verrouillés sans polluer ce shell.
        </p>
      </section>

      <Angelcare360ModuleDrawer
        module={drawer.state.isOpen ? getAngelcare360ModuleById(drawer.state.moduleId) : null}
        onClose={drawer.closeModule}
      />
    </div>
  )
}

function getScopeKey(group: string): Angelcare360ToolbarScope {
  if (group === 'Pilotage') return 'pilotage'
  if (group === 'Scolarité') return 'scolarite'
  if (group === 'Gestion') return 'gestion'
  if (group === 'Services') return 'services'
  return 'gouvernance'
}

const pageStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const heroStyle: React.CSSProperties = {
  borderRadius: 30,
  background:
    'linear-gradient(135deg, rgba(255,255,255,.96) 0%, rgba(239,246,255,.94) 42%, rgba(248,250,252,.98) 100%)',
  border: '1px solid #dbe4ef',
  boxShadow: '0 26px 88px rgba(15,23,42,.08)',
  padding: 24,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  fontSize: 12,
  fontWeight: 900,
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  alignItems: 'end',
  flexWrap: 'wrap',
}

const titleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#0f172a',
  fontSize: 34,
  lineHeight: 1.08,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 650,
  maxWidth: 900,
}

const titleActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  border: '1px solid #0f172a',
  fontWeight: 850,
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '10px 14px',
  border: '1px solid #cbd5e1',
  fontWeight: 850,
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
}

const kpiCardStyle: React.CSSProperties = {
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #dbe4ef',
  boxShadow: '0 16px 42px rgba(15,23,42,.05)',
  padding: 18,
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
  fontSize: 12,
}

const kpiValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 30,
  fontWeight: 950,
}

const kpiNoteStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}

const snapshotGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14,
}

const snapshotCardStyle: React.CSSProperties = {
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #dbe4ef',
  padding: 18,
  boxShadow: '0 16px 42px rgba(15,23,42,.05)',
}

const snapshotLabelStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const snapshotTitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 900,
}

const snapshotTextStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}

const alertPanelStyle: React.CSSProperties = {
  borderRadius: 28,
  background: '#fff',
  border: '1px solid #dbe4ef',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  padding: 20,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  flexWrap: 'wrap',
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#b45309',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 950,
}

const panelButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
}

const alertListStyle: React.CSSProperties = {
  margin: '16px 0 0',
  paddingLeft: 18,
  display: 'grid',
  gap: 10,
}

const alertItemStyle: React.CSSProperties = {
  color: '#334155',
  lineHeight: 1.6,
  fontWeight: 600,
}

const modulesShellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const modulesHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'end',
}

const modulesEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const modulesTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const modulesHintStyle: React.CSSProperties = {
  color: '#64748b',
  lineHeight: 1.6,
  fontWeight: 600,
  maxWidth: 420,
}

const sectionBlockStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: 12,
  flexWrap: 'wrap',
}

const sectionGroupStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const sectionSummaryStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#64748b',
  fontWeight: 600,
  lineHeight: 1.6,
}

const sectionCountStyle: React.CSSProperties = {
  borderRadius: 999,
  background: '#eff6ff',
  color: '#1d4ed8',
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 900,
}

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
}

const moduleCardStyle: React.CSSProperties = {
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #dbe4ef',
  boxShadow: '0 16px 42px rgba(15,23,42,.05)',
  padding: 18,
  display: 'grid',
  gap: 12,
}

const moduleHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const moduleBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  background: '#eff6ff',
  color: '#1d4ed8',
  padding: '5px 9px',
  fontSize: 11,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.9,
}

const moduleTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const stageChipStyle: React.CSSProperties = {
  flexShrink: 0,
  borderRadius: 999,
  background: '#f8fafc',
  color: '#334155',
  padding: '6px 9px',
  fontSize: 11,
  fontWeight: 900,
  border: '1px solid #e2e8f0',
}

const moduleDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  lineHeight: 1.6,
  fontWeight: 650,
}

const modulePurposeStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}

const moduleAccessStyle: React.CSSProperties = {
  margin: 0,
  color: '#1d4ed8',
  lineHeight: 1.6,
  fontWeight: 700,
}

const moduleActionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const modulePrimaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
}

const moduleSecondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
}

const moduleDisabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#64748b',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const moduleActiveStateStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #bbf7d0',
  background: '#f0fdf4',
  color: '#166534',
  padding: '10px 14px',
  fontWeight: 800,
}

const footerNoteStyle: React.CSSProperties = {
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #dbe4ef',
  padding: 18,
  boxShadow: '0 16px 42px rgba(15,23,42,.04)',
}

const footerNoteTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const footerNoteTextStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}
