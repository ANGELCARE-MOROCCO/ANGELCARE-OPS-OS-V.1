# Existing native KidFlix editors

Open the existing DCE KidFlix homepage editor or sixteen-storefront editor. Existing view, manage and publish rights still apply. Select the language edition; for a storefront, select its native world.

The opening gallery accepts three to six scenes. Each scene has a stable ID, desktop image, optional mobile image, English/French/Arabic descriptions, and desktop/mobile focal coordinates from 0 to 100. Use the existing Media Library picker to bind native images. Reordering follows scene identity. Editing an image URL clears that source's native binding so a stale selection cannot be saved as if it still matched.

Use the arrow buttons to reorder scenes and Remove to remove a scene when more than three remain. Add scene offers an unused default or an editable blank source; complete it before saving. Distinct desktop sources, unique scene IDs, safe URLs, descriptions and focal values are validated at save. Mobile images fall back to desktop on loading failure.

“Adopt new default scenes” explicitly replaces the current gallery with this delivery's three original scenes for the selected world. It removes gallery bindings in that draft while retaining unrelated bindings. The command service retains references used by other drafts and published language editions. Existing operator-selected custom images are preserved when legacy editions are normalized; only exact known packaged defaults are adopted automatically.

Save draft, reload it and use the existing preview action. Homepage preview obtains current published inventory through the existing catalogue service; storefront preview uses its existing service. Both render the actual public components with the reviewed draft gallery. A catalogue failure is reported and retained data is not silently erased.

Publication remains a separate, explicit action for the selected language. The existing revision, receipt, reviewed-draft hash and publication permission checks remain in place. No live edition was saved or published during this assignment.

Gallery controls support previous/next, direct scene selection, pause/resume and arrow keys. Automatic progression waits three visible seconds and successful image decoding. Hover, keyboard focus, off-screen/background visibility and reduced-motion preferences pause progression. A failed next scene leaves the current valid scene visible and offers retry.
