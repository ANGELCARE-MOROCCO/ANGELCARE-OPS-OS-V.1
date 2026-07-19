# Page 2D-R2 Directory Mission Multi-Ambassador Assignment Patch

Applied: 2026-07-18T23:30:42.663Z

Files changed:
- components/market-os/ambassadors/routes/AmbassadorDirectoryRoute.tsx

Backup:
- backups/page2d-r2-directory-mission-multi-ambassador-20260718233042

Scope:
- Page 2 /market-os/ambassadors/directory
- Upgrades only the Directory Créer mission modal
- Adds one-or-more ambassador assignment support
- Preserves the selected ambassador as primary by default
- Adds support ambassador selector, roles, load/territory warnings
- Payload now includes primary_ambassador_id, assigned_ambassador_ids, assigned_ambassadors, support_ambassadors, ambassador_count
- POST remains /api/market-os/ambassadors/missions
- No DB/env/schema changes
- No RefferQ changes
- No commit/push performed
