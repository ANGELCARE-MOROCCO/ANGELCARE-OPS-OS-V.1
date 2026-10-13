# Service media and Studio controls

## Editable Service composition

The pack contains 17 chapters: opening, signals, description, included, plans, planning, process, preparation, coverage, providers, conditions, details, reviews, faq, assistance, recap and recommended.

The Service renderer supports section order, localized titles/leads, chapter selection, explicit hiding and desktop/tablet/mobile visibility. Existing locale, territory and audience eligibility is evaluated before these sections are projected. Core booking controls continue reading the published schema and native choices.

`serviceRole` identifies the delivered Service chapter. `serviceCommerceRevision: 1` selects this renderer. The older generic Atomic canvas remains its normal editor representation; the public preview uses this Service renderer. Arbitrary imported CSS, foreign code, and arbitrary changes to a chapter’s business behaviour are not part of this revision.

## Offer media mapping

Primary/gallery images are the current offer’s public media. Additional presentation uses existing media keys, configurable in the Service world’s `serviceMediaSlots`:

| Slot | Default key | Display |
| --- | --- | --- |
| context | context | Supporting description visual when no description slot is supplied |
| description | description | Optional visual beside service description |
| included | included | Optional visual beside published inclusions |
| detail | detail | Optional supporting Service details visual |

Use your existing Product360/Media Vault tools to add media to the offer and choose matching keys. If a key is absent, that visual is omitted; the page does not substitute an unrelated service photo. The slot stores a media key, not a new private path or uncontrolled external asset. The only independent, fixed editorial photograph is the already-installed neutral Service help image; it illustrates AngelCare advice, not the purchased service, a named agent or a verified customer.

The gallery retains image/video/audio/document support with contained images, thumbnails, zoom, keyboard navigation and image swipe. Closing the media dialog pauses its media. Recommendations use each related service’s published media.

## Offer completeness

Populate description, public inclusions/highlights, preparation, scope/coverage, eligibility, cancellation and handover terms in the native public fields. Populate actual options and public price data if you want formula comparisons. Populate recurring days/rhythm and limits in the recurring schema if you want those controls. Reviews and public professionals require their existing evidence/source authorities. The template remains usable when these optional fields are absent.

The preview’s captured offers are snapshots. They do not establish that every live item already has every field filled. The recurring scenario is a local verification fixture and must not be used as evidence of a live recurring offer.
