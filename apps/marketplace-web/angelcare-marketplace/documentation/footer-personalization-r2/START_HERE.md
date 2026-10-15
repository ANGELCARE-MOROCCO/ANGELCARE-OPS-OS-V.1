# AngelCare — Footer Studio Personalization R2

## Scope
This is the continuation of the Footer Studio mission. It adds an identity editor to the existing command workspace; it does not replace the Marketplace shell. The recoverable source baseline is ANGELCARE_MARKETPLACE_WEB_FULL_SOURCE_20261012_114923.zip. The installer checks actual working files before writing. Exact known files install directly; unique, non-overlapping changes can be merged; overlapping or unfamiliar files stop the entire preflight without overwriting them.

Open **Marketplace Admin → Footer Studio → Identité & finitions** after releasing the image. Direct route: `/angelcare-marketplace/admin/footer-studio/brand`.

## What you can manage
- Eleven brand/directory/service text fields in French, English and Arabic, including the text below the logo and an optional second paragraph. Actual translation completeness is shown separately from public locale fallback.
- Official white and color logo variants, with an automatic background-aware option. The approved logo artwork is reused, never re-created or recolored with CSS.
- Eleven profile-specific color overrides and eighteen bounded size, spacing, typography and border controls. Shared themes remain unchanged. A reset clears only these controlled overrides and retains unknown settings.
- Glass, solid or outline cards; optional soft/no shadow; alignment, motion, desktop/tablet column counts, card height alignment and mobile single/multiple accordions.
- Up to six localized editorial badges, their visibility, icons and order. No certification or promise is added automatically.
- Existing five essential access routes: change their label and visibility while retaining their canonical destination. Optional shortcuts use all twelve storefront routes from the native public navigation registry.
- Composer controls for section visibility, descriptions, accent and native contact-desk bindings, alongside existing section title, type, ordering and span controls.
- Real public renderer previews at desktop, tablet and mobile widths, plus expanded inspection. Preview clicks do not navigate or emit analytics. Initial or programmatic accordion opening is not treated as a user event.

All existing workspace destinations remain: cockpit, profiles, composer, themes, components, contacts, navigation, localization, targeting, schedules, history, analytics and settings. All eight themes remain. Existing sections, active desk bindings, links, copyright and native navigation are retained. Visibility changes are explicit operator actions.

## Save and publish — existing semantics
**Saving a published profile updates its live profile.** This package does not introduce an unpublished staging layer. The interface discloses that effect. Publishing saves the current profile and any edited owned sections first, then calls the existing publication authority to create a version in history. Failed requests retain entered values. A stale profile produces a conflict rather than overwriting a newer save. The update compares the database `updated_at` again at write time.

Inherited brand/settings merge recursively, preserving other locales and unknown sibling fields. Inherited parent sections are not silently moved into a child profile: the write remains scoped to its owning profile. Manage parent-owned sections in their parent profile.

Use **Enregistrer** before changing workspace. The interface warns on reload or rail navigation with unsaved profile edits. Switching the profile selector preserves unsaved profiles in the current screen; it does not save them automatically. Existing independent contact, link, targeting and schedule forms retain their own native save actions.

## Installation
1. Download the ZIP into Downloads and extract it.
2. Run `node install.mjs /Users/user/Desktop/angelcare-platform` from the extracted package, or use the provided command in the delivery message.
3. Keep the printed backup path and rollback command. The installer creates verified backups of actual working files, preflights all changes, uses atomic file replacement, and restores files it wrote if installation fails. It refuses symlink destinations. Repeat installation is supported.
4. Release using your existing Marketplace GitHub image workflow and existing Coolify resource.

**No SQL, new environment variables, worker, dependency installation, global TypeScript or local app build is needed.** The existing profile `brand` and `settings` JSON fields store the enhancements; existing API permissions remain authoritative.

## Acceptance after release
Open the brand editor, edit one FR text, change language and verify EN/AR, adjust an accent, save, and inspect a public page using the intended targeted profile. Confirm your actual live sections, contacts, essential links and copyright. Check mobile accordions and Arabic. Published profiles update when saved. The package's offline checks do not certify a deployed database, cache or browser session.

## Rollback
Use the exact `ROLLBACK_COMMAND` printed by the installer. Rollback first verifies all target and backup hashes and refuses to overwrite later edits. It restores actual pre-install working content, not an assumed clean Git revision. Source rollback does not undo saved database brand/settings values; those remain compatible optional JSON fields and may be restored through native Footer history if a prior publication snapshot is available.
