# AngelCare B2B Marketplace — Live Admin Sync Patch

This focused patch makes admin edits actually refresh the public marketplace layer.

## Fixes
- Public B2B marketplace layout is forced dynamic with no-store cache settings.
- Admin mutations call `revalidatePath()` for public marketplace routes and layout.
- Admin save/delete broadcasts a same-browser sync event.
- Public marketplace tabs listening to the event reload automatically after admin save.

## Install
```bash
cd ~/Desktop/angelcare-opsos-app
unzip -oq ~/Downloads/angelcare-b2b-marketplace-live-admin-sync-patch-20260703.zip -d .
rm -rf .next
npm run build
npm run dev
```

## Important
For real persistence, Supabase migration must be applied and env variables must be configured. Otherwise admin mutations cannot persist to the database.
