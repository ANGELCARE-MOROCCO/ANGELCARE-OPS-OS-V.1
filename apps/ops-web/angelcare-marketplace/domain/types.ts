export type MarketplaceAudience =
  | 'public'
  | 'parent'
  | 'tenant'
  | 'provider'
  | 'supplier'
  | 'admin'
  | 'executive'
  | 'territory_manager'

export type MarketplaceScopeType = 'global' | 'territory' | 'tenant' | 'self' | 'assigned' | 'read_only'

export type MarketplaceModuleStatus =
  | 'registered'
  | 'not_installed'
  | 'disabled'
  | 'enabled'
  | 'blocked'
  | 'degraded'
  | 'deprecated'
  | 'archived'

export type MarketplaceReadinessStatus = 'not_started' | 'in_progress' | 'ready' | 'blocked' | 'not_applicable'
export type MarketplaceAuditResult = 'success' | 'denied' | 'failed'

export type MarketplacePermission =
  | 'marketplace.foundation.view'
  | 'marketplace.workspace.access'
  | 'marketplace.admin.access'
  | 'marketplace.modules.view'
  | 'marketplace.modules.create'
  | 'marketplace.modules.update'
  | 'marketplace.modules.enable'
  | 'marketplace.modules.disable'
  | 'marketplace.modules.archive'
  | 'marketplace.feature_flags.view'
  | 'marketplace.feature_flags.manage'
  | 'marketplace.configuration.view'
  | 'marketplace.configuration.manage'
  | 'marketplace.audit.view'
  | 'marketplace.audit.export'
  | 'marketplace.security.view'
  | 'marketplace.security.manage'
  | 'marketplace.readiness.view'
  | 'marketplace.readiness.update'
  | 'marketplace.readiness.review'
  | 'marketplace.readiness.sign_off'
  | 'marketplace.territories.view'
  | 'marketplace.territories.create'
  | 'marketplace.territories.update'
  | 'marketplace.territories.clone'
  | 'marketplace.territories.submit_review'
  | 'marketplace.territories.approve_soft_launch'
  | 'marketplace.territories.approve_live'
  | 'marketplace.territories.pause'
  | 'marketplace.territories.resume'
  | 'marketplace.territories.archive'
  | 'marketplace.territories.preview'
  | 'marketplace.territories.export'
  | 'marketplace.territory_settings.view'
  | 'marketplace.territory_settings.manage'
  | 'marketplace.territory_overrides.view'
  | 'marketplace.territory_overrides.create'
  | 'marketplace.territory_overrides.review'
  | 'marketplace.territory_overrides.approve'
  | 'marketplace.territory_overrides.reject'
  | 'marketplace.territory_overrides.rollback'
  | 'marketplace.territory_readiness.view'
  | 'marketplace.territory_readiness.manage'
  | 'marketplace.territory_readiness.review'
  | 'marketplace.territory_readiness.sign_off'
  | 'marketplace.territory_health.view'
  | 'marketplace.territory_health.manage'
  | 'marketplace.localization.access'
  | 'marketplace.localization.scans.view'
  | 'marketplace.localization.scans.run'
  | 'marketplace.localization.scans.cancel'
  | 'marketplace.localization.scans.configure'
  | 'marketplace.localization.inventory.view'
  | 'marketplace.localization.inventory.classify'
  | 'marketplace.localization.inventory.export'
  | 'marketplace.localization.translations.view'
  | 'marketplace.localization.translations.create'
  | 'marketplace.localization.translations.edit'
  | 'marketplace.localization.translations.assign'
  | 'marketplace.localization.translations.submit'
  | 'marketplace.localization.translations.review'
  | 'marketplace.localization.translations.approve'
  | 'marketplace.localization.translations.publish'
  | 'marketplace.localization.translations.archive'
  | 'marketplace.localization.csv.export'
  | 'marketplace.localization.csv.import'
  | 'marketplace.localization.csv.validate'
  | 'marketplace.localization.csv.apply'
  | 'marketplace.localization.csv.rollback'
  | 'marketplace.localization.glossary.view'
  | 'marketplace.localization.glossary.manage'
  | 'marketplace.localization.memory.view'
  | 'marketplace.localization.memory.curate'
  | 'marketplace.localization.sensitive.review'
  | 'marketplace.localization.sensitive.approve'
  | 'marketplace.localization.seo.view'
  | 'marketplace.localization.seo.manage'
  | 'marketplace.localization.rules.view'
  | 'marketplace.localization.rules.manage'
  | 'marketplace.localization.sources.view'
  | 'marketplace.localization.sources.manage'
  | 'marketplace.localization.readiness.view'
  | 'marketplace.localization.audit.export'
  | 'marketplace.backoffice.command.view'
  | 'marketplace.backoffice.search'
  | 'marketplace.backoffice.actions.view'
  | 'marketplace.backoffice.actions.manage'
  | 'marketplace.backoffice.approvals.view'
  | 'marketplace.backoffice.approvals.create'
  | 'marketplace.backoffice.approvals.review'
  | 'marketplace.backoffice.approvals.decide'
  | 'marketplace.backoffice.approvals.override'
  | 'marketplace.backoffice.briefs.view'
  | 'marketplace.backoffice.briefs.create'
  | 'marketplace.backoffice.briefs.publish'
  | 'marketplace.backoffice.objects.view'
  | 'marketplace.backoffice.objects.comment'
  | 'marketplace.backoffice.objects.export'
  | 'marketplace.cms.view'
  | 'marketplace.cms.create'
  | 'marketplace.cms.edit'
  | 'marketplace.cms.submit'
  | 'marketplace.cms.review'
  | 'marketplace.cms.approve'
  | 'marketplace.cms.publish'
  | 'marketplace.cms.schedule'
  | 'marketplace.cms.rollback'
  | 'marketplace.cms.archive'
  | 'marketplace.cms.blocks.manage'
  | 'marketplace.cms.menus.manage'
  | 'marketplace.cms.ctas.manage'
  | 'marketplace.cms.preview'
  | 'marketplace.cms.redirects.manage'
  | 'marketplace.public.inquiries.view'
  | 'marketplace.public.inquiries.manage'
  | 'marketplace.public.inquiries.export'
  | 'marketplace.public.analytics.view'
  | 'marketplace.family.dashboard'
  | 'marketplace.family.profile.view'
  | 'marketplace.family.profile.manage'
  | 'marketplace.family.children.view'
  | 'marketplace.family.children.manage'
  | 'marketplace.family.diagnostics.create'
  | 'marketplace.family.diagnostics.view'
  | 'marketplace.family.requests.create'
  | 'marketplace.family.requests.view'
  | 'marketplace.family.requests.manage'
  | 'marketplace.family.requests.qualify'
  | 'marketplace.family.missions.view'
  | 'marketplace.family.reports.view'
  | 'marketplace.family.support.create'
  | 'marketplace.family.support.view'
  | 'marketplace.family.support.manage'
  | 'marketplace.family.documents.view'
  | 'marketplace.family.documents.manage'
  | 'marketplace.family.feedback.create'
  | 'marketplace.family.feedback.view'
  | 'marketplace.family.export'
  | 'marketplace.family.reports.publish'
  | 'marketplace.family.missions.manage'
  | 'marketplace.family.admin.manage'
  | 'marketplace.family.admin.view'
  | 'marketplace.family.access'
  | 'marketplace.public.content.preview'
  | 'marketplace.cms.export'
  | 'marketplace.cms.pages.manage'
  | 'marketplace.backoffice.briefs.manage'
  | 'marketplace.backoffice.audit.export'
  | 'marketplace.backoffice.cockpit.view'
  | 'marketplace.development.view'
  | 'marketplace.development.manage'
  | 'marketplace.development.publish'
  | 'marketplace.development.kits.view'
  | 'marketplace.development.kits.manage'
  | 'marketplace.development.supplier_specs.view'
  | 'marketplace.development.supplier_specs.manage'
  | 'marketplace.development.export'
  | 'marketplace.catalog.view'
  | 'marketplace.catalog.manage'
  | 'marketplace.catalog.review'
  | 'marketplace.catalog.publish'
  | 'marketplace.catalog.availability.manage'
  | 'marketplace.catalog.suppliers.view'
  | 'marketplace.catalog.suppliers.manage'
  | 'marketplace.catalog.commissions.view'
  | 'marketplace.catalog.commissions.manage'
  | 'marketplace.quote_basket.create'
  | 'marketplace.quote_basket.view'
  | 'marketplace.quote_basket.manage'
  | 'marketplace.catalog.export'
  | 'marketplace.conversion.view'
  | 'marketplace.conversion.manage'
  | 'marketplace.conversion.recover'
  | 'marketplace.conversion.configuration.manage'
  | 'marketplace.conversion.analytics.view'
  | 'marketplace.conversion.export'
  | 'marketplace.journeys.view'
  | 'marketplace.journeys.manage'
  | 'marketplace.journeys.actions.manage'
  | 'marketplace.journeys.documents.manage'
  | 'marketplace.journeys.notifications.manage'
  | 'marketplace.journeys.recovery.manage'
  | 'marketplace.journeys.configuration.manage'
  | 'marketplace.journeys.analytics.view'
  | 'marketplace.journeys.export'
  | 'marketplace.crm.view'
  | 'marketplace.crm.leads.manage'
  | 'marketplace.crm.accounts.manage'
  | 'marketplace.crm.contacts.manage'
  | 'marketplace.crm.opportunities.manage'
  | 'marketplace.crm.opportunities.transition'
  | 'marketplace.crm.quotes.view'
  | 'marketplace.crm.quotes.manage'
  | 'marketplace.crm.quotes.approve'
  | 'marketplace.crm.tasks.manage'
  | 'marketplace.crm.communications.log'
  | 'marketplace.crm.proof_packs.view'
  | 'marketplace.crm.proof_packs.manage'
  | 'marketplace.crm.export'
  | 'marketplace.partner_os.public.view'
  | 'marketplace.partner_os.admin.view'
  | 'marketplace.partner_os.tenants.create'
  | 'marketplace.partner_os.tenants.manage'
  | 'marketplace.partner_os.plans.view'
  | 'marketplace.partner_os.plans.manage'
  | 'marketplace.partner_os.subscriptions.view'
  | 'marketplace.partner_os.subscriptions.manage'
  | 'marketplace.partner_os.modules.manage'
  | 'marketplace.partner_os.usage.view'
  | 'marketplace.partner_os.usage.manage'
  | 'marketplace.partner_os.onboarding.manage'
  | 'marketplace.partner_os.tenant.access'
  | 'marketplace.partner_os.tenant.members.manage'
  | 'marketplace.partner_os.export'

  | 'marketplace.b2b.view'
  | 'marketplace.b2b.create'
  | 'marketplace.b2b.manage'
  | 'marketplace.b2b.export'
  | 'marketplace.b2b.organizations.merge'
  | 'marketplace.b2b.organizations.assign'
  | 'marketplace.b2b.diagnostics.view'
  | 'marketplace.b2b.diagnostics.manage'
  | 'marketplace.b2b.diagnostics.review'
  | 'marketplace.b2b.diagnostics.qualify'
  | 'marketplace.b2b.programs.view'
  | 'marketplace.b2b.programs.manage'
  | 'marketplace.b2b.programs.approve'
  | 'marketplace.b2b.programs.activate'
  | 'marketplace.b2b.programs.pause'
  | 'marketplace.b2b.establishments.view'
  | 'marketplace.b2b.establishments.manage'
  | 'marketplace.b2b.establishments.quality_review'
  | 'marketplace.b2b.hospitality.view'
  | 'marketplace.b2b.hospitality.manage'
  | 'marketplace.b2b.hospitality.approve'
  | 'marketplace.b2b.health_partners.view'
  | 'marketplace.b2b.health_partners.manage'
  | 'marketplace.b2b.health_partners.compliance_review'
  | 'marketplace.b2b.health_partners.sensitive_approve'
  | 'marketplace.b2b.corporates.view'
  | 'marketplace.b2b.corporates.manage'
  | 'marketplace.b2b.corporates.eligibility_manage'
  | 'marketplace.b2b.corporates.impact_view'
  | 'marketplace.b2b.conversions.manage'
  | 'marketplace.b2b.readiness.review'
  | 'marketplace.b2b.reports.view'
  | 'marketplace.academy.view'
  | 'marketplace.academy.manage'
  | 'marketplace.academy.catalog.manage'
  | 'marketplace.academy.cohorts.manage'
  | 'marketplace.academy.sessions.manage'
  | 'marketplace.academy.attendance.manage'
  | 'marketplace.academy.assessments.manage'
  | 'marketplace.academy.certificates.issue'
  | 'marketplace.academy.certificates.suspend'
  | 'marketplace.academy.certificates.revoke'
  | 'marketplace.academy.b2b.manage'
  | 'marketplace.academy.trainer.access'
  | 'marketplace.academy.learner.access'
  | 'marketplace.providers.view'
  | 'marketplace.providers.create'
  | 'marketplace.providers.manage'
  | 'marketplace.providers.documents.review'
  | 'marketplace.providers.certifications.review'
  | 'marketplace.providers.availability.manage'
  | 'marketplace.providers.eligibility.review'
  | 'marketplace.providers.suspend'
  | 'marketplace.providers.performance.view'
  | 'marketplace.providers.payable_eligibility.review'
  | 'marketplace.providers.self.access'
  | 'marketplace.providers.missions.view'
  | 'marketplace.providers.reports.submit'
  | 'marketplace.operations.view'
  | 'marketplace.operations.missions.create'
  | 'marketplace.operations.missions.manage'
  | 'marketplace.operations.dispatch.manage'
  | 'marketplace.operations.assign'
  | 'marketplace.operations.reassign'
  | 'marketplace.operations.checklists.manage'
  | 'marketplace.operations.reports.review'
  | 'marketplace.operations.reports.validate'
  | 'marketplace.operations.incidents.view'
  | 'marketplace.operations.incidents.manage'
  | 'marketplace.operations.incidents.escalate'
  | 'marketplace.operations.closure.approve'
  | 'marketplace.operations.proof.export'
  | 'marketplace.operations.live.view'
  | 'marketplace.trust.view'
  | 'marketplace.trust.manage'
  | 'marketplace.trust.sops.manage'
  | 'marketplace.trust.sops.approve'
  | 'marketplace.trust.evidence.review'
  | 'marketplace.trust.badges.issue'
  | 'marketplace.trust.badges.suspend'
  | 'marketplace.trust.badges.revoke'
  | 'marketplace.quality.view'
  | 'marketplace.quality.assessments.manage'
  | 'marketplace.quality.assessments.approve'
  | 'marketplace.quality.findings.manage'
  | 'marketplace.quality.corrective_actions.manage'
  | 'marketplace.quality.corrective_actions.close'
  | 'marketplace.complaints.view'
  | 'marketplace.complaints.manage'
  | 'marketplace.complaints.investigate'
  | 'marketplace.complaints.resolve'
  | 'marketplace.complaints.export'
  | 'marketplace.sensitive_content.review'
  | 'marketplace.sensitive_content.approve'
  | 'marketplace.compliance.review'
  | 'marketplace.compliance.approve'
  | 'marketplace.finance.view'
  | 'marketplace.finance.price_books.manage'
  | 'marketplace.finance.price_books.approve'
  | 'marketplace.finance.margins.view'
  | 'marketplace.finance.exceptions.approve'
  | 'marketplace.finance.revenue.view'
  | 'marketplace.finance.reconciliation.manage'
  | 'marketplace.finance.export'
  | 'marketplace.analytics.view'
  | 'marketplace.analytics.executive'
  | 'marketplace.analytics.finance'
  | 'marketplace.analytics.security'
  | 'marketplace.analytics.export'
  | 'marketplace.analytics.definitions.manage'
  | 'marketplace.analytics.data_quality.manage'
  | 'marketplace.security.access_review'
  | 'marketplace.security.roles.manage'
  | 'marketplace.security.isolation.review'
  | 'marketplace.security.events.view'
  | 'marketplace.security.retention.manage'
  | 'marketplace.security.separation_of_duties.review'
  | 'marketplace.backup.view'
  | 'marketplace.backup.manage'
  | 'marketplace.recovery_test.approve'
  | 'marketplace.qa.view'
  | 'marketplace.qa.manage'
  | 'marketplace.qa.execute'
  | 'marketplace.qa.defects.manage'
  | 'marketplace.qa.release_review'
  | 'marketplace.launch.view'
  | 'marketplace.launch.gates.manage'
  | 'marketplace.launch.gates.review'
  | 'marketplace.launch.waivers.approve'
  | 'marketplace.launch.release.approve'
  | 'marketplace.launch.pause'
  | 'marketplace.launch.rollback_authorize'
  | 'marketplace.launch.post_launch.manage'
  | 'marketplace.intelligence.view'
  | 'marketplace.intelligence.metrics.manage'
  | 'marketplace.growth.view'
  | 'marketplace.growth.experiments.manage'
  | 'marketplace.performance.view'
  | 'marketplace.security.assess'
  | 'marketplace.launch.approve'
  | 'marketplace.launch.monitoring'
