'use client'

import TrainingHubPartnerBusinessPortalBoard from './TrainingHubPartnerBusinessPortalBoard'
import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { TrainingHubContext } from '@/lib/traininghub/types'

type Props = {
  context: TrainingHubContext
  sessions: any[]
  proposals: any[]
  entitlements: any[]
  certificates: any[]
  participants: any[]
  assignments: any[]
  resources: any[]
  sites: any[]
  queryWarnings: string[]
  adminPreview?: boolean
}

type Tone = { bg: string; fg: string; border: string }

const statusTone: Record<string, Tone> = {
  requested: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  qualified: { bg: '#eef2ff', fg: '#4338ca', border: '#c7d2fe' },
  quoted: { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
  confirmed: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  scheduled: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  kit_preparation: { bg: '#fefce8', fg: '#a16207', border: '#fde68a' },
  delivered: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  attendance_validated: { bg: '#ecfeff', fg: '#0e7490', border: '#a5f3fc' },
  certificates_issued: { bg: '#f5f3ff', fg: '#6d28d9', border: '#ddd6fe' },
  refresh_unlocked: { bg: '#fdf2f8', fg: '#be185d', border: '#fbcfe8' },
  aftersales_completed: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  closed: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
  draft: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
  sent: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  accepted: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  active: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  unlocked: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  assigned: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  completed: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  trial: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
}

const navItems = [
  { href: '#overview', label: 'Vue globale', icon: '◈' },
  { href: '#trainings', label: 'Formations', icon: '▣' },
  { href: '#academy', label: 'E-learning', icon: '▶' },
  { href: '#team', label: 'Équipe', icon: '◉' },
  { href: '#proof', label: 'Preuves & kits', icon: '◆' },
]

function money(amountMinor?: number | null, currency = 'MAD') {
  const value = Number(amountMinor || 0) / 100
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

function dateLabel(value?: string | null) {
  if (!value) return 'À planifier'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

function simpleDate(value?: string | null) {
  if (!value) return 'Non défini'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function statusLabel(value?: string | null) {
  return String(value || 'pending').replace(/_/g, ' ')
}

function Badge({ children, status, tone }: { children: ReactNode; status?: string | null; tone?: Tone }) {
  const palette = tone || statusTone[String(status || '').toLowerCase()] || { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' }
  return <span style={{ ...badgeStyle, background: palette.bg, color: palette.fg, borderColor: palette.border }}>{children}</span>
}

function SectionTitle({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div style={sectionHeaderStyle}>
      <div>
        <div style={sectionEyebrowStyle}>{eyebrow}</div>
        <h2 style={sectionTitleStyle}>{title}</h2>
        <p style={sectionTextStyle}>{text}</p>
      </div>
      {action}
    </div>
  )
}

function KpiCard({ icon, label, value, detail, accent }: { icon: string; label: string; value: ReactNode; detail: string; accent: string }) {
  return (
    <article style={kpiCardStyle}>
      <div style={{ ...kpiAccentStyle, background: accent }} />
      <div style={kpiIconRowStyle}>
        <div style={{ ...kpiIconStyle, color: accent }}>{icon}</div>
        <div style={kpiLabelStyle}>{label}</div>
      </div>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiDetailStyle}>{detail}</div>
    </article>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div style={emptyStyle}>
      <div style={emptyIconStyle}>◇</div>
      <div style={emptyTitleStyle}>{title}</div>
      <div style={emptyTextStyle}>{text}</div>
    </div>
  )
}

function getCourseRef(row: any) {
  return row?.trn_courses?.ref || row?.learn_modules?.trn_courses?.ref || row?.trn_courses?.[0]?.ref || 'TRN'
}

function getCourseTitle(row: any) {
  return row?.trn_courses?.title || row?.learn_modules?.trn_courses?.title || row?.learn_modules?.title || row?.trn_courses?.[0]?.title || 'Formation AngelCare'
}

function initials(name?: string | null) {
  const clean = String(name || '').trim()
  if (!clean) return 'AC'
  const parts = clean.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}

function percentValue(total: number, done: number) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}

export default function TrainingHubPartnerPortalWorkspace({
  context,
  sessions,
  proposals,
  entitlements,
  certificates,
  participants,
  assignments,
  resources,
  sites,
  queryWarnings,
  adminPreview,
}: Props) {
  const organization = context.organizations.find((org) => org.organization_type === 'partner_school') || context.organizations[0]
  const upcomingSessions = sessions.filter((session) => ['scheduled', 'kit_preparation', 'ready_to_deliver', 'in_delivery', 'confirmed'].includes(String(session.status)))
  const completedSessions = sessions.filter((session) => ['delivered', 'attendance_validated', 'certificates_issued', 'refresh_unlocked', 'aftersales_completed', 'closed'].includes(String(session.status)))
  const activeProposals = proposals.filter((proposal) => !['rejected', 'expired', 'cancelled'].includes(String(proposal.status)))
  const unlockedRefresh = entitlements.filter((entitlement) => ['active', 'unlocked'].includes(String(entitlement.status)))
  const certified = certificates.filter((certificate) => String(certificate.status || '') === 'issued')
  const uniqueParticipants = new Set(participants.map((participant) => participant.email || participant.full_name || participant.id).filter(Boolean)).size
  const modulesAssigned = assignments.length
  const progressScore = Math.min(100, Math.round((completedSessions.length * 12) + (unlockedRefresh.length * 8) + (certified.length * 5) + (uniqueParticipants * 3)))
  const attendanceReady = participants.filter((participant) => ['present', 'validated', 'completed'].includes(String(participant.attendance_status || '').toLowerCase())).length
  const refreshRate = percentValue(completedSessions.length || unlockedRefresh.length, unlockedRefresh.length)
  const certificateRate = percentValue(uniqueParticipants, certified.length)
  const teamActivationRate = percentValue(uniqueParticipants, attendanceReady)
  const [identityOpen, setIdentityOpen] = useState(false)

  return (
    <main style={pageStyle}>
      <header style={heroWrapStyle}>
        <div style={heroShellStyle}>
          <div style={topLineStyle}>
            <div style={brandStyle}>
              <AngelCareLogo size="md" showText />
              <span style={brandDividerStyle} />
              <div>
                <div style={productStyle}>TrainingHub Partner Portal</div>
                <div style={productSubStyle}>Espace direction • Formations • Refresh • Preuves</div>
              </div>
            </div>

            <div style={badgeRowStyle}>
              <Badge tone={{ bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }}>Accès sécurisé</Badge>
              {adminPreview ? <Badge tone={{ bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' }}>Preview AngelCare</Badge> : null}
              <a href="/traininghub/logout" style={logoutStyle}>Déconnexion</a>
            </div>
          </div>

          <div style={heroGridStyle}>
      <TrainingHubPartnerBusinessPortalBoard />

      <section style={heroStoryStyle}>
              <div style={kickerStyle}>ANGELCARE • PARTNER EXPERIENCE</div>
              <h1 style={heroTitleStyle}>Votre montée en gamme devient visible.</h1>
              <p style={heroSubtitleStyle}>
                Une vue direction simple et premium pour suivre ce qui compte vraiment : formations activées, équipe formée,
                refresh disponibles, certificats et preuves de progression.
              </p>

              <div style={heroActionsStyle}>
                <a href="#trainings" style={primaryActionStyle}>Voir mes formations</a>
                <a href="#academy" style={secondaryActionStyle}>Ouvrir le refresh</a>
                <a href="#proof" style={ghostActionStyle}>Preuves & kits</a>
              </div>
</section>

            <aside style={controlPanelStyle}>
              <div style={compactIdentityGlowStyle} />

              <div style={compactIdentityTopStyle}>
                <div style={compactIdentityMainStyle}>
                  <div style={partnerCompactAvatarStyle}>{initials(organization?.name || context.profile.full_name)}</div>
                  <div style={compactIdentityCopyStyle}>
                    <div style={compactOverlineStyle}>Identité partenaire</div>
                    <h2 style={compactPartnerNameStyle}>{organization?.name || 'Partenaire AngelCare'}</h2>
                    <p style={compactPartnerMetaStyle}>
                      {organization?.city || sites[0]?.city || 'Maroc'} • {Math.max(sites.length, 1)} site • {context.roles[0]?.code || 'partner_owner'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIdentityOpen((open) => !open)}
                  style={compactToggleButtonStyle}
                  aria-expanded={identityOpen}
                  aria-label={identityOpen ? 'Réduire les détails partenaire' : 'Afficher les détails partenaire'}
                >
                  <span>{identityOpen ? 'Réduire' : 'Détails'}</span>
                  <strong>{identityOpen ? '⌃' : '⌄'}</strong>
                </button>
              </div>

              <div style={compactIdentityCardsStyle}>
                <div style={compactMiniCardStyle}>
                  <span>Indice</span>
                  <strong>{progressScore}/100</strong>
                  <small>{progressScore >= 75 ? 'Excellence' : progressScore >= 35 ? 'En progression' : 'À activer'}</small>
                </div>
                <div style={compactMiniCardStyle}>
                  <span>Formations</span>
                  <strong>{upcomingSessions.length + completedSessions.length}</strong>
                  <small>sessions suivies</small>
                </div>
                <div style={compactMiniCardStyle}>
                  <span>Équipe</span>
                  <strong>{uniqueParticipants}</strong>
                  <small>collaborateurs</small>
                </div>
              </div>

              <div style={compactProgressTrackStyle}>
                <div style={{ ...compactProgressFillStyle, width: `${progressScore}%` }} />
              </div>

              {identityOpen ? (
                <div style={compactExpandedStyle}>
                  <div style={compactIdentityMatrixStyle}>
                    <div style={compactMatrixCellStyle}><span>Statut</span><strong>{statusLabel(organization?.status || 'active')}</strong></div>
                    <div style={compactMatrixCellStyle}><span>Ville</span><strong>{organization?.city || sites[0]?.city || 'Maroc'}</strong></div>
                    <div style={compactMatrixCellStyle}><span>Portail</span><strong>Partner secure</strong></div>
                    <div style={compactMatrixCellStyle}><span>Profil</span><strong>{adminPreview ? 'Preview AngelCare' : 'Partenaire école'}</strong></div>
                  </div>

                  <div style={compactHealthStackStyle}>
                    <div style={compactHealthLineStyle}>
                      <div><span>Refresh activés</span><strong>{refreshRate}%</strong></div>
                      <div style={compactHealthTrackStyle}><div style={{ ...compactHealthFillStyle, width: `${refreshRate}%`, background: '#14b8a6' }} /></div>
                    </div>
                    <div style={compactHealthLineStyle}>
                      <div><span>Certificats délivrés</span><strong>{certificateRate}%</strong></div>
                      <div style={compactHealthTrackStyle}><div style={{ ...compactHealthFillStyle, width: `${certificateRate}%`, background: '#a78bfa' }} /></div>
                    </div>
                    <div style={compactHealthLineStyle}>
                      <div><span>Équipe activée</span><strong>{teamActivationRate}%</strong></div>
                      <div style={compactHealthTrackStyle}><div style={{ ...compactHealthFillStyle, width: `${teamActivationRate}%`, background: '#60a5fa' }} /></div>
                    </div>
                  </div>

                  <div style={compactActionBoardStyle}>
                    <a href="#trainings" style={compactActionRowStyle}><span>01</span><strong>Suivre les formations</strong></a>
                    <a href="#academy" style={compactActionRowStyle}><span>02</span><strong>Activer les refresh</strong></a>
                    <a href="#proof" style={compactActionRowStyle}><span>03</span><strong>Centraliser preuves & kits</strong></a>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </header>

      <nav style={stickyNavStyle} aria-label="Partner portal sections">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} style={navLinkStyle}>
            <span style={navIconStyle}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {queryWarnings.length ? (
        <section style={warningStyle}>
          <strong>Note système.</strong> Certaines données ne sont pas encore visibles pour ce profil ou cette organisation. Cela peut être normal avant activation commerciale complète ou en mode preview.
        </section>
      ) : null}

      <section id="overview" style={kpiGridStyle}>
        <KpiCard icon="▣" label="Sessions actives" value={upcomingSessions.length} detail="Planifiées, confirmées ou en préparation" accent="#2563eb" />
        <KpiCard icon="◆" label="Sessions finalisées" value={completedSessions.length} detail="Delivery validé ou clôturé" accent="#059669" />
        <KpiCard icon="▶" label="Refresh ouverts" value={unlockedRefresh.length} detail="Modules disponibles pour vos recyclages" accent="#db2777" />
        <KpiCard icon="◈" label="Propositions en cours" value={activeProposals.length} detail="Offres commerciales et engagements visibles" accent="#ea580c" />
        <KpiCard icon="◉" label="Collaborateurs suivis" value={uniqueParticipants} detail="Équipe enregistrée dans le portail" accent="#7c3aed" />
        <KpiCard icon="◇" label="Certificats délivrés" value={certified.length} detail="Preuves de formation prêtes à valoriser" accent="#0f766e" />
      </section>

      <section style={executiveGridStyle}>
        <article style={executiveCardPrimaryStyle}>
          <SectionTitle
            eyebrow="DIRECTION DASHBOARD"
            title="Vue direction établissement"
            text="Une lecture claire des leviers qui rassurent une direction : planification, équipes activées, progression pédagogique, conformité et preuves de qualité."
            action={<Badge tone={{ bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }}>High corporate monitoring</Badge>}
          />
          <div style={executiveMetricsGridStyle}>
            <MiniExecutiveCard icon="◈" title="Engagement commercial" value={activeProposals.length} text="propositions ou renouvellements suivis" />
            <MiniExecutiveCard icon="▣" title="Pipeline delivery" value={upcomingSessions.length} text="sessions à exécuter ou à préparer" />
            <MiniExecutiveCard icon="◉" title="Activation équipe" value={`${teamActivationRate}%`} text="participants présents / suivis" />
            <MiniExecutiveCard icon="▶" title="Learning continuity" value={modulesAssigned + unlockedRefresh.length} text="assignations + refresh disponibles" />
          </div>
        </article>

        <article style={executiveCardSecondaryStyle}>
          <SectionTitle
            eyebrow="ANGELCARE VALUE"
            title="Ce que votre portail partenaire vous apporte"
            text="Une expérience conçue pour donner de la visibilité, réduire l’incertitude et renforcer la confiance dans la progression de votre école."
          />
          <div style={benefitStackStyle}>
            <BenefitRow icon="◆" title="Traçabilité premium" text="Toutes vos formations, kits, certificats et refresh restent centralisés dans un seul espace." />
            <BenefitRow icon="◈" title="Vision direction" text="Des indicateurs simples pour comprendre où en est votre structure sans entrer dans la complexité interne AngelCare." />
            <BenefitRow icon="▶" title="Continuité de compétences" text="Les refresh e-learning prolongent l’impact des formations terrain dans le temps." />
          </div>
        </article>
      </section>

      <section style={contentGridStyle}>
        <div style={leftColumnStyle}>
          <section id="trainings" style={panelStyle}>
            <SectionTitle
              eyebrow="MY TRAININGS"
              title="Mes formations & prochaines sessions"
              text="Calendrier des formations achetées, planifiées ou en cours de préparation pour votre établissement."
              action={<a href="#proof" style={sectionActionStyle}>Voir preuves & kits</a>}
            />
            <div style={sessionListStyle}>
              {sessions.length ? sessions.slice(0, 8).map((session) => (
                <article key={session.id} style={sessionCardStyle}>
                  <div style={sessionHeaderStyle}>
                    <div>
                      <div style={refStyle}>{getCourseRef(session)} • {session.session_code || 'Session'}</div>
                      <h3 style={cardTitleStyle}>{getCourseTitle(session)}</h3>
                      <p style={cardTextStyle}>{session.trn_courses?.trn_categories?.name || 'Formation AngelCare'} • {session.delivery_mode || 'onsite'} • {session.city || organization?.city || 'Maroc'}</p>
                    </div>
                    <Badge status={session.status}>{statusLabel(session.status)}</Badge>
                  </div>
                  <div style={miniGridStyle}>
                    <div style={miniItemStyle}><span>Date</span><strong>{dateLabel(session.scheduled_start_at)}</strong></div>
                    <div style={miniItemStyle}><span>Participants</span><strong>{session.actual_participant_count || session.planned_participant_count || 0}</strong></div>
                    <div style={miniItemStyle}><span>Durée</span><strong>{session.planned_hours || '6–15'} h</strong></div>
                    <div style={miniItemStyle}><span>Ville</span><strong>{session.city || organization?.city || 'Maroc'}</strong></div>
                  </div>
                </article>
              )) : <EmptyState title="Aucune session encore activée" text="Les formations apparaîtront ici dès qu’une proposition sera confirmée et transformée en session de delivery." />}
            </div>
          </section>

          <section id="academy" style={panelStyle}>
            <SectionTitle
              eyebrow="E-LEARNING REFRESH"
              title="Bibliothèque refresh & apprentissage continu"
              text="Les modules refresh débloqués après vos formations terrain pour maintenir les standards de qualité dans la durée."
              action={<Badge tone={{ bg: '#fdf2f8', fg: '#be185d', border: '#fbcfe8' }}>Forever refresher logic</Badge>}
            />
            <div style={moduleGridStyle}>
              {unlockedRefresh.length ? unlockedRefresh.slice(0, 6).map((entitlement) => (
                <article key={entitlement.id} style={moduleCardStyle}>
                  <div style={moduleIconStyle}>▶</div>
                  <div>
                    <div style={refStyle}>{entitlement.learn_modules?.module_code || 'REFRESH'}</div>
                    <h3 style={cardTitleStyle}>{entitlement.learn_modules?.title || getCourseTitle(entitlement)}</h3>
                    <p style={cardTextStyle}>{entitlement.access_policy === 'forever_for_school_refresh' ? 'Accès école pour recyclage périodique' : 'Accès e-learning activé'} • {entitlement.learn_modules?.estimated_minutes || 20} min</p>
                  </div>
                  <Badge status={entitlement.status}>{statusLabel(entitlement.status)}</Badge>
                </article>
              )) : <EmptyState title="Aucun refresh débloqué" text="Les modules e-learning apparaîtront après validation d’une session onsite et déblocage par AngelCare." />}
            </div>
          </section>
        </div>

        <aside style={rightColumnStyle}>
          <section id="team" style={panelStyle}>
            <SectionTitle eyebrow="TEAM SNAPSHOT" title="Équipe, certificats & suivi" text="Vos collaborateurs formés, leurs statuts et la dynamique d’activation de l’équipe." />
            <div style={compactListStyle}>
              {participants.length ? participants.slice(0, 6).map((participant) => (
                <div key={participant.id} style={compactRowStyle}>
                  <div style={compactIdentityStyle}>
                    <div style={compactAvatarStyle}>{initials(participant.full_name || participant.email)}</div>
                    <div>
                      <strong>{participant.full_name || participant.email || 'Participant'}</strong>
                      <span>{participant.job_title || 'Staff'} • présence {statusLabel(participant.attendance_status)}</span>
                    </div>
                  </div>
                  <Badge status={participant.certificate_status || participant.refresh_access_status}>{statusLabel(participant.certificate_status || participant.refresh_access_status || 'tracked')}</Badge>
                </div>
              )) : <EmptyState title="Aucun participant enregistré" text="Les membres de votre équipe apparaîtront lors de la planification ou de la livraison des sessions." />}
            </div>
          </section>

          <section id="proof" style={panelStyle}>
            <SectionTitle eyebrow="CERTIFICATES & RESOURCES" title="Preuves, kits & ressources" text="Tous les livrables utiles à la valorisation et au maintien des standards de formation." />
            <div style={compactListStyle}>
              {certificates.length ? certificates.slice(0, 5).map((certificate) => (
                <div key={certificate.id} style={compactRowStyle}>
                  <div>
                    <strong>{certificate.certificate_number || 'Certificat'}</strong>
                    <span>{certificate.trn_courses?.title || 'Formation'} • {simpleDate(certificate.issued_at)}</span>
                  </div>
                  <Badge status={certificate.status}>{statusLabel(certificate.status)}</Badge>
                </div>
              )) : <EmptyState title="Aucun certificat disponible" text="Les certificats apparaîtront après validation de présence et émission par AngelCare." />}
            </div>

            <div style={resourceDividerStyle} />
            <div style={resourceStackStyle}>
              {resources.length ? resources.slice(0, 6).map((resource) => (
                <div key={resource.id} style={resourceRowStyle}>
                  <Badge tone={{ bg: '#eef2ff', fg: '#4338ca', border: '#c7d2fe' }}>{resource.resource_type || 'resource'}</Badge>
                  <div>
                    <strong>{resource.resource_title || 'Ressource pédagogique'}</strong>
                    <span>{resource.trn_courses?.ref || 'TRN'} • {resource.visibility_scope || 'partner'}</span>
                  </div>
                  <Badge status={resource.status}>{statusLabel(resource.status)}</Badge>
                </div>
              )) : <EmptyState title="Aucune ressource disponible" text="Les kits, workbook et fiches process apparaîtront ici à mesure de l’activation des formations." />}
            </div>
          </section>

          <section style={panelStyle}>
            <SectionTitle eyebrow="PROPOSALS" title="Propositions & engagements" text="Lecture simplifiée des offres et engagements commerciaux visibles par votre établissement." />
            <div style={compactListStyle}>
              {activeProposals.length ? activeProposals.slice(0, 5).map((proposal) => (
                <div key={proposal.id} style={compactRowStyle}>
                  <div>
                    <strong>{proposal.proposal_number || proposal.title || 'Proposition'}</strong>
                    <span>{money(proposal.grand_total_minor, proposal.currency_code || 'MAD')} • validité {simpleDate(proposal.valid_until)}</span>
                  </div>
                  <Badge status={proposal.status}>{statusLabel(proposal.status)}</Badge>
                </div>
              )) : <EmptyState title="Aucune proposition active" text="Les devis et propositions envoyés par AngelCare seront visibles ici." />}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}

function MetricLine({ label, value, progress, color }: { label: string; value: string; progress: number; color: string }) {
  return (
    <div style={metricLineStyle}>
      <div style={metricHeaderStyle}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={metricTrackStyle}><div style={{ ...metricFillStyle, width: `${progress}%`, background: color }} /></div>
    </div>
  )
}

function MiniExecutiveCard({ icon, title, value, text }: { icon: string; title: string; value: ReactNode; text: string }) {
  return (
    <div style={miniExecutiveCardStyle}>
      <div style={miniExecutiveIconStyle}>{icon}</div>
      <div style={miniExecutiveTitleStyle}>{title}</div>
      <div style={miniExecutiveValueStyle}>{value}</div>
      <div style={miniExecutiveTextStyle}>{text}</div>
    </div>
  )
}

function BenefitRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={benefitRowStyle}>
      <div style={benefitIconStyle}>{icon}</div>
      <div>
        <div style={benefitTitleStyle}>{title}</div>
        <div style={benefitTextStyle}>{text}</div>
      </div>
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top left, rgba(37,99,235,.10), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #f6f8fb 56%, #eef4fb 100%)',
  padding: 24,
  color: '#0f172a',
  fontFamily: 'Inter, Arial, sans-serif',
}
const heroWrapStyle: CSSProperties = { marginBottom: 18 }
const heroShellStyle: CSSProperties = {
  borderRadius: 36,
  padding: 26,
  border: '1px solid rgba(226,232,240,.9)',
  background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 58%, #eef6ff 100%)',
  boxShadow: '0 32px 90px rgba(15,23,42,.10)',
  overflow: 'hidden',
}
const topLineStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 26, flexWrap: 'wrap' }
const brandStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }
const brandDividerStyle: CSSProperties = { width: 1, height: 34, background: '#e2e8f0' }
const productStyle: CSSProperties = { fontSize: 13, fontWeight: 950, letterSpacing: '.14em', color: '#0f172a', textTransform: 'uppercase' }
const productSubStyle: CSSProperties = { marginTop: 4, fontSize: 12, fontWeight: 750, color: '#64748b' }
const badgeRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }
const logoutStyle: CSSProperties = { textDecoration: 'none', borderRadius: 16, padding: '11px 15px', color: '#334155', border: '1px solid #e2e8f0', background: '#ffffff', fontWeight: 900 }
const heroGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.14fr) minmax(390px, .72fr)', gap: 26, alignItems: 'stretch' }
const heroStoryStyle: CSSProperties = { minHeight: 430, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 0 4px' }
const kickerStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 16 }
const heroTitleStyle: CSSProperties = { margin: 0, maxWidth: 760, color: '#0b1220', fontSize: 70, lineHeight: .92, letterSpacing: '-.075em', fontWeight: 980 }
const heroSubtitleStyle: CSSProperties = { margin: '22px 0 0', maxWidth: 760, color: '#475569', fontSize: 18, lineHeight: 1.68, fontWeight: 700 }
const heroActionsStyle: CSSProperties = { display: 'flex', gap: 11, flexWrap: 'wrap', marginTop: 28 }
const primaryActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '15px 20px', background: 'linear-gradient(135deg, #0f2a52 0%, #2563eb 100%)', color: '#fff', fontWeight: 950, boxShadow: '0 20px 42px rgba(37,99,235,.25)' }
const secondaryActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '15px 20px', background: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4', fontWeight: 950 }
const ghostActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '15px 20px', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 950 }
const controlPanelStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  alignSelf: 'start',
  borderRadius: 30,
  padding: 20,
  color: '#fff',
  background: 'radial-gradient(circle at 86% 6%, rgba(125,211,252,.24), transparent 31%), linear-gradient(160deg, #0b2348 0%, #123c72 52%, #2557d6 100%)',
  boxShadow: '0 24px 64px rgba(15,42,82,.26)',
}
const orgHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }
const avatarStyle: CSSProperties = { width: 68, height: 68, borderRadius: 22, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', fontSize: 23, fontWeight: 950 }
const orgLabelStyle: CSSProperties = { fontSize: 11, fontWeight: 950, letterSpacing: '.14em', opacity: .72, textTransform: 'uppercase' }
const orgNameStyle: CSSProperties = { marginTop: 5, fontSize: 27, lineHeight: 1, fontWeight: 950, letterSpacing: '-.04em' }
const orgMetaStyle: CSSProperties = { marginTop: 8, fontSize: 12, fontWeight: 750, opacity: .82 }
const scoreBoxStyle: CSSProperties = { borderRadius: 24, padding: 18, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.16)', marginBottom: 16 }
const scoreTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 13 }
const progressTrackStyle: CSSProperties = { height: 12, borderRadius: 999, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }
const progressFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #34d399, #60a5fa)' }
const metricStackStyle: CSSProperties = { display: 'grid', gap: 12, borderRadius: 24, padding: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }
const miniStatsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 16 }
const stickyNavStyle: CSSProperties = { position: 'sticky', top: 10, zIndex: 10, display: 'flex', gap: 10, flexWrap: 'wrap', padding: 12, marginBottom: 18, borderRadius: 22, border: '1px solid rgba(226,232,240,.85)', background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(14px)', boxShadow: '0 14px 30px rgba(15,23,42,.06)' }
const navLinkStyle: CSSProperties = { textDecoration: 'none', color: '#334155', borderRadius: 999, padding: '10px 14px', border: '1px solid #e2e8f0', background: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 850, fontSize: 13 }
const navIconStyle: CSSProperties = { color: '#2563eb', fontWeight: 950 }
const warningStyle: CSSProperties = { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', borderRadius: 20, padding: 14, marginBottom: 18, fontSize: 13, fontWeight: 750 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 14, marginBottom: 18 }
const kpiCardStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 44px rgba(15,23,42,.07)' }
const kpiAccentStyle: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4 }
const kpiIconRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }
const kpiIconStyle: CSSProperties = { width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#f8fafc', fontWeight: 950 }
const kpiLabelStyle: CSSProperties = { fontSize: 13, color: '#0f172a', fontWeight: 900 }
const kpiValueStyle: CSSProperties = { fontSize: 31, fontWeight: 950, letterSpacing: '-.04em' }
const kpiDetailStyle: CSSProperties = { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 750, lineHeight: 1.45 }
const executiveGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, .8fr)', gap: 18, marginBottom: 18 }
const executiveCardPrimaryStyle: CSSProperties = { borderRadius: 30, padding: 22, background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.07)' }
const executiveCardSecondaryStyle: CSSProperties = { borderRadius: 30, padding: 22, background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }
const sectionEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.11em', textTransform: 'uppercase', marginBottom: 6 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 24, fontWeight: 950, letterSpacing: '-.035em' }
const sectionTextStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.58, fontSize: 13, fontWeight: 650, maxWidth: 720 }
const sectionActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 14, padding: '10px 12px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 900, fontSize: 12 }
const executiveMetricsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }
const miniExecutiveCardStyle: CSSProperties = { borderRadius: 22, padding: 16, background: '#fff', border: '1px solid #e2e8f0', display: 'grid', gap: 6 }
const miniExecutiveIconStyle: CSSProperties = { width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950 }
const miniExecutiveTitleStyle: CSSProperties = { fontSize: 12, color: '#334155', fontWeight: 900 }
const miniExecutiveValueStyle: CSSProperties = { fontSize: 24, fontWeight: 950, letterSpacing: '-.04em' }
const miniExecutiveTextStyle: CSSProperties = { fontSize: 11, color: '#64748b', lineHeight: 1.45, fontWeight: 700 }
const benefitStackStyle: CSSProperties = { display: 'grid', gap: 12 }
const benefitRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '42px minmax(0, 1fr)', gap: 12, alignItems: 'start', padding: 14, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }
const benefitIconStyle: CSSProperties = { width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#1d4ed8', fontWeight: 950 }
const benefitTitleStyle: CSSProperties = { fontWeight: 900, color: '#0f172a', marginBottom: 4 }
const benefitTextStyle: CSSProperties = { fontSize: 12, color: '#64748b', lineHeight: 1.55, fontWeight: 700 }
const contentGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, .85fr)', gap: 18 }
const leftColumnStyle: CSSProperties = { display: 'grid', gap: 18 }
const rightColumnStyle: CSSProperties = { display: 'grid', gap: 18 }
const panelStyle: CSSProperties = { borderRadius: 30, padding: 22, background: 'rgba(255,255,255,.94)', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.07)' }
const sessionListStyle: CSSProperties = { display: 'grid', gap: 12 }
const sessionCardStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 24, padding: 16, background: 'linear-gradient(180deg, #fff 0%, #f8fbff 100%)' }
const sessionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 14 }
const refStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }
const cardTitleStyle: CSSProperties = { margin: 0, fontSize: 16, fontWeight: 950, letterSpacing: '-.02em' }
const cardTextStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.45, fontWeight: 700 }
const miniGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }
const miniItemStyle: CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12 }
const moduleGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const moduleCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', gap: 12, alignItems: 'start', border: '1px solid #e2e8f0', borderRadius: 24, padding: 14, background: '#fff', position: 'relative' }
const moduleIconStyle: CSSProperties = { width: 44, height: 44, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#fdf2f8', color: '#be185d', fontWeight: 950 }
const compactListStyle: CSSProperties = { display: 'grid', gap: 10 }
const compactRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const compactIdentityStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr)', gap: 10, alignItems: 'center' }
const compactAvatarStyle: CSSProperties = { width: 40, height: 40, borderRadius: 14, background: '#eff6ff', color: '#1d4ed8', display: 'grid', placeItems: 'center', fontWeight: 950 }
const resourceDividerStyle: CSSProperties = { height: 1, background: '#e2e8f0', margin: '16px 0' }
const resourceStackStyle: CSSProperties = { display: 'grid', gap: 10 }
const resourceRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr) 68px', gap: 8, alignItems: 'center', padding: 10, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }
const metricLineStyle: CSSProperties = { display: 'grid', gap: 6 }
const metricHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }
const metricTrackStyle: CSSProperties = { height: 8, borderRadius: 999, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }
const metricFillStyle: CSSProperties = { height: '100%', borderRadius: 999 }
const badgeStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, textTransform: 'capitalize', whiteSpace: 'nowrap' }
const emptyStyle: CSSProperties = { border: '1px dashed #cbd5e1', borderRadius: 20, padding: 18, background: '#f8fafc', color: '#64748b', textAlign: 'center' }
const emptyIconStyle: CSSProperties = { fontSize: 28, color: '#94a3b8', marginBottom: 6 }
const emptyTitleStyle: CSSProperties = { fontWeight: 950, color: '#334155', marginBottom: 4 }
const emptyTextStyle: CSSProperties = { fontSize: 12, lineHeight: 1.5, fontWeight: 650 }

