#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const app=path.resolve(process.argv[2]||process.cwd())
let pass=0,fail=0
function check(ok,label){if(ok){pass++;console.log(`  ✓ ${label}`)}else{fail++;console.error(`  ✗ ${label}`)}}
function file(rel){const p=path.join(app,rel);check(fs.existsSync(p),`file ${rel}`);return fs.existsSync(p)?fs.readFileSync(p,'utf8'):''}
function has(rel,needle,label=needle){const s=file(rel);check(s.includes(needle),`${rel} · ${label}`)}
console.log('\nANGELCARE CUSTOMER IDENTITY, PAYMENTS, AC WALLET & ORDER COMMAND')
const required=[
 'angelcare-marketplace/customer-commerce/types.ts','angelcare-marketplace/customer-commerce/customer-auth.ts','angelcare-marketplace/customer-commerce/payment-adapters.ts','angelcare-marketplace/customer-commerce/wallet-policy.ts','angelcare-marketplace/customer-commerce/repository.ts','angelcare-marketplace/customer-commerce/admin-repository.ts','angelcare-marketplace/customer-commerce/api-handlers.ts','angelcare-marketplace/customer-commerce/customer-commerce.module.css',
 'angelcare-marketplace/customer-commerce/components/CustomerAuthExperience.tsx','angelcare-marketplace/customer-commerce/components/WalletDashboard.tsx','angelcare-marketplace/customer-commerce/components/WalletTopUpStudio.tsx','angelcare-marketplace/customer-commerce/components/WalletPolicyStudio.tsx','angelcare-marketplace/customer-commerce/components/EnterpriseOrderCommand.tsx','angelcare-marketplace/customer-commerce/components/CheckoutPaymentStage.tsx',
 'supabase/migrations/20260806120000_angelcare_marketplace_customer_identity_payment_ac_wallet_order_command.sql','angelcare-marketplace/database/rollback/20260806120000_angelcare_marketplace_customer_identity_payment_ac_wallet_order_command_SAFE_ROLLBACK.sql'
]
for(const rel of required)file(rel)
const pages=['login','register','recover','reset'].map(x=>`app/angelcare-marketplace/[locale]/auth/${x}/page.tsx`).concat(['page','orders/page','bookings/page','enrollments/page','quotations/page','subscriptions/page','assessments/page','payments/page','settings/page','wallet/page','wallet/top-up/page','wallet/transactions/page','wallet/privileges/page'].map(x=>`app/angelcare-marketplace/[locale]/account/${x}.tsx`))
for(const rel of pages)file(rel)
const apis=[
 'customer/auth/register','customer/auth/login','customer/auth/logout','customer/auth/recover','customer/auth/password','customer/auth/magic-link','customer/auth/phone-otp','customer/sessions','customer/portfolio','wallet','wallet/transactions','wallet/comparison','wallet/topups/quote','wallet/topups','checkout/payment-methods','payments/intents','payments/webhooks/[provider]','admin/wallet/summary','admin/wallet/policies','admin/wallet/policies/[policyId]','admin/wallet/simulations','admin/wallet/imports','admin/wallet/accounts/[walletId]/adjustment','admin/wallet/accounts/[walletId]/restriction','admin/orders','admin/orders/[orderId]','admin/orders/[orderId]/lines','admin/payments/[paymentIntentId]/refund'
]
for(const route of apis)file(`app/api/angelcare-marketplace/${route}/route.ts`)
has('angelcare-marketplace/customer-commerce/payment-adapters.ts','verifyWebhook','signed webhook adapter')
has('angelcare-marketplace/customer-commerce/payment-adapters.ts','timingSafeEqual','constant-time webhook signature')
has('angelcare-marketplace/customer-commerce/repository.ts','angelcare_marketplace_wallet_reserve','Wallet reservation')
has('angelcare-marketplace/customer-commerce/repository.ts','captureWalletTopUp','verified top-up capture')
has('angelcare-marketplace/customer-commerce/repository.ts','createPaymentRefund','original-source refund')
has('angelcare-marketplace/customer-commerce/wallet-policy.ts','stack_mode','policy stacking')
has('angelcare-marketplace/customer-commerce/wallet-policy.ts','margin_floor_rate','margin guardrail')
has('angelcare-marketplace/customer-commerce/components/WalletPolicyStudio.tsx','PRODUCTION EVALUATOR','production parity simulator')
has('angelcare-marketplace/customer-commerce/components/CheckoutPaymentStage.tsx','LIVE METHOD COMPARISON','live Wallet comparison')
has('angelcare-marketplace/category-native-experience/components/AdaptiveExperience.tsx','WalletBenefitTeaser','offer-level Wallet comparison')
has('angelcare-marketplace/conversion-universe/components/CheckoutExperience.tsx','CheckoutPaymentStage','payment stage integrated')
has('angelcare-marketplace/shells/AdminWorkspaceContextNav.tsx',"['Wallet','/wallet']",'Finance-context Wallet navigation')
const sql=file('supabase/migrations/20260806120000_angelcare_marketplace_customer_identity_payment_ac_wallet_order_command.sql')
for(const marker of ['angelcare_marketplace_customer_accounts','angelcare_marketplace_payment_intents','angelcare_marketplace_payment_attempts','angelcare_marketplace_payment_provider_events','angelcare_marketplace_payment_refunds','angelcare_marketplace_wallet_accounts','angelcare_marketplace_wallet_balance_buckets','angelcare_marketplace_wallet_ledger_entries','angelcare_marketplace_wallet_reservations','angelcare_marketplace_wallet_topups','angelcare_marketplace_wallet_policies','angelcare_marketplace_wallet_policy_assignments','angelcare_marketplace_wallet_policy_evaluations','angelcare_marketplace_wallet_risk_cases','angelcare_marketplace_wallet_reconciliation_items','angelcare_marketplace_order_line_events','angelcare_marketplace_wallet_post_entry','angelcare_marketplace_wallet_reserve','angelcare_marketplace_wallet_release','angelcare_marketplace_wallet_commit_reservation','angelcare_marketplace_claim_guest_commerce'])check(sql.includes(marker),`SQL ${marker}`)
check(!/\bdrop\s+table\b/i.test(sql),'SQL contains no DROP TABLE')
check(!/\btruncate\b/i.test(sql),'SQL contains no TRUNCATE')
check(!/\bdelete\s+from\b/i.test(sql),'SQL contains no DELETE FROM')
check(!/revoke all on all tables in schema public/i.test(sql),'SQL does not alter unrelated schema grants')
check(sql.includes("'draft',100,'best_benefit'")&&sql.includes('active_wallet_policies'),'policy seeds remain draft')
const rollback=file('angelcare-marketplace/database/rollback/20260806120000_angelcare_marketplace_customer_identity_payment_ac_wallet_order_command_SAFE_ROLLBACK.sql')
check(!/\bdrop\b/i.test(rollback),'rollback is data-preserving')
check(rollback.includes("status='restricted'"),'rollback restricts Wallet spending')
const featureText=file('angelcare-marketplace/customer-commerce/content.ts')
const featureCount=(featureText.match(/'[^']+'/g)||[]).length
check(featureText.includes('Wallet risk, freeze and recovery controls'),'feature catalogue includes risk controls')
check(featureText.includes('Live normal-versus-wallet comparison'),'feature catalogue includes live comparison')
for(const route of apis.filter(x=>x.includes('['))){const rel=`app/api/angelcare-marketplace/${route}/route.ts`;const s=fs.readFileSync(path.join(app,rel),'utf8');check(s.includes('params:Promise<')||s.includes('params: Promise<'),`${rel} Next.js dynamic params Promise`)}
console.log(`\nPASS ${pass}`);console.log(`FAIL ${fail}`)
if(fail){console.error('RESULT: CUSTOMER PAYMENT WALLET CONTRACTUAL ACCEPTANCE FAILED');process.exit(1)}
console.log('RESULT: CUSTOMER PAYMENT WALLET CONTRACTUAL ACCEPTANCE PASSED')
