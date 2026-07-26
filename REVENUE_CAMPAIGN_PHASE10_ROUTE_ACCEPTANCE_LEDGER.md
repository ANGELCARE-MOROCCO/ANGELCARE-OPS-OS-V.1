# Revenue Campaign Phase 10 — Route Acceptance Ledger

| Route | Experience | Acceptance contract |
|---|---|---|
| `/revenue-command-center/campaigns` | Campaign Command Center | Executive portfolio, direct intervention, risk, audience, conversion and economics posture. |
| `/revenue-command-center/campaigns/new` | Campaign Strategy Studio | Strategy, audience model, governance, attribution, budget and launch foundation. |
| `/revenue-command-center/campaigns/board` | Campaign Lifecycle Board | Lifecycle lanes, approvals, risks, recovery and management intervention. |
| `/revenue-command-center/campaigns/[id]` | Campaign 360 Dossier | Strategy, snapshot, sequences, recipients, replies, conversions, audit and next action. |
| `/revenue-command-center/campaigns/[id]/assets` | Sequence & Content Control | Immutable sequence/template versions, sender and provider readiness. |
| `/revenue-command-center/campaigns/[id]/execution` | Live Campaign Room | Recipients, scheduled steps, dispatch, replies, opt-outs, emergency stop and SDR backlog. |
| `/revenue-command-center/campaigns/[id]/performance` | Attribution & Economics | Deliverability, conversion lineage, costs, attribution conflicts and immutable periods. |
| `/revenue-command-center/sdr-execution` | SDR Execution Command | Prioritized daily queue, reply/call outcomes, meeting and opportunity conversion. |

## Cross-route gates

- Full-width premium white/icy-blue corporate workspace.
- Uniform collapsible Revenue Command sidebar remains authoritative.
- French operational language and `fr-FR` formatting; monetary values shown in Dh.
- No generic `RevenueCommandFinalWorkspace` wrapper remains in the seven campaign routes.
- SDR route no longer forwards to `CanonicalRevenueWorkspace`.
- Loading, empty, partial-schema and error states are explicit.
- All mutation controls call protected APIs; no local simulation is treated as production state.
- Desktop, laptop, tablet and mobile compositions are governed by the Phase 10 CSS Module.
