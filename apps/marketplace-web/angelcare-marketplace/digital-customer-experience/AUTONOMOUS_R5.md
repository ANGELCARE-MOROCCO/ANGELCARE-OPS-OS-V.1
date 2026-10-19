# AngelCare DCE · Autonomous Experience Administration R5

This is the additive Chapter 1 admin/source package for the supplied current DCE archive. It preserves the existing admin shell, stylesheet, components and Marketplace integrations. It does not publish a new public experience website. The approved chapter boundary remains: prepare and accept the administration first; build and activate public distribution as Chapter 2.

## 1. Install the scoped source

Download this ZIP into Downloads, then paste this complete block in Mac Terminal:

```bash
unzip -q -o "$HOME/Downloads/ANGELCARE_DCE_AUTONOMOUS_R5_20261017.zip" -d "$HOME/Downloads" &&
node "$HOME/Downloads/ANGELCARE_DCE_AUTONOMOUS_R5_20261017/install.mjs" "$HOME/Desktop/angelcare-platform"
```

The installer verifies the package, checks every target before writing, backs up actual originals, installs only the listed DCE files, and verifies installed hashes. Already-installed files are skipped. Unfamiliar edits stop installation before source writes. An interrupted installation attempts to restore the files it changed; later edits are preserved. Keep its printed backup path and rollback command.

It executes no SQL, dependency installation, global TypeScript, app build, Git operation or deployment. It does not close your terminal.

## 2. Activate separately in Marketplace SQL Editor

The existing R4 database must already be activated (the original 01, 04, 06 and 08 migrations). Do not execute unrelated migrations blindly. SQL 11 checks the required native DCE tables and refuses conflicting object ownership.

Copy SQL 11 to your clipboard:

```bash
pbcopy < "$HOME/Downloads/ANGELCARE_DCE_AUTONOMOUS_R5_20261017/database/11_DCE_AUTONOMOUS_R5.sql"
```

Paste into the existing Marketplace Supabase SQL Editor and run it. It adds four DCE-owned tables and scoped functions inside one transaction. It retains previous records, versions, releases, cases and contributions. It changes no mailbox, authentication provider, native commerce table, role assignment or storage configuration.

Then copy the read-only verification:

```bash
pbcopy < "$HOME/Downloads/ANGELCARE_DCE_AUTONOMOUS_R5_20261017/database/12_VERIFY_DCE_AUTONOMOUS_R5.sql"
```

Paste and run it in the same SQL Editor. Installed/ownership/RLS/function-permission checks should be true and integrity counts should be zero. No production execution has been performed by this delivery.

## 3. New operator workflows

### Independent language editions

Experiences now has Dossiers and Independent language editions views. The edition inventory uses server filtering, exact totals and pagination. Choose AR, FR or EN, family and live/draft/absent state.

Open an authored dossier and select Editions, actions & outputs. Language editions shows the three independent states. Author and save the chosen language, resolve its readiness issues, submit that edition for review, approve it with the configured native permissions, then publish or schedule it. Arabic live, French draft and English absent is a valid state.

Approval is bound to the selected edition definition hash. Editing another language's text does not invalidate that hash. Shared structural changes do. Publication keeps an immutable snapshot and separate active pointer for each language. Withdrawal affects only the selected edition. The Publication history retains restore, withdrawal, scheduling cancellation and rescheduling actions. The existing scheduler processes due editions; there is no additional worker resource to create.

Existing historical global releases are not rewritten or silently relabelled as three independent editions. They stay visible in Publication history. Publish an edition through the new controls when moving it onto the R5 pointers.

### Actions and real outputs

Ordinary reading, watching, listening, cards, quiz results, activities, tools, planners and downloads create no case, lead, customer account or message. The sixteen family identifiers and sixty-four historical viewer-mode identifiers remain retained.

The Actions & outputs tab binds real native PDF and PNG delivery files. Give each output a stable identity and a translated public label, choose format and whole/page/set scope, then select the file from the existing vault. Publication checks MIME compatibility, native availability and rights. Empty files do not become invented download buttons. Editorial images and other media do not automatically become downloadable resource sets.

A static PDF/image remains a static file. It is not described as an interactive quiz simply because a button is placed beside it. Structured questions and activities continue through their native engines. Legacy form/community receiving history is preserved; new ordinary public posting and generic intake are inactive. Forms are private self-service questionnaires. Legacy upload/contact-field forms must be adapted before a new autonomous edition can publish.

