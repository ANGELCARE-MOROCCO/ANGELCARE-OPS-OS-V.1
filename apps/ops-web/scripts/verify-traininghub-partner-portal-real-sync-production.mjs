import fs from 'node:fs'

const files = {
  auth: 'lib/traininghub/auth.ts',
  types: 'lib/traininghub/types.ts',
  sync: 'lib/traininghub/partner-portal-sync.ts',
  page: 'app/traininghub/partner/page.tsx',
  summaryApi: 'app/api/traininghub/partner/business-summary/route.ts',
  requestsApi: 'app/api/traininghub/partner/requests/route.ts',
  scopeHealthApi: 'app/api/traininghub/partner/scope-health/route.ts',
  workspace: 'components/traininghub/TrainingHubPartnerPortalWorkspace.tsx',
  blueprint: 'components/traininghub/TrainingHubPartnerBlueprintPortal.tsx',
}

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''

const content = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]))

const checks = [
  ['auth context uses profile/auth fallback', content.auth.includes("core_user_profiles") && content.auth.includes("ilike('email'") && content.auth.includes("eq('user_id', authUser.id)")],
  ['auth context uses membership auth/profile fallback', content.auth.includes("eq('profile_id', profileId)") && content.auth.includes("eq('auth_user_id', authUserId)")],
  ['auth context returns primary organization fields', content.auth.includes('organization: primaryOrganization') && content.auth.includes('organization_id: primaryOrganization?.id')],
  ['types include profile bridge columns', content.types.includes('organization_id?: string | null') && content.types.includes('access_status?: string | null')],
  ['partner sync helper exists', fs.existsSync(files.sync) && content.sync.includes('buildTrainingHubPartnerPortalSummary')],
  ['partner sync resolves context organizationIds', content.sync.includes('context.organizationIds') && content.sync.includes('resolveTrainingHubPartnerOrganizationScope')],
  ['business summary API uses shared real sync', content.summaryApi.includes('buildTrainingHubPartnerPortalSummary')],
  ['requests API uses shared real scope', content.requestsApi.includes('resolveTrainingHubPartnerOrganizationScope') && content.requestsApi.includes('listTrainingHubPartnerRequests')],
  ['scope health uses shared real scope', content.scopeHealthApi.includes('resolveTrainingHubPartnerOrganizationScope')],
  ['partner page passes SSR summary', content.page.includes('initialSummary={summary}') && content.page.includes('listTrainingHubPartnerRequests')],
  ['workspace forwards initial data', content.workspace.includes('initialData={initialSummary') && content.workspace.includes('initialRequests={initialRequests}')],
  ['blueprint accepts initial data', content.blueprint.includes('TrainingHubPartnerBlueprintPortalProps') && content.blueprint.includes('useState<PortalSummary | null>(initialData)')],
  ['blueprint does not block on live API when initial exists', content.blueprint.includes('Portail affiché depuis le dernier état serveur')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner portal real sync production verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner portal real sync production verification PASSED.')
