# KidFlix Universal Experience Master — Visual Studio Authoring Addendum

The **existing universal master** remains authoritative. This addendum teaches creators how to make a rich, independently authored HTML/CSS/JavaScript project editable through the KidFlix Experience Studio without sacrificing its design.

## Required from all AI builders

1. Preserve the approved KidFlix `family_key` from the existing 16 atomic families. Never invent a parallel category or separate publication route.
2. Select **exactly one** `target_locale` from `fr`, `en`, `ar` for the deliverable. Do not automatically generate three editions. If the language is missing, ask the requester before creating anything.
3. Use the verified KidFlix host-supplied official logo. Do not embed, redraw, hallucinate or recolor the trademark. Leave a discreet corner clear for the official host authenticity overlay.
4. Keep complete source files, self-hosted fonts, graphics, audio, scripts and dependencies inside the package, and preserve real paths and rights metadata.
5. Write meaningful `data-kf-edit="stable_unique_id"` attributes on author-editable elements such as major headings, illustration containers, cards and action buttons. Unique IDs must match `[A-Za-z0-9_-]{1,80}`. Example:

```html
<h1 data-kf-edit="hero-title">Discover the forest</h1>
<button data-kf-edit="start-action" type="button">Start exploring</button>
```

6. A stable HTML `id="unique-id"` also enables visual identification. If an element lacks either a stable id or `data-kf-edit`, the inspector may select it in preview, but edits cannot be persisted as reliable CSS overrides.
7. Place design tokens and editable CSS in a local `.css` file. The Studio can create an immutable CSS override revision for properties such as color, background color, font size, padding and border radius.
8. Do not rely on the inspector to reverse-engineer arbitrary minified JavaScript or canvas contents. Expose meaningful source code, editable content structures and stable scene IDs instead.
9. Use the official KidFlix JS bridge for authorized save, resume, progress and completion signaling. Host permissions and authoritative scoring remain outside untrusted experience code.
10. Provide accessible labels, alt text, sensible focus order, touch and keyboard interactions, and responsive FR/EN/AR layouts (RTL for Arabic).
11. Treat preview interactions as tests, not automatically approved publication. The existing native Content 360 dossier remains the authoritative release workflow.
12. Test the full user journey and return one executable importer-ready ZIP with the real manifest, resources, code and accurate licensing details.

## Studio workflow

**Start → Understand → Perfect → Experience → Publish → Manage**.

- **Understand** reads source files without executing them and identifies missing local references, external dependencies, potential interactive controls and accessibility warnings.
- **Perfect** supports a source editor, individual media workbench, exact-match batch replacements and revisions.
- **Experience** provides real sandboxed preview, device switches, preview-only element selection, runtime errors and a safe CSS override workflow.
- **Publish** links the selected immutable package to the native Content 360 dossier; only existing native publishing authority can activate a public release.
- **Manage** opens previous package revisions and compares file changes, without overwriting the published original.

## Important

This document is a **supplement** to the existing `KIDFLIX_UNIVERSAL_EXPERIENCE_MASTER.zip`. It does not replace or modify that archive and is not a deployable experience by itself.
