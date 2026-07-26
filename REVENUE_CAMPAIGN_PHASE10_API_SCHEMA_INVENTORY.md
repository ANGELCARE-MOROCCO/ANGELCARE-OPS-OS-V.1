# Revenue Campaign Phase 10 — API and Schema Inventory

## Protected API routes (25)

- `app/api/revenue-command-center/campaign-enterprise/approvals/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/attribution/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/audience/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/calls/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/campaigns/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/conflicts/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/conversions/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/costs/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/dispatch/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/eligibility/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/enrollments/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/evidence/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/experiments/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/launch/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/lifecycle/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/performance/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/portfolio/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/provider-events/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/readiness/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/recovery/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/replies/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/segments/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/sequences/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/suppressions/route.ts`
- `app/api/revenue-command-center/campaign-enterprise/templates/route.ts`

## Additive support tables (34)

- `public.revenue_campaign_segments`
- `public.revenue_campaign_segment_versions`
- `public.revenue_campaign_audience_snapshots`
- `public.revenue_campaign_audience_members`
- `public.revenue_campaign_recipient_eligibility`
- `public.revenue_campaign_recipients`
- `public.revenue_campaign_suppressions`
- `public.revenue_campaign_frequency_decisions`
- `public.revenue_campaign_sequences`
- `public.revenue_campaign_sequence_versions`
- `public.revenue_campaign_templates`
- `public.revenue_campaign_template_versions`
- `public.revenue_campaign_sequence_steps`
- `public.revenue_campaign_sequence_branches`
- `public.revenue_campaign_enrollments`
- `public.revenue_campaign_step_executions`
- `public.revenue_campaign_dispatch_attempts`
- `public.revenue_campaign_replies`
- `public.revenue_campaign_sdr_assignments`
- `public.revenue_campaign_provider_readiness`
- `public.revenue_campaign_sender_readiness`
- `public.revenue_campaign_approvals`
- `public.revenue_campaign_risks`
- `public.revenue_campaign_evidence`
- `public.revenue_campaign_status_history`
- `public.revenue_campaign_conversion_events`
- `public.revenue_campaign_attributions`
- `public.revenue_campaign_attribution_conflicts`
- `public.revenue_campaign_costs`
- `public.revenue_campaign_performance_periods`
- `public.revenue_campaign_experiments`
- `public.revenue_campaign_experiment_variants`
- `public.revenue_campaign_recovery_plans`
- `public.revenue_campaign_recovery_checkpoints`

## Atomic/security functions and triggers (15)

- `public.revenue_campaign_touch_updated_at_v10`
- `public.revenue_campaign_approved_asset_immutable_v10`
- `public.revenue_campaign_closed_period_immutable_v10`
- `public.revenue_evaluate_campaign_recipient`
- `public.revenue_freeze_campaign_audience`
- `public.revenue_enroll_campaign_recipient`
- `public.revenue_approve_campaign_sequence`
- `public.revenue_evaluate_campaign_readiness`
- `public.revenue_launch_campaign`
- `public.revenue_dispatch_campaign_step`
- `public.revenue_record_campaign_provider_event`
- `public.revenue_process_campaign_reply`
- `public.revenue_create_campaign_attribution`
- `public.revenue_close_campaign_performance_period`
- `public.revenue_campaign_realization_reversal_v10`

## Canonical reuse

- `public.revenue_campaigns` — campaign identity and lifecycle.
- `public.revenue_communication_threads` and `public.revenue_communication_events` — communication authority.
- `public.revenue_communication_delivery_events` — provider event authority.
- Existing prospects, accounts, contacts, appointments, opportunities, proposals, contracts, payment confirmations and realization events — conversion and financial authority.
- `public.email_os_sender_identities` — read-only sender identity bridge where available.
