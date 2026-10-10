# AngelCare — Operational Reception R1

Prepared against supplied source commit `b970c0e207f83d28d51d3323c52202a999af1adf`.

This is a code and SQL delivery, not a deployment or proof of live email delivery.

## What changes

| Customer action | Operational destination | What is recorded |
|---|---|---|
| Product/kit checkout | Admin → `/angelcare-marketplace/admin/intake`, then Orders | Native journey and individual configured order lines; payment obligation linked to that journey |
| Service / recurring / Academy / solution request | Same intake, native journey dossier | Request received for operational qualification. No automatic provider booking, Academy enrolment or subscription activation |
| Corporate / establishment / health / hospitality form | `/angelcare-marketplace/admin/verticals/requests` | Original B2B request, consent, owner, qualification, linked CRM lead and optional actual diagnostic |
| Partner OS / professional enquiry | Same intake → public enquiries | Original enquiry and its native dossier; assisted order handoff when appropriate |
| Family quote request | Same intake → Family Request dossier | Family contact, need, qualification and a permission-controlled assisted reservation handoff |
| Customer signup / guest profile | `/angelcare-marketplace/admin/customers` → Customer 360 | Canonical customer profile; the new access panel distinguishes linked Auth identity, verification and email transport records |

Quality Check requests retain the actual endpoint authority used by their form. A B2B public request appears in the B2B inbox; a public enquiry appears in the enquiries source. The category does not manufacture a different record.

Receipt, payment and fulfilment are separate. Customers can continue with manual handling when card processing is unavailable, Wallet funds are insufficient or cash-on-delivery is selected. Requests must still have a valid published offer, contact and required explicit consent. Database or authorization failures cannot be called successful receipts.

Cash/card/Wallet preference does not declare funds received. Wallet capture uses its ledger authority. Finance manual receipts require a reference, a reason, an idempotency key and the approval permission. The manual action records an operator-attested receipt; it does not charge a card. Mixed external/Wallet settlement requires the real Wallet reservation debit; failure retains only verified external funds and a follow-up state. Financial updates synchronize to the received journey. Availability remains subject to operator validation.

The source now binds verified customer identity on session creation and receipt, repairs the canonical/legacy guest visitor-hash mismatch, and attaches guest financial obligations when identity is claimed. Different configurations of the same basket offer stay separate order lines.

## Account and email operations

Open a client’s **360** tab. Admins can inspect its Marketplace and Auth states, resend a signup confirmation or request a password recovery email. Suspended/restricted accounts require resolution first. Guest records do not pretend to have an Auth identity. Passwords and recovery tokens are not exposed by the access panel.

Both actions reuse the existing customer callback and Supabase Auth transport. Each dispatch has a durable reservation, an idempotency key, a one-minute cooldown and an accepted/rejected result. Provider acceptance is explicitly **not inbox-delivery evidence**. Live SMTP configuration, callback allowlist, templates and actual mailbox receipt must be tested on the deployed environment. This package does not repair unknown SMTP configuration or claim delivery is guaranteed.

Admin-created Auth accounts require email confirmation; editing a registered email no longer force-confirms it. Guest profile edits skip nonexistent Auth identities. An Auth/customer mismatch is exposed rather than silently “fixed”.

## Safe installation

1. Extract this ZIP into Downloads.
2. Run:

```bash
node "$HOME/Downloads/ANGELCARE_OPERATIONAL_RECEPTION_R1_20261010/install.mjs" "$HOME/Desktop/angelcare-platform"
```

The command runs in Node and never exits your interactive terminal. It executes no SQL, dependency installation, TypeScript gate, build, staging, commit, push or deployment.

The installer validates every payload before changing anything. Existing target files must match the supplied-source baseline or this exact payload. A different local edit is preserved and reported as a conflict. No force-overwrite option exists. Backups and the rollback command are generated under the Marketplace’s `.angelcare_patch_backups` folder. Repeat installation is safe.

3. Before releasing this source, run **database/01_OPERATIONAL_RECEPTION_R1.sql** in the appropriate SQL Editor. It is transactional and fails if required source dependencies are absent. Rehearse it on a database copy first; its PL/pgSQL has not been executed in this workspace.
4. Run **database/02_VERIFY_OPERATIONAL_RECEPTION_R1.sql**. It is read-only and reports missing authorities, duplicate outcomes, missing line materialization and price/line discrepancies. Historical issues are reported for review; unknown historical prices are never invented. No historical bulk line reconstruction is attempted.
5. Build the exact source through the existing Marketplace GHCR workflow, verify its immutable image digest, then deploy through Coolify.
6. Execute the deployment checklist below before calling the rollout validated.

## Deployment checklist

- [ ] Transactional migration succeeds on rehearsal database, then target database.
- [ ] Read-only SQL verification reviewed; historical discrepancies separated from new R1 submissions.
- [ ] Full Marketplace image builds; compiled route and runtime identity release checks pass.
- [ ] Immutable GHCR image deployed; actual source revision confirmed.
- [ ] Guest COD checkout creates one native order and a pending obligation, with truthful receipt copy.
- [ ] Card processing failure still allows explicit manual handling and durable receipt.
- [ ] Insufficient Wallet credit allows manual reception without an invented debit/capture.
- [ ] Same offer with two configurations creates two native lines and preserves each selection.
- [ ] Verified signup attaches guest journeys and payment obligations to the right customer.
- [ ] Signup confirmation, resend and recovery complete with a real mailbox and actual callback/reset flow.
- [ ] Each B2B form appears in its actual inbox; qualification opens one linked diagnostic, not an activated programme.
- [ ] Family qualification can reach the assisted reservation workflow without duplicating an existing linked journey.
- [ ] Read-only staff cannot mutate; tenant/territory isolation exercised with two distinct operators.
- [ ] Finance manual receipt is idempotent, evidence-required and cannot manually debit the Wallet.

## Verification delivered

Actual source-function tests use mocked database/Auth transport; see `verification/runtime-results.json` and the source harness. Changed TS/TSX syntax is parsed through the available Babel TSX transformer. This is not a TypeScript type check or full application build. Installer safety is tested independently: pristine install, repeat, conflict preservation, payload integrity and rollback including later-edit protection.

HTML previews in `previews/` render the delivered JSX with fictitious hook data. They are layout references, not screenshots of a live deployment. Browser screenshot verification could not run because this environment has no Chromium executable. No browser-pass count is claimed.

The supplied homepage, Marketplace shell, Families, Home Services, storefronts, atomic schema registry and import engines remain protected. See the boundary comparison report.

## Rollback

Use the exact command printed by the installer. Rollback validates all installed target hashes before restoring any file and refuses to overwrite a later edit. It restores only code touched by the installer. Keep the additive database schema and all received business records; do not drop tables or delete orders to roll back the UI. Database function changes and historical link repairs are not reversed by code rollback. Rehearse rollback with operations before production use.

Global admin receives unassigned B2B requests whose territory/tenant is still unknown. Scoped operators see records in their permitted scope. Qualification does not invent a territory or organization contract.
