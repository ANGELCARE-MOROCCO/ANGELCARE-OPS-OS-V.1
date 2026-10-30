# KidFlix Publication Quality R1

Baseline: `47ef7c722114e019fb190da660df88d2531665c9`, branch `upgrade/next-angelcare-upgrade`.

## Confirmed incident and correction

The public resource sanitizer rejected relative `/api/` URLs. Native uploaded files use `/api/angelcare-marketplace/media/<UUID>/<filename>`. Admin previews accepted this native delivery path while public card projection and public player lookup rejected it. The same published PDF could therefore open in admin and disappear on the public page; a native cover could disappear from its storefront card.

Resource media now has a shared validator accepting that exact native authority and supported rendition variants. Unrelated admin/API paths, unsafe schemes, credentials, traversal and malformed native paths remain rejected. The separate editorial artwork policy stays unchanged. No access permissions or media gateway configuration are relaxed.

## Changes included

| Area | Result |
|---|---|
| Public discovery | Native editorial covers survive card projection for all sixteen categories, including Documents. |
| Public detail | Native file bindings survive sanitization and player lookup. Native PDFs open through the same delivery authority as admin previews; external PDFs retain the existing reader proxy. |
| Fast Creation Studio | A visible editorial-cover section offers native upload, library selection, preview and removal. Publication identifies a missing cover before proceeding. |
| Source contracts | Documents, course sources and printable planners retain their native MIME restrictions. |
| Publication inspection | Checks the actual sanitized public manifest, cover and schema media placements; incompatible or unavailable bindings produce exact field paths. |
| Public journey checks | Reports domain, published edition, discovery, category, detail, cover and source readiness separately. Preserves completed stages when another service fails. |
| Documents languages | The filter explicitly identifies the content language. An empty selection offers all content languages when other published languages are available. |
| Admin preview | Changing saved revision, language or release clears old bindings and resets the native preview state. |
| Uploads | File receipts retain their target language. A removed or replaced queue entry cannot overwrite the current selection when an earlier upload finishes. |
| Publication receipts | Records the exact sent revision/signature. Later edits remain draft changes; they are not mislabeled as published. |
| Language selection | Selecting another existing content edition preserves its authored title rather than overwriting it with the previous edition's title. |
| PDF facts | Actual page counts captured on upload survive publication and language projection. Unknown counts are displayed as source documents, not invented physical page counts. Zero means unknown. |
| Text articles | An article without an attached file no longer produces a false missing-file error. |
| Document downloads | Public detail actions use the existing Documents output-delivery endpoint, retaining release checks and native download recording. Admin previews do not record public downloads. |

## Installation and deployment

No new SQL, environment variables, npm dependencies or infrastructure services are required by this patch. Keep the previously applied public-discovery and native-media compatibility SQL. This installer changes only its listed files, verifies native dependencies, retains backups and provides rollback. It does not run SQL, a full application build, git commit, push or deployment.

1. Apply the supplied self-contained installer to the repository root on the expected branch.
2. Review the printed receipt and keep the extracted installer directory.
3. Release through the existing Marketplace GHCR One-Off workflow and deploy the exact source SHA in Coolify.
4. Open the French Documents storefront and the published `kf-dg-dev-01` detail page. Confirm the cover and the actual PDF. Test one published download and check the native public-journey panel.

For the reported native URL rejection, existing valid published bindings recover through the new public projection after deployment. Re-uploading the same PDF or changing SQL is unnecessary. If a cover was never linked to the published language edition, the patch cannot invent that association: choose the real PNG in the new cover section and publish that edition once. Unpublished languages and withdrawn media remain unavailable by design.

## Verification and evidence

The package includes evidence JSON for model, service, upload and installer checks. Tests use the real projection, hydration, media lookup, schema validation and publication-status code with simulated database/HTTP transport. They reproduce the old native-URL rejection before testing the correction.

Browser verification rendered the actual ten-page supplied PDF and actual square editorial cover inside the native detail components. It also exercised cover removal and exact validation, native library selection, save → inspect → publish, subsequent draft edits, exact correction navigation, the all-content-languages action and text-only reading. English, French and Arabic RTL rendered with one main heading and no page overflow at the tested desktop width. These are isolated component fixtures, not a write to the production database.

The browser file-picker automation stalled and is not counted as a passed live-upload test. Native upload logic was tested separately with the real PDF bytes and simulated preflight/upload/verification responses, including duplicate reuse, verification failure and abort. Production authoring authentication, live media transport for every asset, every viewport and the full application build were not certified by these isolated tests.

The public health panel verifies published data and usable URL contracts. Its `fileTransport: not_checked` field deliberately does not claim that a successful data check proves actual byte delivery. The deployed page, PDF and download must also be opened. No honest source audit can guarantee the absence of every latent defect in the entire repository.

## Rollback

Use the exact rollback command printed by the installer. Rollback verifies all backups before writing and refuses to overwrite later edits. No database rollback is needed for this patch.
