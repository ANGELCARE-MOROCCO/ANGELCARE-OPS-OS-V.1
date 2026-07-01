# AngelCare 360 — Phase 1 Foundation

Document ref: `AC360-PH1-FOUNDATION-2026-06-30`

This patch installs the production foundation for the AngelCare 360 kindergarten/school SaaS model. It is strictly aligned with the 12-master-system / 52-engine architecture and focuses on the Phase 1 backbone: multi-tenant organizations, RBAC, billing, entitlements, usage metering, credits, account restrictions, audit logs and lifecycle governance.

## What this phase adds

### Database-first foundation

Migration:

```bash
supabase/migrations/20260630_ac360_phase1_foundation.sql
```

It creates the AC360 core tables:

- `ac360_organizations`, `ac360_campuses`, `ac360_legal_profiles`, `ac360_academic_years`
- `ac360_user_memberships`, `ac360_roles`, `ac360_permissions`, `ac360_role_permissions`, `ac360_user_role_assignments`
- `ac360_foundation_engines`, `ac360_feature_registry`, `ac360_action_registry`
- `ac360_plans`, `ac360_plan_versions`, `ac360_plan_entitlements`
- `ac360_addons`, `ac360_addon_entitlements`, `ac360_serenite_bundles`, `ac360_professional_services_catalog`
- `ac360_subscriptions`, `ac360_subscription_items`, `ac360_quotes`, `ac360_contracts`
- `ac360_invoices`, `ac360_invoice_lines`, `ac360_payments`
- `ac360_usage_meters`, `ac360_usage_events`, `ac360_usage_summaries`
- `ac360_credit_wallets`, `ac360_credit_ledger`, `ac360_capacity_snapshots`
- `ac360_trials`, `ac360_grace_periods`, `ac360_restriction_rules`, `ac360_restrictions`, `ac360_recommendations`, `ac360_automation_rules`
- `ac360_audit_logs`

### Engine registry

The migration seeds the full 52-engine master map. Phase 1 implements the backbone engines `AC360-ENG-01` to `AC360-ENG-44`. Phase 2 operation engines `AC360-ENG-45` to `AC360-ENG-52` are registered as planned so the build does not drift.

### Packages seeded in MAD

- `AngelCare 360 Start`: 790 MAD/month, 7,900 MAD/year, 60 students, 5 staff, 1 campus, 5 GB, 300 credits.
- `AngelCare 360 Pro`: 1,490 MAD/month, 14,900 MAD/year, 150 students, 15 staff, 1 campus, 25 GB, 1,500 credits.
- `AngelCare 360 Command`: 2,900 MAD/month, 29,000 MAD/year, 350 students, 35 staff, 2 campuses, 75 GB, 5,000 credits.

### Growth Menu add-ons seeded

Includes capacity packs, Advanced Admissions CRM, Finance Power, Communication Power, Workflow Builder, ParentTrust, HR & Staffing, Academy Training, Transport, AI Assistant, White Label Branding, Custom Domain, API/Webhooks, Enterprise Security and AngelCare Credits packs.

### Sérénité bundles seeded

- `Sérénité Essential`: 690 MAD/month
- `Sérénité Plus`: 1,490 MAD/month
- `Sérénité Premium`: 2,900 MAD/month

### Critical RPCs

- `ac360_has_feature(org_id, feature_key, action_key, quantity)` checks subscription, restrictions, plan entitlements and active add-ons.
- `ac360_record_usage(...)` records usage events, updates usage summaries and writes audit logs.
- `ac360_record_audit(...)` centralizes audit logging.

## App routes added

- `/angelcare-360/foundation` — internal AC360 Phase 1 command page.
- `/api/ac360/foundation` — returns readiness, counts, engines, packages, add-ons, meters and rules.
- `/api/ac360/entitlements/evaluate` — evaluates whether an organization can use a feature/action.
- `/api/ac360/usage/record` — records billable usage.
- `/api/ac360/restrictions` — returns active restrictions.

## Technical rule for future modules

Every serious action should follow this gate:

```text
Check organization status
↓
Check active subscription
↓
Check entitlement
↓
Check capacity / usage / credits
↓
Allow or block
↓
Execute action
↓
Record usage event
↓
Update meter / wallet / invoice
↓
Trigger alert / recommendation / restriction
↓
Write audit log
```

## Apply instructions

From the app root:

```bash
supabase db push
node scripts/verify-ac360-phase1-foundation.mjs
```

Then open:

```text
/angelcare-360/foundation
```

## Important

This patch does not yet migrate existing legacy school/operations records into AC360 organizations. It creates the production backbone that those modules must progressively call through `evaluateAc360Access()` and `recordAc360UsageEvent()`.
