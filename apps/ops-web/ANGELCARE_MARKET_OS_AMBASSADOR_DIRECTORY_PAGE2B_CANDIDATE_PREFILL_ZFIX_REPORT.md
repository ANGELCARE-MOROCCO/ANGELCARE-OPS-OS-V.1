# Page 2B Add Ambassador Candidate Prefill + Overhead Z-Fix

Applied: 2026-07-18T17:23:52.000Z

Files changed:
- components/market-os/ambassadors/routes/AmbassadorDirectoryRoute.tsx

Backup:
- backups/page2b-add-ambassador-candidate-prefill-zfix-20260718172351

Scope:
- Page 2 /market-os/ambassadors/directory
- Fixes Ajouter ambassadeur modal overlay z-index so it appears above the overhead panel
- Adds existing candidate selector and pre-fill section
- Loads candidate data from snapshot.recruitment / snapshot.candidates
- Keeps non-candidate activation fields editable for the operator
- No DB/env/schema changes
- No RefferQ changes
- No commit/push performed
