import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(file = '.env.local') {
  if (!fs.existsSync(file)) return
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    if (!process.env[key]) process.env[key] = rest.join('=').replace(/^['"]|['"]$/g, '')
  }
}

loadEnv()

const args = process.argv.slice(2)
const has = (name) => args.includes(name)
const getArg = (name, fallback = '') => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const execute = has('--execute') && has('--yes')
const orgId = getArg('--org-id', process.env.PARTNER_ORG_ID || '').trim()
const planName = getArg('--plan', 'Activation annuelle TrainingHub')
const amountMinor = Number(getArg('--amount-minor', '720000')) || 720000
const credits = Number(getArg('--credits', '10')) || 10
const currency = getArg('--currency', 'MAD')
const createSession = !has('--no-session')

if (!execute || !orgId) {
  console.log('Usage:')
  console.log('  node --env-file=.env.local scripts/traininghub-bootstrap-partner-portal-records.mjs --org-id ORG_ID --execute --yes')
  console.log('')
  console.log('Options:')
  console.log('  --plan "Activation annuelle TrainingHub"')
  console.log('  --amount-minor 720000')
  console.log('  --credits 10')
  console.log('  --currency MAD')
  console.log('  --no-session')
  process.exit(execute ? 1 : 0)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

function nowIso() {
  return new Date().toISOString()
}

function clean(value, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function code(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

function parseDbError(error) {
  const msg = String(error?.message || error || '')
  return (
    msg.match(/Could not find the '([^']+)' column/i)?.[1] ||
    msg.match(/column [^.\s]+\.([a-zA-Z0-9_]+) does not exist/i)?.[1] ||
    msg.match(/null value in column "([^"]+)"/i)?.[1] ||
    ''
  )
}

async function adaptiveInsert(table, payload) {
  let row = JSON.parse(JSON.stringify(payload || {}))
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const { data, error } = await supabase.from(table).insert(row).select('*').maybeSingle()
    if (!error) return { table, ok: true, action: 'insert', data }
    const col = parseDbError(error)
    if (col && col in row) {
      delete row[col]
      continue
    }
    return { table, ok: false, action: 'insert', error: error.message, payload: row }
  }
  return { table, ok: false, action: 'insert', error: 'adaptive insert failed' }
}

async function selectByOrg(table, limit = 20) {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('organization_id', orgId).limit(limit)
    if (error) return []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function main() {
  const { data: org, error: orgError } = await supabase.from('core_organizations').select('*').eq('id', orgId).maybeSingle()
  if (orgError || !org) {
    console.error('Organization not found:', orgError?.message || orgId)
    process.exit(1)
  }

  const orgName = clean(org.name || org.legal_name || org.display_name, 'Partenaire TrainingHub')
  const contact = org.metadata?.contact || org.metadata?.partner || {}

  const existing = {
    accounts: await selectByOrg('bill_accounts', 5),
    proposals: await selectByOrg('bill_proposals', 10),
    subscriptions: await selectByOrg('bill_subscriptions', 5),
    credits: await selectByOrg('bill_training_credits', 10),
    sessions: await selectByOrg('trn_sessions', 10),
    documents: await selectByOrg('partner_documents', 10),
  }

  const results = []
  let account = existing.accounts[0] || null
  let proposal = existing.proposals[0] || null

  if (!account) {
    const accountResult = await adaptiveInsert('bill_accounts', {
      organization_id: orgId,
      partner_id: orgId,
      account_number: code('TH-ACC'),
      account_name: orgName,
      status: 'active',
      account_type: 'partner_training_account',
      currency,
      billing_email: clean(contact.email || org.billing_email || org.primary_contact_email),
      billing_phone: clean(contact.phone || org.phone),
      payment_terms: 'manual_agreement',
      invoice_policy: 'manual_review_before_issue',
      owner_name: clean(org.owner_name || org.account_owner, 'AngelCare'),
      metadata: {
        source: 'traininghub_bootstrap_partner_portal_records',
        monetization_model: 'account_subscription_no_commission',
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    results.push(accountResult)
    account = accountResult.data || null
  }

  if (!proposal) {
    const proposalResult = await adaptiveInsert('bill_proposals', {
      organization_id: orgId,
      partner_id: orgId,
      account_id: account?.id || null,
      proposal_number: code('TH-OFFRE'),
      title: planName,
      status: 'sent',
      currency,
      subtotal_minor: amountMinor,
      total_minor: amountMinor,
      grand_total_minor: amountMinor,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      metadata: {
        source: 'traininghub_bootstrap_partner_portal_records',
        package_type: 'annual_partner_subscription',
        participants: credits,
        services: ['training_activation_pack', 'credit_wallet', 'refresh_readiness', 'proof_kit'],
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    results.push(proposalResult)
    proposal = proposalResult.data || null
  }

  if (!existing.subscriptions.length) {
    results.push(await adaptiveInsert('bill_subscriptions', {
      organization_id: orgId,
      partner_id: orgId,
      account_id: account?.id || null,
      subscription_number: code('TH-SUB'),
      plan_name: planName,
      status: 'active',
      billing_period: 'annual',
      currency,
      amount_minor: amountMinor,
      starts_at: nowIso(),
      renewal_policy: 'manual_review_30_days_before_end',
      metadata: {
        source: 'traininghub_bootstrap_partner_portal_records',
        model: 'account_subscription',
        commission_per_sale: false,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }))
  }

  if (!existing.credits.length) {
    results.push(await adaptiveInsert('bill_training_credits', {
      organization_id: orgId,
      partner_id: orgId,
      proposal_id: proposal?.id || null,
      credit_type: 'training_course',
      source_type: 'partner_subscription',
      status: 'available',
      quantity_total: credits,
      quantity_available: credits,
      quantity_remaining: credits,
      quantity_used: 0,
      amount_minor: amountMinor,
      currency,
      metadata: {
        source: 'traininghub_bootstrap_partner_portal_records',
        credit_policy: 'annual_partner_training_wallet',
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }))
  }

  if (createSession && !existing.sessions.length) {
    const start = new Date(Date.now() + 7 * 86400000).toISOString()
    const end = new Date(Date.now() + 7 * 86400000 + 3 * 3600000).toISOString()
    results.push(await adaptiveInsert('trn_sessions', {
      organization_id: orgId,
      partner_id: orgId,
      session_code: code('TH-SESS'),
      title: 'Session TrainingHub de lancement',
      status: 'planned',
      mode: 'onsite',
      delivery_mode: 'onsite',
      location: clean(org.city || org.metadata?.partner?.city, 'Site partenaire'),
      city: clean(org.city || org.metadata?.partner?.city, 'Site partenaire'),
      scheduled_start_at: start,
      scheduled_end_at: end,
      max_participants: credits,
      planned_participant_count: credits,
      checklist_template: 'standard_training_delivery',
      metadata: {
        source: 'traininghub_bootstrap_partner_portal_records',
        onboarding_session: true,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }))
  }

  if (!existing.documents.length) {
    for (const kit of ['starter_kit', 'partner_welcome_pack', 'proof_readiness_pack']) {
      results.push(await adaptiveInsert('partner_documents', {
        organization_id: orgId,
        document_type: kit,
        title: kit.replace(/_/g, ' '),
        status: 'published',
        published_at: nowIso(),
        metadata: {
          source: 'traininghub_bootstrap_partner_portal_records',
          visibility: 'partner_portal',
        },
        created_at: nowIso(),
        updated_at: nowIso(),
      }))
    }
  }

  console.log(`\nTrainingHub partner portal bootstrap for ${orgName}`)
  console.table(results.map((result) => ({
    table: result.table,
    action: result.action,
    ok: result.ok,
    id: result.data?.id || '',
    error: result.error || '',
  })))

  fs.mkdirSync('tmp', { recursive: true })
  fs.writeFileSync('tmp/traininghub-bootstrap-partner-portal-records-report.json', JSON.stringify({
    orgId,
    orgName,
    existingCounts: Object.fromEntries(Object.entries(existing).map(([key, rows]) => [key, rows.length])),
    results,
  }, null, 2))

  if (results.some((result) => !result.ok)) {
    console.error('\nSome bootstrap writes failed. Check tmp/traininghub-bootstrap-partner-portal-records-report.json')
    process.exit(1)
  }

  console.log('\n✅ Partner portal commercial/training/proof records are available or already existed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
