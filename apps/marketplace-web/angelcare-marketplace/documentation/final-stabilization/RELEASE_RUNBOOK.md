# ANGELCARE Marketplace — Controlled Release Runbook

## Preconditions

1. Final source package applied and static authority passes.
2. Marketplace batch TypeScript passes.
3. Public and authenticated runtime smoke passes.
4. Visual evidence passes desktop, tablet and mobile.
5. FR, EN and Arabic RTL review accepted.
6. Selected Supabase preflight passes.
7. Accessibility and performance evidence accepted.
8. No unresolved critical defect.
9. Backup and real restore-test evidence accepted.
10. Executive separation-of-duties approvals recorded.

## Release record

Record:

- release identity and version;
- source commit and package checksum;
- migrations included—none for Final Stabilization;
- territories and locales;
- feature flags;
- owners and approvers;
- expected monitoring window;
- rollback triggers.

## Controlled release sequence

1. Freeze the approved source revision.
2. Confirm selected environment variables and Node 22.
3. Confirm backup evidence and restore reference.
4. Deploy only after separate authorization.
5. Verify critical public routes.
6. Verify authentication and protected routing.
7. Verify search, catalogue and item pages.
8. Verify one controlled conversion per journey family.
9. Verify Journey Control materialization.
10. Verify Operations and Finance handovers.
11. Verify Security, QA and Launch Commands.
12. Begin post-launch monitoring windows.

## No automatic deployment

The stabilization package does not deploy and does not mark the release as production-approved.
