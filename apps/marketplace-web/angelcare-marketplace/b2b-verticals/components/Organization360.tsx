import Link from 'next/link'
import type { TenantWorkspaceData } from '../../partner-os/types'
import type { Organization360Data } from '../types'
import { verticalLabels } from '../labels'
import { B2BOperatorDesk } from './B2BOperatorDesk'
import styles from '../b2b.module.css'
import operatorStyles from './b2b-operator.module.css'

export function Organization360({ data, tenantWorkspace, permissions }: {
  data: Organization360Data
  tenantWorkspace?: TenantWorkspaceData | null
  permissions: { reviewDiagnostics: boolean; convertDiagnostics: boolean; managePrograms: boolean }
}) {
  const organization = data.organization
  return <div className={styles.universe}>
    <section className={styles.dossierHero}>
      <div className={styles.identity}><span className={styles.eyebrow}>ORGANISATION 360 · {verticalLabels[organization.vertical].fr}</span><h1>{organization.display_name}</h1><p>{organization.legal_name} · {organization.organization_code}</p><div className={styles.identityMeta}><span>{organization.lifecycle_status}</span><span>Risque {organization.risk_level}</span><span>{data.sites.length} sites</span><span>{data.contacts.length} contacts</span></div></div>
      <aside className={styles.decisionRail}><div className={styles.decision}><small>Prochaine action</small><strong>{organization.next_action || 'À définir'}</strong></div><div className={styles.decision}><small>Relations</small><strong>{organization.crm_account_id ? 'CRM connecté' : 'CRM à connecter'} · {organization.tenant_id ? 'Tenant actif' : 'Tenant non créé'}</strong></div><div className={styles.decision}><small>Traçabilité</small><strong>{data.auditCount} événements d’audit</strong></div></aside>
    </section>
    <section className={styles.triple}>{[['Diagnostics', data.diagnostics.length], ['Programmes', data.programs.length], ['Readiness', data.readiness.filter((gate) => gate.status !== 'passed').length]].map(([label, value]) => <article className={styles.metric} key={String(label)}><div className={styles.metricLabel}>{label}</div><div className={styles.metricValue}>{value}</div><div className={styles.metricHint}>dossiers reliés</div></article>)}</section>
    {tenantWorkspace ? <section className={operatorStyles.partnerContext}><div><span className={styles.eyebrow}>PARTNER OS · AUTORITÉ CONTEXTUELLE</span><h2>{tenantWorkspace.tenant.display_name}</h2><p>{tenantWorkspace.subscription ? `${tenantWorkspace.subscription.public_reference} · ${tenantWorkspace.subscription.status}` : 'Aucun abonnement actif'} · {tenantWorkspace.modules.filter((module) => module.status === 'active').length} modules actifs · onboarding {tenantWorkspace.tenant.onboarding_score}%.</p></div><div className={operatorStyles.partnerSignals}><span><strong>{tenantWorkspace.members}</strong> membres</span><span><strong>{tenantWorkspace.usageAlerts}</strong> alertes usage</span><Link className={styles.secondary} href={`/angelcare-marketplace/admin/partner-os/tenants/${tenantWorkspace.tenant.id}`}>Ouvrir le tenant gouverné</Link></div></section> : null}
    <section className={styles.split}>
      <article className={styles.panel}><header className={styles.panelHead}><div><h2 className={styles.panelTitle}>Diagnostics & recommandations</h2><p className={styles.panelSub}>Qualification factuelle et décisions convertibles.</p></div></header><div className={styles.panelBody}><div className={styles.list}>{data.diagnostics.map((diagnostic) => <div className={styles.listItem} key={diagnostic.id}><div><h4>{diagnostic.diagnostic_type}</h4><p>{diagnostic.status} · {diagnostic.recommendation_summary || 'Recommandation en préparation'}</p></div><div className={styles.score}>{diagnostic.completion_score}%</div></div>)}{!data.diagnostics.length ? <div className={styles.empty}>Aucun diagnostic.</div> : null}</div></div></article>
      <article className={styles.panel}><header className={styles.panelHead}><div><h2 className={styles.panelTitle}>Programmes & readiness</h2><p className={styles.panelSub}>De la configuration au lancement contrôlé.</p></div></header><div className={styles.panelBody}><div className={styles.list}>{data.programs.map((program) => <div className={styles.listItem} key={program.id}><div><h4>{program.name}</h4><p>{program.program_type} · {program.status}</p></div><div className={styles.score}>{program.readiness_score}%</div></div>)}{!data.programs.length ? <div className={styles.empty}>Aucun programme.</div> : null}</div></div></article>
    </section>
    <B2BOperatorDesk diagnostics={data.diagnostics} programs={data.programs} canReviewDiagnostics={permissions.reviewDiagnostics} canConvertDiagnostics={permissions.convertDiagnostics} canManagePrograms={permissions.managePrograms} />
    <section className={styles.split}>
      <article className={styles.panel}><header className={styles.panelHead}><div><h2 className={styles.panelTitle}>Sites & décideurs</h2><p className={styles.panelSub}>Périmètre opérationnel et chaîne d’autorité.</p></div></header><div className={styles.panelBody}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Site / contact</th><th>Ville / rôle</th><th>Signal</th></tr></thead><tbody>{data.sites.map((site) => <tr key={site.id}><td>{site.name}</td><td>{site.city || '—'}</td><td>{site.active ? 'Actif' : 'Inactif'}</td></tr>)}{data.contacts.map((contact) => <tr key={contact.id}><td>{contact.full_name}</td><td>{contact.job_title || contact.decision_role || '—'}</td><td>{contact.primary_contact ? 'Principal' : 'Secondaire'}</td></tr>)}</tbody></table></div></div></article>
      <article className={styles.panel}><header className={styles.panelHead}><div><h2 className={styles.panelTitle}>Preuves & rapports</h2><p className={styles.panelSub}>Évidence opérationnelle sans fabrication.</p></div></header><div className={styles.panelBody}><div className={styles.list}>{data.reports.map((report) => <div className={styles.listItem} key={report.id}><div><h4>{report.report_type}</h4><p>{report.status} · {report.published_at || 'non publié'}</p></div></div>)}{!data.reports.length ? <div className={styles.empty}>Aucun rapport publié.</div> : null}</div></div></article>
    </section>
    <div className={styles.heroActions}><Link className={styles.ghost} href="/angelcare-marketplace/admin/verticals">Retour au commandement</Link><Link className={styles.secondary} href="/angelcare-marketplace/admin/commercial">Ouvrir le CRM</Link></div>
  </div>
}
