import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const now = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
const email = `traininghub-smoke-${now}@example.com`
const partnerName = `SMOKE TrainingHub Partner ${now}`

async function insertFirst(table, payloads) {
  let lastError = null
  for (const payload of payloads) {
    const { data, error } = await supabase.from(table).insert(payload).select('*').maybeSingle()
    if (!error && data) return data
    lastError = error
  }
  throw lastError || new Error(`Insert failed: ${table}`)
}

console.log('Creating smoke partner dossier...')

const org = await insertFirst('core_organizations', [
  {
    name: partnerName,
    legal_name: partnerName,
    organization_type: 'partner_school',
    status: 'active',
    city: 'Rabat',
    primary_contact_email: email,
    billing_email: email,
    metadata: { source: 'smoke_traininghub_partner_lifecycle' },
  },
  {
    name: partnerName,
    organization_type: 'partner_school',
    status: 'active',
    metadata: { city: 'Rabat', source: 'smoke_traininghub_partner_lifecycle' },
  },
  { name: partnerName, organization_type: 'partner_school', status: 'active' },
])

const account = await insertFirst('bill_accounts', [
  {
    organization_id: org.id,
    status: 'active',
    currency_code: 'MAD',
    account_name: 'Smoke Partner Account',
    metadata: { source: 'smoke_traininghub_partner_lifecycle' },
  },
  {
    organization_id: org.id,
    status: 'active',
    currency_code: 'MAD',
    metadata: { account_name: 'Smoke Partner Account', source: 'smoke_traininghub_partner_lifecycle' },
  },
  { organization_id: org.id, status: 'active' },
])

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password: `AC-Smoke-${now}!`,
  email_confirm: true,
  user_metadata: { full_name: 'Smoke Partner Owner', source: 'smoke_traininghub_partner_lifecycle' },
})

if (authError || !authData?.user?.id) throw authError || new Error('Auth user not created')

const profile = await insertFirst('core_user_profiles', [
  {
    id: authData.user.id,
    auth_user_id: authData.user.id,
    full_name: 'Smoke Partner Owner',
    email,
    job_title: 'Direction partenaire',
    status: 'active',
    preferred_language: 'fr',
    metadata: { source: 'smoke_traininghub_partner_lifecycle' },
  },
  {
    auth_user_id: authData.user.id,
    full_name: 'Smoke Partner Owner',
    email,
    status: 'active',
  },
])

const membership = await insertFirst('core_memberships', [
  {
    user_id: profile.id,
    organization_id: org.id,
    membership_type: 'partner_user',
    status: 'active',
  },
])

console.log('Smoke partner created:')
console.table([{ organization: org.id, account: account.id, authUser: authData.user.id, profile: profile.id, membership: membership.id, email }])
console.log('Manual next step: log in as the smoke user and verify /traininghub/partner only shows this partner scope.')
