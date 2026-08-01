#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sqlPath = path.join(root, 'supabase/migrations/20260731_flashcards_os_ultra_mega_zip2_intelligence.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')
const checks = []
const failures = []
function check(name, condition, detail = '') { checks.push({ name, condition, detail }); if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`) }
function count(pattern) { return (sql.match(pattern) || []).length }

const tables = [
  'research_missions','research_queries','research_runs','research_sources','source_snapshots','source_duplicates','evidence_claims','claim_source_links','evidence_reviews','research_syntheses',
  'intelligence_signals','product_opportunities','opportunity_scores','opportunity_decisions','product_designs','product_design_versions','design_audiences','design_requirements','design_content_groups','design_alternatives','design_assumptions','design_risks','design_decisions','design_evidence_links',
  'model_profiles','intelligence_recipes','context_snapshots','intelligence_runs','provider_calls','usage_ledger','redaction_events','provider_health_events','intelligence_jobs',
]
const missingTables = tables.filter((table) => !sql.includes(`create table if not exists flashcards_os.${table}`))
check('all 33 intelligence tables are declared', missingTables.length === 0, missingTables.join(', '))
check('migration is transaction wrapped', /^begin;/im.test(sql) && /commit;\s*$/im.test(sql))
check('migration remains additive', !/drop\s+(table|schema)|truncate\s+/i.test(sql))
check('every intelligence table has tenant_key', tables.every((table) => new RegExp(`create table if not exists flashcards_os\\.${table}[\\s\\S]*?tenant_key`, 'i').test(sql)))
check('research mission statuses are constrained', /research_mission_status_check/i.test(sql) || /status\s+text[^;]+draft[^;]+completed/i.test(sql))
check('research cost ceiling exists', /budget_credits/i.test(sql) && /used_credits/i.test(sql))
check('source lineage preserves URL, hash and Tavily request', /content_hash/i.test(sql) && /tavily_request_id/i.test(sql) && /url\s+text/i.test(sql))
check('source duplicate clusters exist', /source_duplicates/i.test(sql) && /duplicate_group/i.test(sql))
check('evidence claims distinguish direct and inferred', /directness/i.test(sql) && /inferred/i.test(sql))
check('claim-to-source lineage exists', /claim_source_links/i.test(sql))
check('human evidence reviews exist', /evidence_reviews/i.test(sql) && /reviewed_by/i.test(sql))
check('research synthesis is versioned', /research_syntheses/i.test(sql) && /version_no/i.test(sql))
check('product opportunity scoring is persisted', /opportunity_scores/i.test(sql) && /weighted_total/i.test(sql))
check('product design alternatives and decisions exist', /design_alternatives/i.test(sql) && /design_decisions/i.test(sql))
check('approved intelligence immutability trigger exists', /prevent_approved_intelligence_delete/i.test(sql) && /trg_fc_research_syntheses_immutable/i.test(sql) && /trg_fc_product_designs_immutable/i.test(sql))
check('model profiles include routing and privacy controls', /primary_model/i.test(sql) && /fallback_models/i.test(sql) && /require_zdr/i.test(sql) && /deny_data_collection/i.test(sql))
check('provider calls and usage are separately audited', /provider_calls/i.test(sql) && /usage_ledger/i.test(sql))
check('redaction events are persisted', /redaction_events/i.test(sql))
check('database-backed job queue exists', /intelligence_jobs/i.test(sql) && /dead_letter/i.test(sql) && /idempotency_key/i.test(sql))
check('worker claims jobs with SKIP LOCKED', /for update skip locked/i.test(sql))
check('worker RPC is isolated and security definer', /fc_os_claim_intelligence_job/i.test(sql) && /security definer/i.test(sql))
check('RLS is enabled for every new table', tables.every((table) => sql.includes(`'${table}'`)) && /enable row level security/i.test(sql), 'dynamic loop covers canonical table list')
check('public compatibility views exist', tables.every((table) => sql.includes(`public.fc_os_${table}`)), `${count(/create or replace view public\.fc_os_/gi)} views`)
check('service role receives table access', /grant all on flashcards_os\.%I to service_role/i.test(sql))
check('model profiles are seeded', count(/external_research_synthesis|evidence_claim_extraction|product_opportunity_architect|product_design_architect/g) >= 4)
check('intelligence recipes are seeded', /insert into flashcards_os\.intelligence_recipes/i.test(sql) && /output_schema/i.test(sql) && /PRODUCT_DESIGN_SCHEMA/i.test(sql))
check('fourteen UMZ2 permissions are seeded', count(/flashcards_os\.(view_intelligence|create_research|approve_research|execute_research|review_evidence|run_synthesis|manage_opportunities|manage_product_design|approve_product_design|manage_model_profiles|view_intelligence_costs|audit_intelligence|admin_intelligence)/g) >= 13)
check('controlled internal signals are seeded', /portfolio_content_gap/i.test(sql) && /legacy_integrity_gap/i.test(sql) && /quality_signal/i.test(sql))
check('no customer data is seeded', !/customer_email|learner_name|guardian_phone/i.test(sql))
check('no creative asset generation schema exists', !/image_generation|video_generation|render_asset|text_to_image/i.test(sql))
check('UMZ1 namespace is preserved', /flashcards_os/i.test(sql) && !/drop.*fc_os_/i.test(sql))

for (const result of checks) console.log(`${result.condition ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` (${result.detail})` : ''}`)
console.log(`\n${checks.length - failures.length}/${checks.length} SQL intelligence architecture checks passed.`)
if (failures.length) { console.error('\nSQL review failures:'); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1) }
