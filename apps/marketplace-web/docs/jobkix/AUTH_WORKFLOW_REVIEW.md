# Candidate and employer authentication review — 2026-10-24

The existing migrations provide account initialization and candidate creation. Several application-level transitions were incomplete. This review fixes those transitions locally; it does not certify the hosted installation.

| Finding | Implemented behavior |
| --- | --- |
| Callback URLs and authored authentication emails dropped explicit candidate/employer intent. | Role and safe return destination survive provider callbacks, authored emails, confirmation resends, and callback failures. Existing employer workspace destinations also supply a role fallback. |
| Email signup could return to a public page before account initialization. | Signup callbacks route through onboarding while retaining the original destination. PKCE callbacks receive the signup action explicitly. |
| Recovery replaced the original destination and dropped employer context. | Reset URLs retain role and destination. Expired recovery links return to recovery with the original destination rather than nesting another reset step. |
| Signed-in users could revisit unnecessary sign-in, signup, or completed onboarding forms. | Active users continue to their destination. Verified users without a JOBKIX account continue to onboarding. An employer account can still add its missing candidate profile. |
| Onboarding asked for the name again despite signup metadata. | The verified session's signup name prepopulates onboarding. |
| First-time employer onboarding landed on an empty hiring dashboard. | Successful employer account initialization with the default hiring destination continues to organization creation. Explicit destinations and team invitations remain intact. |
| Registration linked to public legal pages that display only attribution. | Registration and onboarding display expandable reviewed terms/privacy snapshots returned by `jobkix_account_terms`. The same returned revision is submitted for server/SQL validation. Missing reviewed publications continue to block registration. Public legal attribution pages retain their existing behavior. |
| Unconfirmed-email sign-in errors offered no direct resend path. | The error includes a confirmation/resend link with role and destination. |

## Account behavior

Candidate: signup → email confirmation when required → account onboarding → original destination. SQL `account.initialize` creates the candidate profile only for candidate intent. An existing employer account without a candidate profile can complete candidate onboarding.

Employer: signup → email confirmation when required → account onboarding → organization creation for the default hiring destination. Organization creation and verification remain separate existing workflows. A team invitation retains its invitation identifier and token through authentication and onboarding, then presents the existing invitation acceptance screen.

Both roles use the existing shared Supabase identity. Role intent selects onboarding and navigation; it does not grant organization membership or hiring permissions.

## Validation

- `node --test scripts/jobkix/auth-workflow.test.cjs scripts/jobkix/auth-email.test.cjs scripts/jobkix/domain.test.cjs`: 83 tests passed. New cases execute the actual auth and callback handlers using isolated provider/repository adapters, exercise auth page routing and invitations, and render the consent disclosure as escaped HTML. Navigation and email checks cover seven locales.
- `node scripts/jobkix/check-types.cjs`: 216 roots, 1,102 transitive files, zero diagnostics.
- Scoped `git diff --check`: passed.
- `scripts/jobkix/database.test.cjs` could not start because `@electric-sql/pglite` is missing from the configured local test-tools location. This is a test-environment failure; no migration execution result is claimed.

## Hosted verification still required

The user's applied migrations were not reapplied or independently inspected. Hosted Auth settings, allowed redirect origins, email delivery, published reviewed terms/privacy editions, real confirmation links, and persistent candidate/organization records still require an end-to-end check against the running environment. No browser journey against the running application, deployment, live signup, or production SQL occurred in this review. These are local source fixes, not a production acceptance claim.
