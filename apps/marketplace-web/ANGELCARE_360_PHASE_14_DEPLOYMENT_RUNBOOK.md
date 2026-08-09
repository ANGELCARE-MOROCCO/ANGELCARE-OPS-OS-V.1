# ANGELCARE 360 Phase 14 Deployment Runbook

## Pre-deploy checklist
- Confirm the working tree is clean except for intentional Phase 14 changes.
- Confirm the `app/(protected)/angelcare-360` subtree remains untouched.
- Confirm the Phase 14 matrices and release report are present.
- Confirm the target environment has the required database and auth settings.
- Confirm the customer accepts the locked-feature register.

## Database migration application order
1. Apply Phase 2 foundation migrations.
2. Apply Phase 3 administration migrations.
3. Apply Phase 4 people migrations.
4. Apply Phase 5 admissions migrations.
5. Apply Phase 6 attendance / timetable migrations.
6. Apply Phase 7 academics migrations.
7. Apply Phase 8 finance migrations.
8. Apply Phase 9 payroll migrations.
9. Apply Phase 10 transport migrations.
10. Apply Phase 11 library / inventory migrations.
11. Apply Phase 12 communication / notifications / claims migrations.
12. Apply Phase 13 reporting / exports / documents migrations.

## Environment variable verification
- Verify the database URL used by the deployment.
- Verify the auth/session secret used by the deployment.
- Verify the Supabase URL / key pair if Supabase is the backing service.
- Verify that no client-side secret is exposed through `NEXT_PUBLIC` variables.

## Build command for the user machine
- Run: `npm run build`

## Post-deploy smoke tests
- Open `/angelcare-360-command-center`
- Open one route for each live module
- Open one route for each locked feature area
- Verify that disabled actions are clearly explained in French
- Verify that audit-related screens load

## Critical routes to test
- `/angelcare-360-command-center`
- `/angelcare-360-command-center/administration`
- `/angelcare-360-command-center/eleves`
- `/angelcare-360-command-center/admissions`
- `/angelcare-360-command-center/presences`
- `/angelcare-360-command-center/academique`
- `/angelcare-360-command-center/finance`
- `/angelcare-360-command-center/paie`
- `/angelcare-360-command-center/transport`
- `/angelcare-360-command-center/bibliotheque`
- `/angelcare-360-command-center/inventaire`
- `/angelcare-360-command-center/messagerie`
- `/angelcare-360-command-center/notifications`
- `/angelcare-360-command-center/reclamations`
- `/angelcare-360-command-center/rapports`
- `/angelcare-360-command-center/exports`
- `/angelcare-360-command-center/documents`

## API smoke tests
- `GET /api/angelcare360/administration`
- `GET /api/angelcare360/people`
- `GET /api/angelcare360/admissions`
- `GET /api/angelcare360/attendance`
- `GET /api/angelcare360/academics`
- `GET /api/angelcare360/finance`
- `GET /api/angelcare360/payroll`
- `GET /api/angelcare360/transport`
- `GET /api/angelcare360/library`
- `GET /api/angelcare360/inventory`
- `GET /api/angelcare360/communication`
- `GET /api/angelcare360/notifications`
- `GET /api/angelcare360/claims`
- `GET /api/angelcare360/reports`
- `GET /api/angelcare360/exports`
- `GET /api/angelcare360/documents`

## Rollback plan
- Revert the latest deployment.
- Reapply the previous known-good database snapshot if the target environment changed.
- Keep the locked features locked rather than forcing a partial activation.

## Production monitoring recommendations
- Monitoring is not implemented by this phase.
- Use the hosting platform logs and database logs that already exist in the customer environment.
- Add an operational incident process before broad rollout.

## Customer pilot activation steps
- Confirm the pilot school record.
- Confirm the pilot admin account.
- Confirm the module permissions.
- Enable only the agreed school and role scopes.
- Walk the owner through the locked-feature register before first use.
