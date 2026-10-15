# AngelCare · Digital Customer Experience · Chapter 1

This package adds the DCE operator studio inside the existing Marketplace backoffice. Its visual source is your supplied light blue/white dashboard; its functional source is the sixteen-family doctrine. The child/family audience amendment governs the original reference. Public customer discovery and distribution belong to Chapter 2.

## 1. Install the source patch on your Mac

Download this ZIP to Downloads, then run the following as a complete block. It starts a separate Node process; failures return to your shell.

```bash
unzip -q -o "$HOME/Downloads/ANGELCARE_DCE_ADMIN_R1_20261014.zip" -d "$HOME/Downloads" &&
node "$HOME/Downloads/ANGELCARE_DCE_ADMIN_R1_20261014/install.mjs" "$HOME/Desktop/angelcare-platform"
```

The installer checks every packaged file, preflights every target before writing, backs up the actual working bytes, installs only its listed files and verifies the result. Native integration files can retain unrelated edits when each patch context remains unique. Overlapping or unfamiliar new-file changes stop before installation. It does not stage, commit, push, build, execute SQL, change variables or deploy. Keep the printed backup path and rollback command. If an unfamiliar edit blocks installation, preserve it and reconcile the named integration; do not force-copy an entire file.

## 2. Apply the additive database activation separately

Use the existing **Marketplace Supabase SQL Editor** connected to the same database as this app. Run file 01 in full, then file 02 in full. On the Mac, these commands copy the exact packaged SQL to the clipboard:

```bash
pbcopy < "$HOME/Downloads/ANGELCARE_DCE_ADMIN_R1_20261014/database/01_DCE_ADMIN_R1.sql"
```

Paste into SQL Editor and run. Then:

```bash
pbcopy < "$HOME/Downloads/ANGELCARE_DCE_ADMIN_R1_20261014/database/02_VERIFY_DCE_ADMIN_R1.sql"
```

The verification should show all eight DCE tables installed, owned and RLS-enabled; owned function rows should deny anon/customer execution. Empty inventory/release result sets are normal on first activation. SQL 01 notifies PostgREST to refresh the schema. It is repeatable and refuses to overwrite foreign objects with the same owned names. It creates the DCE data and permission definitions, without granting staff roles or changing any native commerce data.

**Do not run 03 during activation.** `03_DISABLE_DCE_ADMIN_R1.sql` is an explicit emergency pause: withdraw DCE releases, cancel pending DCE schedules and turn off DCE distribution/monetization. It preserves DCE dossiers and existing Marketplace records. It is not source rollback and does not undo production customer data.

The installed copies also live under `apps/marketplace-web/angelcare-marketplace/digital-customer-experience/database/`.

## 3. Use the existing access-management authority

The new final sidebar entry is **Digital Customer Experience**. Route:
`/angelcare-marketplace/admin/digital-customer-experience`.

Authorize operators through the existing workspace/role administration. The workspace key is `workspace.digital_experience`. Explicit powers are `marketplace.digital_experience.view`, `.manage`, `.publish`, `.moderate`, `.monetize`, `.export`, `.purge`. Media upload also needs native `marketplace.media.manage`; media selection needs `.view`. Private customer identity access needs native `marketplace.crm.view`. SQL does not silently grant these powers. Existing CEO/global administrator behavior remains governed by your native authorization code.

Entering DCE forces the host sidebar compact while retaining the current shell, session and command surface. Leaving restores the prior compact preference. The studio has its own responsive internal navigation and all 23 destinations.

## 4. Initialize the editable world defaults

After database activation and the remote release, enter DCE. Use **Initialize defaults / Initialiser les valeurs** in the first-use setup surface if offered. This creates eight child/family topics, sixteen editable family template drafts and one world-defaults dossier. It is idempotent. It creates no customer accounts, published experiences, purchases, ad demand or fabricated statistics. Start with one real experience, not a bulk production seed.

## 5. Reuse the current media setup

No new media service, S: root, bridge credential or Windows service is created. Uploads use the current native preflight, signed upload and checksum completion endpoints. The native default MIME list now also accepts `audio/mpeg`. If your existing runtime explicitly sets `MARKETPLACE_MEDIA_ALLOWED_MIME`, preserve all of its present values and ensure it permits the actual source types you intend to upload. This package does not change that variable or the deployed gateway.

Images/PDF/video/MP3 remain native source files. DCE stores references, rights and processing evidence. Metadata inspection is bounded to 32 MiB and uses the existing sharp/pdf-lib dependencies. It does not claim to provide OCR, audio transcription, video transcoding or PowerPoint conversion. Upload a supported rendition when one is required; do not mark an unproduced rendition as ready. Private customer attachments cannot use public editorial media; their public uploader remains blocked until a protected receiver is wired in Chapter 2.

## 6. Google AdSense can be configured separately

All fifteen atlas classifications, policy controls and internal previews are prepared. The admin works without Google credentials. For supported server API operations, optional server-only runtime keys are:

```dotenv
DCE_GOOGLE_CLIENT_ID=
DCE_GOOGLE_CLIENT_SECRET=
DCE_GOOGLE_REFRESH_TOKEN=
```

These are a DCE AdSense Management API grant, not customer Google sign-in credentials. Do not put them in browser/public variables or alter working customer OAuth. Register the real account/site and verify through the AdSense workspace. Credentials alone do not approve a site. Display creation is restricted by Google to eligible AdSense for Platforms projects; ordinary accounts can register existing Console units. Auto ads, Offerwall, AFS, H5 and video programs retain Google's own eligibility and console controls. No ad scripts run in the admin or internal preview. See `docs/ADSENSE_READINESS.md`.

## 7. Release through the existing Marketplace image workflow

Commit/push and the remote image build remain your existing release process. This installer does not create or dispatch a workflow, change a fixed source SHA or deploy an image. Use the exact committed source and immutable image reference when you authorize the release. No local full build is required by this package.

## 8. Live acceptance after deployment

Confirm normal admin sign-in/PIN, DCE entry/exit and direct links, first-use initialization, creation and failed-save recovery, native media upload/selection, validation→review→approval→release, scheduled/cancelled release, a small targeted import and guarded rollback, access denial for a limited role, and all existing native Marketplace paths. Record the live origin, source SHA, role and database target. The included isolated tests and component preview are not a substitute for these deployed checks.

## 9. Inspect the actual code preview

Open `previews/dashboard-desktop.png` for a rendered reference. For the interactive offline fixture:

```bash
node "$HOME/Downloads/ANGELCARE_DCE_ADMIN_R1_20261014/preview/serve.mjs"
```

Visit `http://127.0.0.1:4173/angelcare-marketplace/admin/digital-customer-experience`. Ctrl+C stops this separate preview process. It uses test fixtures, does not connect to your database and makes no provider mutation. Saves in the preview are temporary in-memory demonstrations.

## 10. Source rollback

Run the exact `ROLLBACK_COMMAND` printed by installation. It verifies backup checksums and every current installed file before restoring anything. Later edits or symlinked paths stop rollback rather than destroying them. SQL and production data remain outside source rollback. Read `docs/VERIFICATION.md`, `docs/OPERATOR_GUIDE.md` and `docs/CONTRACT_ACCEPTANCE.md` for the tested boundaries.
