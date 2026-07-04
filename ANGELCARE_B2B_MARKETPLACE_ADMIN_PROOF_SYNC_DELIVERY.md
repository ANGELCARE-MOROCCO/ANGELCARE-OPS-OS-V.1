# AngelCare B2B Marketplace — Admin Proof Sync Patch

This patch makes the Marketplace Admin Studio visibly operational and no longer fake-feeling.

## Added
- Clear saving / success / error states in the admin UI.
- Confirmed persistence mode after save: `supabase` or `local-file`.
- Local file persistence fallback when Supabase tables/env are not ready.
- Public marketplace repository now reads local admin overrides as well as Supabase.
- Public marketplace route revalidation after admin mutations.
- Cross-tab reload signal after admin save, so an open marketplace tab refreshes.
- Works locally without applying Supabase migration, while still using Supabase in production when configured.

## Local override file
When Supabase is not ready, edits are stored in:

`.angelcare_b2b_marketplace_admin_store.json`

This is for local/dev reliability. In production, apply the Supabase migration and the same Admin Studio writes to the DB.
