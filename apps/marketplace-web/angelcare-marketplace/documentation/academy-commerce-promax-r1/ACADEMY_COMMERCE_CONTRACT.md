# Academy Course · implementation contract

## Visual composition

Professional light background, brand magenta, teal, gold and violet accents. Existing official header, horizontal navigation and standard footer are preserved. A large course identity, contained gallery, clickable outcome rail and enrolment card open the page. A source-based facts strip and section navigation lead to distinct chapters: description/insight panel, outcome bento, searchable curriculum, inclusion mosaic, audience/prerequisite context, learning brief, session cards, certification pathway, assessment, faculty, preparation process, policies, searchable public information, reviews, FAQ, independent adviser ribbon, selection recap and final course recommendations.

Selected states, gallery zoom, lesson preview dialogs, accordion transitions, scrolling recommendations and a mobile enrolment dock support orientation. The dock clears the footer. Keyboard controls, focus return, reduced motion, narrow layouts and Arabic RTL are included. Gallery, supporting images, help and recommendation images use object-fit:contain.

## Atomic data boundaries

The renderer accepts Academy data excluding preschool-admission. Supported course doctrines: academy-course, academy-cohort, certification-pathway, parent-workshop and institutional-training. Schema/import engines, category memberships, Academy course/cohort authorities, pricing and capacity are unchanged.

It maps PublicExperience360 and safe public Academy projections. In addition to public schema fields, a strict allowlist reads existing Product360 commercial copy: promise, highlights, inclusions, preparation, eligibility, exclusions, cancellation_copy, after_purchase and public learning/delivery/audience fields, including matching FR/EN/AR variants. Private import notes, source-job identifiers, passwords, costs, internal framework keys and trainer contact data are excluded. Public false and zero remain visible in the information explorer, but never become positive promises.

Published modules and lessons create the curriculum explorer. Descriptor-wrapped programme keys or outcome lists cannot become fabricated modules. Without modules, real learning outcomes become a clearly labelled objective explorer. Lesson preview links require an explicit preview permission and a safe URL. Hidden/draft modules, lessons, cohorts and profiles are excluded.

Course duration, format, language, level and participant range come from source. Group context is not used to invent a per-seat price. Unknown seat availability stays unknown; full, scheduled, closed-window or malformed-ID cohorts cannot be selected. The existing native cohort ownership/availability check runs again in the real enrolment journey. Cohort display follows the existing public projection, which currently caps its query at 12; this package does not claim to enumerate every database cohort.

A credential requires the existing Truth Report to prove certification, a published credential type and no explicit false certificate flag. Assessment criteria use published fields or positive canonical thresholds; default zero thresholds do not create badges. Reviews require the existing proven rating authority, and testimonial cards use only published review records. No fabricated trainer, reviewer, date, rating, certificate or scarcity is added.

Optional chapters disappear when their source is absent. Help, the existing enrolment action, truthful review state, process and final discovery remain useful with sparse data. Source text with no localized version follows the existing FR fallback; the UI itself is FR/EN/AR.

## Native journey

Existing per-offer/locale draft storage preserves published variant choices, cohort ID, learner type, organisation name, free-text goal and selected objectives. Required values and available variant combinations are checked before handoff. Selected objectives are joined into a bounded learningGoal intent; learnerType is individual/organization; organizationName is bounded. These are operational preferences, not prices or admission guarantees.

The CTA continues to the actual `/enrollment/[itemSlug]` route via the existing selection URL. ExperienceConfigurator consumes that intent and remains the final price, availability, session and confirmation authority. No parallel payment/enrolment engine is introduced.

The adviser dialog submits to the existing `/public/inquiries` API with audience=academy, explicit consent, contact information and learning brief. Failure keeps form inputs. Success requires a non-empty publicReference. No automatic POST retries occur.

The new recommendations GET endpoint reads the existing canonical discovery view and native category memberships using paginated/batched reads. Only published eligible Academy offers are selected; preschool admissions and other sellable domains are excluded. Explicit known schema takes precedence, inputs are not mutated, quote-only/zero-price semantics survive, errors keep source cards with retry and empty results provide Academy discovery.
