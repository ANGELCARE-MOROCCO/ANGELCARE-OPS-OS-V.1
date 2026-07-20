# ANGELCARE Revenue Command Browser OS — B2B Partnerships Capability Contract V1

**Status:** Signed and approved  
**Version:** 1.0.0  
**Mandatory capability count:** 45  
**Reduction policy:** No capability may be silently removed, flattened into a generic task, or declared complete without UI, command, permission, audit, test, and acceptance coverage.

## Runtime doctrine

The browser extension is a private manually installed Manifest V3 application. It starts as a minimal secure shell, pairs to AngelCare as a registered device, requests the current user's manually assigned module and capability manifest, and lazy-loads only authorized modules, adapters, commands, scopes, and autonomy rules. Server-side permission validation remains authoritative for every mutation.

## Delivery contract

Mega ZIP 1 provides the secure runtime, device pairing, gateway, access administration, dynamic capability bootstrap, audit foundation, and machine-readable registry. Later cumulative ZIPs implement the remaining domain workflows against this unchanged registry.

## Canonical capability register

| ID | Capability | Delivery | Permission | Command contract | ZIP 1 state |
|---|---|---:|---|---|---|
| B2B-001 | Browser Context Understanding | ZIP 1 | `extension.b2b.browser_context_understanding` | `b2b.context.resolve` | foundation |
| B2B-002 | Organization Identity Resolution | ZIP 2 | `extension.b2b.organization_identity_resolution` | `b2b.account.recognize` | registered |
| B2B-003 | Prospect Capture | ZIP 2 | `extension.b2b.prospect_capture` | `b2b.prospect.create` | registered |
| B2B-004 | Account Enrichment | ZIP 2 | `extension.b2b.account_enrichment` | `b2b.prospect.enrich` | registered |
| B2B-005 | Vertical-Specific Intelligence | ZIP 2 | `extension.b2b.vertical_specific_intelligence` | `b2b.intelligence.vertical.evaluate` | registered |
| B2B-006 | Account Scoring | ZIP 2 | `extension.b2b.account_scoring` | `b2b.account.score` | registered |
| B2B-007 | Account Plan Builder | ZIP 2 | `extension.b2b.account_plan_builder` | `b2b.account_plan.create` | registered |
| B2B-008 | Contact Capture and Management | ZIP 2 | `extension.b2b.contact_capture_management` | `b2b.contact.create, b2b.contact.update` | registered |
| B2B-009 | Decision-Maker Research Missions | ZIP 2 | `extension.b2b.decision_maker_research` | `b2b.decision_maker.research` | registered |
| B2B-010 | Opportunity Creation | ZIP 3 | `extension.b2b.opportunity_creation` | `b2b.opportunity.create` | registered |
| B2B-011 | Intelligent Pipeline Management | ZIP 3 | `extension.b2b.intelligent_pipeline_management` | `b2b.pipeline.advance` | registered |
| B2B-012 | Outreach Strategy Builder | ZIP 3 | `extension.b2b.outreach_strategy_builder` | `b2b.outreach.prepare` | registered |
| B2B-013 | Gmail-Assisted Commercial Operations | ZIP 3 | `extension.b2b.gmail_assisted_operations` | `b2b.gmail.thread.resolve` | registered |
| B2B-014 | WhatsApp-Assisted Operations | ZIP 3 | `extension.b2b.whatsapp_assisted_operations` | `b2b.whatsapp.context.resolve` | registered |
| B2B-015 | Call Preparation | ZIP 3 | `extension.b2b.call_preparation` | `b2b.call.prepare` | registered |
| B2B-016 | Field Visit Mode | ZIP 3 | `extension.b2b.field_visit_mode` | `b2b.field_visit.record` | registered |
| B2B-017 | Meeting Preparation | ZIP 3 | `extension.b2b.meeting_preparation` | `b2b.meeting.prepare` | registered |
| B2B-018 | Live Meeting Assistance | ZIP 3 | `extension.b2b.live_meeting_assistance` | `b2b.meeting.assist` | registered |
| B2B-019 | Post-Meeting Conversion | ZIP 3 | `extension.b2b.post_meeting_conversion` | `b2b.meeting.convert` | registered |
| B2B-020 | Proposal Studio | ZIP 4 | `extension.b2b.proposal_studio` | `b2b.proposal.create` | registered |
| B2B-021 | Pricing Model Selection | ZIP 4 | `extension.b2b.pricing_model_selection` | `b2b.pricing.recommend` | registered |
| B2B-022 | Pricing and Margin Protection | ZIP 4 | `extension.b2b.pricing_margin_protection` | `b2b.margin.review, b2b.discount.request` | registered |
| B2B-023 | Negotiation Deal Room | ZIP 4 | `extension.b2b.negotiation_deal_room` | `b2b.negotiation.update` | registered |
| B2B-024 | Objection Intelligence | ZIP 4 | `extension.b2b.objection_intelligence` | `b2b.objection.classify` | registered |
| B2B-025 | Closing Room | ZIP 4 | `extension.b2b.closing_room` | `b2b.closing.evaluate` | registered |
| B2B-026 | Contract and Payment Gates | ZIP 4 | `extension.b2b.contract_payment_gates` | `b2b.gates.evaluate` | registered |
| B2B-027 | Payment-Promise Control | ZIP 4 | `extension.b2b.payment_promise_control` | `b2b.payment_promise.create` | registered |
| B2B-028 | Revenue Rescue | ZIP 4 | `extension.b2b.revenue_rescue` | `b2b.revenue_rescue.create` | registered |
| B2B-029 | Executive Intervention | ZIP 4 | `extension.b2b.executive_intervention` | `b2b.executive_intervention.prepare` | registered |
| B2B-030 | Operational Handoff | ZIP 5 | `extension.b2b.operational_handoff` | `b2b.handoff.create` | registered |
| B2B-031 | Partner Activation | ZIP 5 | `extension.b2b.partner_activation` | `b2b.partner.activate` | registered |
| B2B-032 | Partner Performance | ZIP 5 | `extension.b2b.partner_performance` | `b2b.partner.performance.read` | registered |
| B2B-033 | Upsell and Cross-Sell Intelligence | ZIP 5 | `extension.b2b.upsell_cross_sell` | `b2b.expansion.recommend` | registered |
| B2B-034 | Renewal Management | ZIP 5 | `extension.b2b.renewal_management` | `b2b.renewal.prepare` | registered |
| B2B-035 | Tender and RFP Intelligence | ZIP 5 | `extension.b2b.tender_rfp_intelligence` | `b2b.tender.analyze` | registered |
| B2B-036 | Campaign Association | ZIP 3 | `extension.b2b.campaign_association` | `b2b.campaign.associate` | registered |
| B2B-037 | Referral Source Management | ZIP 3 | `extension.b2b.referral_source_management` | `b2b.referral.capture` | registered |
| B2B-038 | Daily Revenue Command | ZIP 3 | `extension.b2b.daily_revenue_command` | `b2b.daily_command.read` | registered |
| B2B-039 | Manager Control | ZIP 6 | `extension.b2b.manager_control` | `b2b.manager.control` | registered |
| B2B-040 | Staff Execution Quality | ZIP 6 | `extension.b2b.staff_execution_quality` | `b2b.execution_quality.read` | registered |
| B2B-041 | B2B Reporting | ZIP 6 | `extension.b2b.b2b_reporting` | `b2b.reporting.read` | registered |
| B2B-042 | Evidence and Audit | ZIP 1 | `extension.b2b.evidence_audit` | `b2b.audit.read` | foundation |
| B2B-043 | Command Palette | ZIP 6 | `extension.b2b.command_palette` | `b2b.command.execute` | registered |
| B2B-044 | Controlled Automation | ZIP 1 | `extension.b2b.controlled_automation` | `b2b.automation.evaluate` | foundation |
| B2B-045 | Dynamic User-Specific Loading | ZIP 1 | `extension.b2b.dynamic_user_loading` | `extension.capabilities.bootstrap` | foundation |

## Definition of done per capability

A capability is complete only when all of the following exist:

1. An assigned UI surface or contextual command.
2. A browser adapter/context input where applicable.
3. A versioned extension command contract.
4. A hardened Extension Gateway handler.
5. A server-enforced module, capability, data-scope, and autonomy decision.
6. An approval path for controlled actions.
7. A complete immutable audit event.
8. Idempotency for mutations.
9. Failure and revocation behavior.
10. Automated acceptance evidence linked to the capability ID.