const partnerIdentityGlowStyle: CSSProperties = {
  position: 'absolute',
  right: -60,
  top: -70,
  width: 210,
  height: 210,
  borderRadius: 999,
  background: 'rgba(96,165,250,.28)',
  filter: 'blur(34px)',
  pointerEvents: 'none',
}
const partnerIdentityHeaderStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'flex-start',
  marginBottom: 18,
}
const partnerBadgeStackStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
  justifyItems: 'end',
}
const partnerLiveBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '7px 10px',
  background: 'rgba(52,211,153,.16)',
  border: '1px solid rgba(110,231,183,.24)',
  color: '#d1fae5',
  fontSize: 11,
  fontWeight: 950,
  whiteSpace: 'nowrap',
}
const partnerSecureBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '7px 10px',
  background: 'rgba(255,255,255,.10)',
  border: '1px solid rgba(255,255,255,.16)',
  color: 'rgba(255,255,255,.84)',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap',
}
const partnerIdentityMatrixStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 16,
}
const partnerIdentityCellStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
  borderRadius: 18,
  padding: 14,
  background: 'rgba(255,255,255,.10)',
  border: '1px solid rgba(255,255,255,.15)',
}
const identityScoreTitleStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
}
const identityScoreStageStyle: CSSProperties = {
  color: 'rgba(255,255,255,.78)',
  fontWeight: 850,
  textAlign: 'right',
  maxWidth: 180,
}
const identityScoreTextStyle: CSSProperties = {
  margin: '12px 0 0',
  color: 'rgba(255,255,255,.76)',
  fontSize: 12,
  lineHeight: 1.55,
  fontWeight: 700,
}
const premiumMetricLineStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
}
const premiumMetricTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 900,
}
const premiumMetricTrackStyle: CSSProperties = {
  height: 9,
  borderRadius: 999,
  background: 'rgba(255,255,255,.14)',
  overflow: 'hidden',
}
const premiumMetricFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
}
const partnerActionBoardStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
  marginTop: 16,
  borderRadius: 24,
  padding: 16,
  background: 'rgba(2,6,23,.18)',
  border: '1px solid rgba(255,255,255,.12)',
}
const partnerActionHeaderStyle: CSSProperties = {
  color: 'rgba(255,255,255,.72)',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
}
const partnerActionRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px minmax(0, 1fr)',
  gap: 10,
  alignItems: 'center',
  textDecoration: 'none',
  color: '#ffffff',
  padding: '10px 0',
  borderTop: '1px solid rgba(255,255,255,.10)',
}
const partnerMiniStatStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  minHeight: 76,
  alignContent: 'center',
  borderRadius: 18,
  padding: 14,
  background: 'rgba(255,255,255,.10)',
  border: '1px solid rgba(255,255,255,.13)',
  color: '#fff',
}

