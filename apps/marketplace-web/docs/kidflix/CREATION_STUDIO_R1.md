# KidFlix Creation Studio R1

## Release

Reviewed source: `d492d1ccbae0bc241bbb49d7732cc2dacadf0336`. The ten integration files were also read back unchanged at `4f2f489945398d1472432d7c9ae1cbc96dd8b6ae`.

1. Apply the guarded installer. Keep its installer directory and backup journal.
2. Run the complete `angelcare-marketplace/digital-customer-experience/database/INSTALL_CREATION_STUDIO_R1.sql` in the **existing Marketplace Supabase SQL editor** before deployment. The Mac installer copies it to the clipboard. This is an additive, service-role-only wrapper around the installed R5/R6 language-edition authority; it creates no new database or infrastructure service.
3. Use the existing GitHub **Build Marketplace GHCR One-Off** workflow and exact-commit GHCR/Coolify release process. This installer does not install packages, build, commit, push, execute SQL or deploy.
4. Open Digital Customer Experience and choose **Add a resource**. Inventory Map category/subcategory creation and the targeted import route open this same workspace.

`pdf-lib`, React and the existing media services are reused. No new production npm dependency, environment variable or worker is introduced. Existing native DCE R5 and Operator R6 migrations are prerequisites. A missing activation is displayed before direct publication.

## Everyday French PDF journey

Choose Documents, drop the PDF, confirm the suggested title and relevant classification/audience, then choose **Publier maintenant**. The workspace creates the native draft, uploads or reuses the native file, binds its stable reading unit and prepares the French edition. Its file preview and PDF page count come from the actual selected file. Other languages are optional and remain separate editions.

The initial authoring language is French when enabled. The operator's subsequent choice is remembered within their own browser profile and native scope. The admin interface may independently be English, French or Arabic RTL. Existing world authoring restrictions remain enforced by canonical save.

Resource titles and units are generated from filenames as editable suggestions. Age ranges and audience stay visible. The system never generates learning goals, correct answers or copyright declarations from an unsupported guess.

## Category workspaces

| Category | Primary content |
|---|---|
| Documents | PDF or written article/chapter units; no separate editorial-library record required |
| Printables | PDF/image sheets with ordering and existing print controls |
| Stories | Illustrated/written pages; optional native narration and cue controls |
| Learning | Video, PDF, audio, image or written lessons; genuine video-only and assessment-linked modes retain their specific requirements |
| Video | Native video file with browser-detected duration; optional chapter/caption collections |
| Audio | MP3 recording or ordered playlist; optional native chapters, transcript and sound associations |
| Visual cards | Text/image fronts and optional backs; native sorting controls available |
| Presentations | Image/text frames, ordered with drag-and-drop or accessible arrows |
| Assessments | Question cards with correct-answer selection, numeric/text/true-false/multiple-choice support and structured row intake |
| Activities | Matching, memory, sequence, sorting, choice and bridge builders; protected identifiers and positions managed by the editor |
| Tools | Supported native calculation models, actual assumptions and authored inputs |
| Planners | Printable PDF/image sources or editable fields; printable-only resources no longer require a fabricated checklist |
| Private questionnaires | Private question/step authoring; public contact collection, attachments and booking submission are not represented as supported features |
| Community archives | Curated read-only archive entries, with visitor posting disabled |
| Commerce-linked resources | Eligible existing native offers and editorial context |
| Bundles | Existing native experiences, sequence and optional prerequisites |

Every category uses its native schema. The advanced drawer retains declared fields and collections; bounded classification lists are selectable rather than technical codes to type. The complete expert editor uses the same canonical dossier. Published templates and the existing eight structured import task types remain available.

## Files, batches and recovery

- A batch can produce one resource per file or one ordered resource containing the selected files. Audience/age settings can be applied explicitly across the batch; a subcategory is copied only within the same category.
- Native MIME permissions and upload preflight remain authoritative. Current ordinary uploads support JPEG/PNG/WebP/AVIF/SVG, MP4/WebM, PDF and MP3. A broad file chooser does not expand server eligibility. Captions can be authored through native cue collections; no new arbitrary-file upload permission is introduced.
- CSV/TSV or pasted spreadsheet rows receive automatic column suggestions and stable identifiers. For quiz corrections, choose exact answer text, letters or one-based positions explicitly. Ambiguous answer text is rejected. No manually authored resource/unit UUID is required for ordinary creation.
- Existing size and collection limits are preserved. Oversized row groups are rejected before insertion with an instruction to split them into resources. Content lists paginate instead of rendering thousands of controls at once.
- Draft recovery and failed save/publication receipts are isolated by actor and native scope. Failed saves replay their original receipt before saving later changes, preventing duplicate draft creation after a lost response.
- File bytes are not stored inside draft JSON. Completed native file references survive refresh. An uploaded file awaiting verification can finish from its saved receipt; an unfinished transfer whose local bytes were lost requires reselection of the same file, checked by SHA-256. This is not a chunked resumable-upload protocol.
- Publication returns a real active-edition receipt before showing a public link. Editing a published resource creates a changed draft; the older public edition remains reachable until another successful release.

## Publication policy and atomicity

For an actor with manage and publish permissions, one Publish action uses the existing canonical save and edition manifest construction. A new SQL transaction wraps native review, approval and release together. Exceptions roll back those publication transitions and their receipts; the saved draft and older live release remain intact.

Configured independent review and blocking editorial tasks remain enforced. The workspace exposes an independent-review policy at the start and changes its action to submission for approval. It does not silently change organizational policy or give an editor publishing permission.

Atomicity applies to one resource's publication transitions. External file transfer, draft saving and each item in a batch have independent receipts. A batch reports successes and failures individually, retaining unfinished resources for correction.

## Existing capability boundaries

The browser's native PDF viewer handles pages inside a whole PDF; KidFlix units represent authored chapters/files. This patch does not perform OCR, PDF-to-quiz conversion, PDF raster-cover generation, arbitrary JavaScript-game execution, SCORM/H5P/PPTX conversion or AI translation. Correct questions, answers and educational facts remain authored data. Ordinary quiz feedback is not a formal proctored gradebook.

## Verification scope

The package includes verification notes and isolated test evidence. Browser workflows used simulated native API responses; SQL tests used the actual installed R6 edition RPC in an isolated PostgreSQL-compatible test database. These are not live Supabase, gateway or deployed-site acceptance tests. No full local Marketplace build was run. Your existing exact-source CI build and deployed native services remain the final runtime gate.

## Rollback

Use the printed rollback command. It verifies all target hashes and original backups before restoring application files and refuses to overwrite later edits. The additive SQL wrapper is left installed, harmlessly unused after source rollback, so existing publication data and releases are preserved.
