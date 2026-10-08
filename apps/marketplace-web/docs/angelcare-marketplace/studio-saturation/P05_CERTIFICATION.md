# P05 — Live Data Binding Engine Certification

P05 binds Studio template slots to current canonical Marketplace facts without copying business data into the template.

## Authorities

- Template selection: P04 Template Assignment & Inheritance Engine.
- Template document: exact published Experience Core template revision.
- Business context: Category-Native `AdaptiveExperienceData` read model.
- Pricing/availability display values: Category-Native authorities; final conversion revalidation remains outside P05.
- Media, schema public fields, variants and trust: existing Category-Native authorities.

## Binding contract

- 20 registered live bindings.
- 9 typed template targets.
- 4 explicit missing-data policies.
- `props.__studioBindings` stores instructions only.
- Hydrated values exist only in a cloned request-time Puck document.
- Unknown/incompatible instructions fail closed and are surfaced in the binding report.

## Authoring

- Puck block schemas expose one reusable **Données live** custom field when the block has compatible targets.
- Studio command surface exposes a **Données live** inspector.
- Inspector uses P02 canonical product/collection selection and P04 placement/template resolution.
- Preview endpoint calculates the exact bound result without mutating business data.

## Phase boundaries

- P06 dynamic-source composition: not implemented.
- P08 public renderer switch: not implemented; current Category-Native public rendering remains authoritative.
- SQL/migration/schema change: none.
- Local production build/global TypeScript sweep: forbidden and not executed.
