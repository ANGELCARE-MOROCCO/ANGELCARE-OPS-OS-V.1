# B2B 45-Capability Traceability Matrix

This matrix is generated from `packages/browser-extension-contracts/b2b-capabilities.v1.json`. ZIP 1 establishes the permanent identifiers, permissions, commands, audit requirement, delivery wave, and acceptance IDs. Implementation rows are progressively promoted from `registered` to `implemented` by cumulative mega patches.

| Contract | Surface / skill | Extension command(s) | Permission | Gateway status | Audit | Acceptance |
|---|---|---|---|---|---|---|
| B2B-001 | Browser Context Understanding | `b2b.context.resolve` | `extension.b2b.browser_context_understanding` | Foundation active | Required | `B2B-001-A`, `B2B-001-B` |
| B2B-002 | Organization Identity Resolution | `b2b.account.recognize` | `extension.b2b.organization_identity_resolution` | Planned ZIP 2 | Required | `B2B-002-A`, `B2B-002-B` |
| B2B-003 | Prospect Capture | `b2b.prospect.create` | `extension.b2b.prospect_capture` | Planned ZIP 2 | Required | `B2B-003-A`, `B2B-003-B` |
| B2B-004 | Account Enrichment | `b2b.prospect.enrich` | `extension.b2b.account_enrichment` | Planned ZIP 2 | Required | `B2B-004-A`, `B2B-004-B` |
| B2B-005 | Vertical-Specific Intelligence | `b2b.intelligence.vertical.evaluate` | `extension.b2b.vertical_specific_intelligence` | Planned ZIP 2 | Required | `B2B-005-A`, `B2B-005-B` |
| B2B-006 | Account Scoring | `b2b.account.score` | `extension.b2b.account_scoring` | Planned ZIP 2 | Required | `B2B-006-A`, `B2B-006-B` |
| B2B-007 | Account Plan Builder | `b2b.account_plan.create` | `extension.b2b.account_plan_builder` | Planned ZIP 2 | Required | `B2B-007-A`, `B2B-007-B` |
| B2B-008 | Contact Capture and Management | `b2b.contact.create`, `b2b.contact.update` | `extension.b2b.contact_capture_management` | Planned ZIP 2 | Required | `B2B-008-A`, `B2B-008-B` |
| B2B-009 | Decision-Maker Research Missions | `b2b.decision_maker.research` | `extension.b2b.decision_maker_research` | Planned ZIP 2 | Required | `B2B-009-A`, `B2B-009-B` |
| B2B-010 | Opportunity Creation | `b2b.opportunity.create` | `extension.b2b.opportunity_creation` | Planned ZIP 3 | Required | `B2B-010-A`, `B2B-010-B` |
| B2B-011 | Intelligent Pipeline Management | `b2b.pipeline.advance` | `extension.b2b.intelligent_pipeline_management` | Planned ZIP 3 | Required | `B2B-011-A`, `B2B-011-B` |
| B2B-012 | Outreach Strategy Builder | `b2b.outreach.prepare` | `extension.b2b.outreach_strategy_builder` | Planned ZIP 3 | Required | `B2B-012-A`, `B2B-012-B` |
| B2B-013 | Gmail-Assisted Commercial Operations | `b2b.gmail.thread.resolve` | `extension.b2b.gmail_assisted_operations` | Planned ZIP 3 | Required | `B2B-013-A`, `B2B-013-B` |
| B2B-014 | WhatsApp-Assisted Operations | `b2b.whatsapp.context.resolve` | `extension.b2b.whatsapp_assisted_operations` | Planned ZIP 3 | Required | `B2B-014-A`, `B2B-014-B` |
| B2B-015 | Call Preparation | `b2b.call.prepare` | `extension.b2b.call_preparation` | Planned ZIP 3 | Required | `B2B-015-A`, `B2B-015-B` |
| B2B-016 | Field Visit Mode | `b2b.field_visit.record` | `extension.b2b.field_visit_mode` | Planned ZIP 3 | Required | `B2B-016-A`, `B2B-016-B` |
| B2B-017 | Meeting Preparation | `b2b.meeting.prepare` | `extension.b2b.meeting_preparation` | Planned ZIP 3 | Required | `B2B-017-A`, `B2B-017-B` |
| B2B-018 | Live Meeting Assistance | `b2b.meeting.assist` | `extension.b2b.live_meeting_assistance` | Planned ZIP 3 | Required | `B2B-018-A`, `B2B-018-B` |
| B2B-019 | Post-Meeting Conversion | `b2b.meeting.convert` | `extension.b2b.post_meeting_conversion` | Planned ZIP 3 | Required | `B2B-019-A`, `B2B-019-B` |
| B2B-020 | Proposal Studio | `b2b.proposal.create` | `extension.b2b.proposal_studio` | Planned ZIP 4 | Required | `B2B-020-A`, `B2B-020-B` |
| B2B-021 | Pricing Model Selection | `b2b.pricing.recommend` | `extension.b2b.pricing_model_selection` | Planned ZIP 4 | Required | `B2B-021-A`, `B2B-021-B` |
| B2B-022 | Pricing and Margin Protection | `b2b.margin.review`, `b2b.discount.request` | `extension.b2b.pricing_margin_protection` | Planned ZIP 4 | Required | `B2B-022-A`, `B2B-022-B` |
| B2B-023 | Negotiation Deal Room | `b2b.negotiation.update` | `extension.b2b.negotiation_deal_room` | Planned ZIP 4 | Required | `B2B-023-A`, `B2B-023-B` |
| B2B-024 | Objection Intelligence | `b2b.objection.classify` | `extension.b2b.objection_intelligence` | Planned ZIP 4 | Required | `B2B-024-A`, `B2B-024-B` |
| B2B-025 | Closing Room | `b2b.closing.evaluate` | `extension.b2b.closing_room` | Planned ZIP 4 | Required | `B2B-025-A`, `B2B-025-B` |
| B2B-026 | Contract and Payment Gates | `b2b.gates.evaluate` | `extension.b2b.contract_payment_gates` | Planned ZIP 4 | Required | `B2B-026-A`, `B2B-026-B` |
| B2B-027 | Payment-Promise Control | `b2b.payment_promise.create` | `extension.b2b.payment_promise_control` | Planned ZIP 4 | Required | `B2B-027-A`, `B2B-027-B` |
| B2B-028 | Revenue Rescue | `b2b.revenue_rescue.create` | `extension.b2b.revenue_rescue` | Planned ZIP 4 | Required | `B2B-028-A`, `B2B-028-B` |
| B2B-029 | Executive Intervention | `b2b.executive_intervention.prepare` | `extension.b2b.executive_intervention` | Planned ZIP 4 | Required | `B2B-029-A`, `B2B-029-B` |
| B2B-030 | Operational Handoff | `b2b.handoff.create` | `extension.b2b.operational_handoff` | Planned ZIP 5 | Required | `B2B-030-A`, `B2B-030-B` |
| B2B-031 | Partner Activation | `b2b.partner.activate` | `extension.b2b.partner_activation` | Planned ZIP 5 | Required | `B2B-031-A`, `B2B-031-B` |
| B2B-032 | Partner Performance | `b2b.partner.performance.read` | `extension.b2b.partner_performance` | Planned ZIP 5 | Required | `B2B-032-A`, `B2B-032-B` |
| B2B-033 | Upsell and Cross-Sell Intelligence | `b2b.expansion.recommend` | `extension.b2b.upsell_cross_sell` | Planned ZIP 5 | Required | `B2B-033-A`, `B2B-033-B` |
| B2B-034 | Renewal Management | `b2b.renewal.prepare` | `extension.b2b.renewal_management` | Planned ZIP 5 | Required | `B2B-034-A`, `B2B-034-B` |
| B2B-035 | Tender and RFP Intelligence | `b2b.tender.analyze` | `extension.b2b.tender_rfp_intelligence` | Planned ZIP 5 | Required | `B2B-035-A`, `B2B-035-B` |
| B2B-036 | Campaign Association | `b2b.campaign.associate` | `extension.b2b.campaign_association` | Planned ZIP 3 | Required | `B2B-036-A`, `B2B-036-B` |
| B2B-037 | Referral Source Management | `b2b.referral.capture` | `extension.b2b.referral_source_management` | Planned ZIP 3 | Required | `B2B-037-A`, `B2B-037-B` |
| B2B-038 | Daily Revenue Command | `b2b.daily_command.read` | `extension.b2b.daily_revenue_command` | Planned ZIP 3 | Required | `B2B-038-A`, `B2B-038-B` |
| B2B-039 | Manager Control | `b2b.manager.control` | `extension.b2b.manager_control` | Planned ZIP 6 | Required | `B2B-039-A`, `B2B-039-B` |
| B2B-040 | Staff Execution Quality | `b2b.execution_quality.read` | `extension.b2b.staff_execution_quality` | Planned ZIP 6 | Required | `B2B-040-A`, `B2B-040-B` |
| B2B-041 | B2B Reporting | `b2b.reporting.read` | `extension.b2b.b2b_reporting` | Planned ZIP 6 | Required | `B2B-041-A`, `B2B-041-B` |
| B2B-042 | Evidence and Audit | `b2b.audit.read` | `extension.b2b.evidence_audit` | Foundation active | Required | `B2B-042-A`, `B2B-042-B` |
| B2B-043 | Command Palette | `b2b.command.execute` | `extension.b2b.command_palette` | Planned ZIP 6 | Required | `B2B-043-A`, `B2B-043-B` |
| B2B-044 | Controlled Automation | `b2b.automation.evaluate` | `extension.b2b.controlled_automation` | Foundation active | Required | `B2B-044-A`, `B2B-044-B` |
| B2B-045 | Dynamic User-Specific Loading | `extension.capabilities.bootstrap` | `extension.b2b.dynamic_user_loading` | Foundation active | Required | `B2B-045-A`, `B2B-045-B` |