const compactIdentityGlowStyle: CSSProperties = {
  position: 'absolute',
  right: -44,
  top: -54,
  width: 170,
  height: 170,
  borderRadius: 999,
  background: 'rgba(96,165,250,.24)',
  filter: 'blur(32px)',
  pointerEvents: 'none',
}
const compactIdentityTopStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'flex-start',
  marginBottom: 16,
}
const compactIdentityMainStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '58px minmax(0, 1fr)',
  gap: 13,
  alignItems: 'center',
  minWidth: 0,
}
const partnerCompactAvatarStyle: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 20,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(255,255,255,.14)',
  border: '1px solid rgba(255,255,255,.18)',
  color: '#ffffff',
  fontWeight: 950,
  fontSize: 20,
}
const compactIdentityCopyStyle: CSSProperties = { minWidth: 0 }
const compactOverlineStyle: CSSProperties = {
  color: 'rgba(255,255,255,.72)',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: '.13em',
  textTransform: 'uppercase',
}
const compactPartnerNameStyle: CSSProperties = {
  margin: '5px 0 0',
  color: '#ffffff',
  fontSize: 26,
  lineHeight: 1,
  letterSpacing: '-.04em',
  fontWeight: 950,
}
const compactPartnerMetaStyle: CSSProperties = {
  margin: '7px 0 0',
  color: 'rgba(255,255,255,.80)',
  fontSize: 12,
  lineHeight: 1.45,
  fontWeight: 800,
}
const compactToggleButtonStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,.18)',
  background: 'rgba(255,255,255,.10)',
  color: '#ffffff',
  borderRadius: 999,
  padding: '9px 12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 950,
  cursor: 'pointer',
}
const compactIdentityCardsStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 12,
}
const compactMiniCardStyle: CSSProperties = {
  minHeight: 76,
  display: 'grid',
  alignContent: 'center',
  gap: 3,
  borderRadius: 18,
  padding: 12,
  background: 'rgba(255,255,255,.11)',
  border: '1px solid rgba(255,255,255,.14)',
  color: '#ffffff',
}
const compactProgressTrackStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  height: 10,
  borderRadius: 999,
  background: 'rgba(255,255,255,.18)',
  overflow: 'hidden',
}
const compactProgressFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, #34d399, #60a5fa)',
}
const compactExpandedStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: 12,
  marginTop: 14,
  paddingTop: 14,
  borderTop: '1px solid rgba(255,255,255,.12)',
}
const compactIdentityMatrixStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 9,
}
const compactMatrixCellStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  borderRadius: 16,
  padding: 12,
  background: 'rgba(2,6,23,.16)',
  border: '1px solid rgba(255,255,255,.10)',
  color: '#ffffff',
}
const compactHealthStackStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  borderRadius: 18,
  padding: 13,
  background: 'rgba(255,255,255,.08)',
  border: '1px solid rgba(255,255,255,.10)',
}
const compactHealthLineStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 850,
}
const compactHealthTrackStyle: CSSProperties = {
  height: 7,
  borderRadius: 999,
  background: 'rgba(255,255,255,.14)',
  overflow: 'hidden',
}
const compactHealthFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
}
const compactActionBoardStyle: CSSProperties = {
  display: 'grid',
  gap: 0,
  borderRadius: 18,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,.10)',
  background: 'rgba(2,6,23,.18)',
}
const compactActionRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px minmax(0, 1fr)',
  gap: 9,
  alignItems: 'center',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '11px 12px',
  borderTop: '1px solid rgba(255,255,255,.08)',
  fontSize: 12,
  fontWeight: 900,
}