export interface MarketplaceActor {
  id: string
  email: string | null
  displayName: string
  sourceRole: string
}

export interface MarketplaceRoleAssignment {
  roleKey: string
  scopeType: MarketplaceScopeType
  territoryId: string | null
  tenantId: string | null
}

export interface MarketplaceRequestContext {
  actor: MarketplaceActor
  roleKeys: string[]
  permissions: MarketplacePermission[]
  assignments: MarketplaceRoleAssignment[]
  territoryId: string | null
  tenantId: string | null
  locale: 'fr' | 'en' | 'ar'
  sessionReference: string | null
}

export interface MarketplaceModule {
  id: string
  module_key: string
  name: string
  description: string | null
  route_prefix: string
  module_type: string
  audience: MarketplaceAudience[]
  icon_key: string | null
  navigation_group: string | null
  navigation_order: number
  status: MarketplaceModuleStatus
  enabled: boolean
  required_permissions: string[]
  required_dependencies: string[]
  territory_aware: boolean
  tenant_aware: boolean
  locale_aware: boolean
  feature_flag_key: string | null
  health_status: 'healthy' | 'degraded' | 'blocked' | 'unknown'
  owner_role: string | null
  introduced_by_mega_zip: number
  version: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface MarketplaceFeatureFlag {
  id: string
  flag_key: string
  name: string
  description: string | null
  enabled: boolean
  scope_type: 'global' | 'territory' | 'tenant'
  scope_id: string | null
  rollout_rule: Record<string, unknown>
  starts_at: string | null
  expires_at: string | null
  owner_id: string | null
  reason: string | null
  status: 'draft' | 'active' | 'inactive' | 'expired' | 'archived'
  version: number
  created_at: string
  updated_at: string
}

export interface MarketplaceConfiguration {
  id: string
  config_key: string
  label: string
  description: string | null
  value: unknown
  value_type: 'string' | 'number' | 'boolean' | 'json'
  category: string
  editable: boolean
  sensitive: boolean
  territory_id: string | null
  tenant_id: string | null
  locale: string | null
  version: number
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface MarketplaceAuditEvent {
  id: string
  request_id: string
  actor_id: string | null
  actor_role: string | null
  action: string
  object_type: string
  object_id: string | null
  territory_id: string | null
  tenant_id: string | null
  before_value: unknown
  after_value: unknown
  reason: string | null
  result: MarketplaceAuditResult
  severity: 'info' | 'warning' | 'critical'
  source: string
  ip_address: string | null
  device_context: Record<string, unknown>
  created_at: string
}

export interface MarketplaceReadinessCheck {
  id: string
  check_key: string
  name: string
  category: string
  description: string | null
  status: MarketplaceReadinessStatus
  owner_role: string | null
  evidence: Record<string, unknown>
  blocker: string | null
  notes: string | null
  next_action: string | null
  last_verified_at: string | null
  verified_by: string | null
  required_for_release: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ApiSuccess<T> {
  data: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    nextCursor?: string
  }
  requestId: string
}

export interface ApiFailure {
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string[]>
    retryable: boolean
  }
  requestId: string
}
