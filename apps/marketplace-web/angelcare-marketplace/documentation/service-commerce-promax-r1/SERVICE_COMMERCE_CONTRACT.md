# Service Commerce · implementation contract

## Visual experience

Light professional body; the official global header, horizontal navigation and footer remain untouched. A contained gallery, service identity and progressive booking panel open the page. Published facts use semantic icons. Published inclusions become a readable mosaic. Duration/formula comparisons, weekly planning, a four-step journey, preparation accordions, territorial context, public profiles, policy details, a searchable field explorer, reviews, FAQ, an independent advice ribbon, selection recap and final native service recommendations create different compositions.

Hover, reveal, selected states, gallery zoom and a mobile action dock support orientation. The dock clears the footer. Reduced motion, keyboard use, focus return, RTL and narrow screens are supported. The page never crops offer images. Media fitting applies to the gallery, supporting images and recommendation cards.

## Atomic conditional behaviour

All source data is mapped from PublicExperience360. Present public fields keep zero and false values in the detailed explorer. False capabilities do not become included services or selectable paid promises. Optional chapters disappear when their source is absent. No fabricated stock pressure, ratings, reviewer identities, professional profiles, duration prices or availability claims are introduced.

The registered one-time home-childcare schema takes placement precedence over stray recurrence data. Recurring services can expose the published days, rhythms, commitment/pause/change conditions and a weekly preference preview. Other Service schemas use their public sections and safe variant choices. The UI does not change category membership, the atomic schema registry, import contracts or Product360 authority.

The following commercial fields are additionally read from a strict public allowlist when present in the existing extension: promise, highlights, inclusions, preparation, eligibility, exclusions, cancellation_copy and after_purchase. Matching localized variants are supported. Import notes, job identifiers, supplier costs, private metadata and arbitrary extension contents are not serialized by this page.

Reviews show a source rating/count only when the existing Truth Report proves the rating. Without that proof, the page shows a neutral no-published-reviews state and a help action. No fake testimonial text is created. Provider profiles appear only when supplied through the existing public service projection.

## Selection and authority

The page retains per-offer/locale choices with the existing atomic selection mechanism. Published variant combinations and required choices are checked before handoff. Preferred date/time/location, service duration, selected native variant values, recurring days/rhythm and a bounded child count continue into the native booking configurator. Child count is separate from quantity and does not determine price.

The native configurator remains the final price, capacity, availability and transaction authority. A preferred day or time is never represented as a confirmed slot. An invalid, archived or unavailable variant cannot be treated as a valid selectable combination. The detail page does not create a second booking or payment engine.

The advice dialog submits to the existing public family enquiry endpoint with explicit contact consent and the selection brief. It retains entered information after an error. Success requires a valid public reference. No automatic retry creates a duplicate enquiry.

## Recommendations

A new read-only Service recommendation endpoint resolves real canonical published services. Native category membership ranks related services first, then schema/fallback relevance. Existing territory scope, pagination and member-ID batching are retained. Products, courses, B2B offers, draft rows and the current item are excluded. Canonical rows are not mutated. Errors remain visible and can be retried; an empty selection offers catalogue discovery. Cards use native detail links and contained images.

## Protected boundaries

Only the Service module, its GET endpoint, its new Studio pack, documentation and six integration files change. The integration patches add Service dispatch, editable Service chapters and bounded child-count intent. Product code, global shell, Homepage, Families, catalogue/import authorities, authentication, email delivery, conversion handlers and proxy remain unchanged. The package executes no SQL and changes no database assignments.
