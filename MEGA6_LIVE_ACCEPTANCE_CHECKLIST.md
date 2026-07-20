# Mega ZIP 6 Live Acceptance Checklist

Complete this checklist against the deployed application and real pilot data. Static verification alone is not live acceptance.

## A. Deployment and access

- [ ] Mega ZIP 5 is operational.
- [ ] Mega ZIP 6 SQL migration applied successfully.
- [ ] OPS backend deployed/restarted.
- [ ] Extension manifest reports version `0.6.0`.
- [ ] Pilot manager assigned through `/users/[id]`.
- [ ] Unassigned staff cannot see Director Mode.
- [ ] Revoked device receives no new management commands.
- [ ] Territory-restricted user cannot read another territory.

## B. AI Sales Director

- [ ] Review an authorized account.
- [ ] Review the authorized pipeline.
- [ ] Every recommendation includes finding, evidence, missing evidence, confidence and recommended action.
- [ ] Inferences are visibly distinguished from verified facts.
- [ ] Accepting a recommendation requires the configured authority.
- [ ] Rejection and refresh preserve disposition history.
- [ ] No recommendation fabricates client engagement, payment, agreement or evidence.

## C. Pipeline Truth and forecast

- [ ] Assess an opportunity whose displayed stage lacks evidence.
- [ ] Confirm reported stage, recommended stage and missing evidence are shown.
- [ ] Apply a stage correction only with manager authority.
- [ ] Generate an explainable forecast snapshot.
- [ ] Confirm committed/probable/possible/at-risk/unqualified/stale categories.
- [ ] Request a forecast override.
- [ ] Approve/reject the override with a separate authorized user where policy requires.

## D. Revenue Risk Command

- [ ] Detect stale or forgotten opportunity risk.
- [ ] Create Proposal Recovery.
- [ ] Create Payment Recovery.
- [ ] Create Renewal Rescue.
- [ ] Create Partner Health Rescue.
- [ ] Confirm revenue at risk, owner, deadline, evidence and escalation path.
- [ ] Escalate and resolve a risk with audit history.

## E. Management and intervention

- [ ] Assign a revenue priority.
- [ ] Reassign an account.
- [ ] Reassign an opportunity.
- [ ] Request a correction.
- [ ] Freeze a risky action.
- [ ] Open an executive intervention dossier.
- [ ] Confirm prohibited commitments and required outcome are visible.
- [ ] Close the intervention with a real outcome.

## F. Execution quality and coaching

- [ ] Generate a staff execution assessment using authorized work data.
- [ ] Confirm each pattern is explained with evidence.
- [ ] Confirm no secret monitoring or unrelated personal metric is present.
- [ ] Create and assign a coaching mission.
- [ ] Submit completion proof.
- [ ] Manager reviews the proof.
- [ ] Record the real commercial outcome.

## G. Territory and reports

- [ ] Calculate an authorized territory snapshot.
- [ ] Confirm city and vertical coverage.
- [ ] Confirm no unassigned territory data appears.
- [ ] Generate Daily Revenue Brief.
- [ ] Generate Weekly Commercial Review.
- [ ] Generate Pipeline Truth, Margin, Payment, Partner Health, Renewal, Territory and Staff reports.
- [ ] Confirm missing data is shown as missing rather than invented.
- [ ] Confirm report versions and evidence remain auditable.

## H. Controlled automation

- [ ] Create a safe internal automation.
- [ ] Confirm it starts disabled or in the configured approval state.
- [ ] Request and decide approval.
- [ ] Enable and execute the automation.
- [ ] Confirm repeated execution is idempotent.
- [ ] Pause the automation.
- [ ] Activate the kill switch and confirm execution is blocked.
- [ ] Confirm external communication cannot execute automatically.
- [ ] Confirm discounts, proposal approval, contract changes, payment confirmation, partner launch, tender submission, opportunity won and renewal approval remain human-controlled.

## I. Final acceptance evidence

- [ ] All relevant command requests and results appear in audit history.
- [ ] Capability revocation clears stale Director Mode access.
- [ ] Focus Mode preserves authorized management context.
- [ ] No direct Chrome-to-database communication occurs.
- [ ] No unrelated application work was overwritten.
- [ ] Acceptance owner, date, environment and evidence links recorded.