Ordinary DCE access must stay free and autonomous. Account, entitlement and payment authority remain native for explicit commercial journeys. Advertising readiness is separate from resource readiness; absent advertising does not permanently block a normal resource. Existing advertising hierarchy, child/audience restrictions, format ownership, provider readiness and protected-zone exclusions remain authoritative.

### Controlled HTML activity layout

Choice activities can use an optional controlled HTML layout. In Authoring, enable it and import a small HTML file or edit its markup for the chosen language. The supported vocabulary is article, section, div, h2/h3/h4, p, span, strong, em, ul/ol/li, button and br. Map a choice button with `data-dce-choice="task-id|0"` to a declared native task and zero-based choice index.

Uploaded scripts, styles, arbitrary attributes and network URLs never execute. The generated iframe has an opaque origin, a restrictive content policy and a validated message channel. Accessible native controls remain available. This is not arbitrary HTML application hosting, and its client activity feedback is not certificate score evidence.

### Optional course certificates

Only Learning courses have a Certificate policy tab. Enable the explicit request option per course and permitted language. Select manual review or a published, same-language server assessment; configure completion requirements, any score threshold, issuer and follow-up days. A score threshold requires server assessment. A displayed client percentage cannot certify itself.

The protected saved preview includes the optional request form as a labelled staff-only preview. It sends no real request or email. The server-only runtime contracts validate the exact current course release, visitor ownership, allowed units, completion acknowledgment and server-assessed answers. An explicit request, with contact consent, produces a unique reference. Normal practice does not produce intake. A visitor completion acknowledgment remains labelled as such and is not reclassified as verified learning.

The Certificate Requests sidebar destination supplies a paginated queue, language/status/search/assignment/overdue filters and a private dossier. Operators can assign an eligible native colleague, review evidence, retain private notes, record actual contact, schedule follow-up, request information, approve/reject/cancel, prepare a protected document case, issue a verified private PDF, replace it with a reason, close and reopen. Personal contact details do not appear in queue rows. History is paginated. Unsent note text is retained in the staff session on that device.

The PDF fulfilment workflow uses the existing private S: attachment authority. Prepare the actual certificate document, upload and verify it there, then record issuance. This delivery does not pretend that a PDF was generated, mailed or received when it was only logged. Opening a mail link is not evidence of dispatch or inbox delivery. Email operations remain on the existing native Email OS authority.

## 4. Verification evidence and boundaries

The evidence directory contains the actual isolated source/API/SQL results, browser results, installer tests and source-preservation report. Test records use example.test identities. Test database execution is not production activation. The preview harness supplies fixtures at existing external/native authority boundaries; it does not prove your S: server, Google account, public domain or production database deployment.

The original DCE stylesheet is byte-for-byte preserved. Public Marketplace pages, native product/service/course/B2B templates, import authorities outside DCE, authentication/social login, email infrastructure, Hotline, Finance and S: configuration are outside the installer scope.

The supplied ZIP is a scoped source capture. Source checks and bundled compilation do not replace the remote full Marketplace image build. The broader scoped TypeScript invocation encounters unchanged baseline/external dependency diagnostics in this partial capture; it is not reported as a clean full application typecheck. No new diagnostic should remain in delivered changed DCE modules.

## 5. Rollback and release

Use the source rollback command printed by the installer. It verifies all targets and backups before restoration and stops if later edits would be overwritten. It removes only newly created files that still match the installed bytes. It retains database records and all backups.

SQL is additive. Do not drop the R5 tables to roll back the UI. If edition publishing or requests have been used, retain their immutable records and references; prepare any database reversal against the actual current data. Reverting source does not convert independent editions back into a single global release.

After source installation and SQL activation, release through the existing Build Marketplace GHCR One-Off workflow, exact source SHA and immutable image digest, then Coolify. No new environment variable or extra worker resource is required for this admin increment.

## 6. What remains outside this Chapter 1 delivery

Public discovery routes, guest browser-session/rate-limit boundaries, actual public ad serving and provider callbacks, public downloads/results integration, live certificate request exposure and any automated communication need Chapter 2 integration and acceptance. Provider-owned Google approval and format availability remain external prerequisites. The inherited report adapter reports incomplete provider results honestly; this patch does not add unlimited report extraction or claim provider revenue as received Finance funds.

This package is a tested admin/source increment. It is not a claim that every future public capability or every master-contract acceptance has already been completed or deployed.
