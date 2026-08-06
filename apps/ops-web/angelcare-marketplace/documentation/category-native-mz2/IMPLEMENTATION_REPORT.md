# ANGELCARE Category-Native Mega ZIP 2 — Implementation Report

## Mission

Mega ZIP 2 transforms the Marketplace customer frontend from a shared catalogue-detail model into a schema-driven family of vertical applications. Mega ZIP 1 remains the sole commercial-definition authority; Mega ZIP 2 consumes those definitions and executes them for customers and operations.

## Major delivered systems

### 1. Adaptive public resolver

The resolver reads the catalogue item, active Experience Schema, schema version, locale, territory, media, variants, attributes, price presentation, availability authority, Trust evidence and recommendations. It returns one normalized `AdaptiveExperienceData` contract used by every public experience.

### 2. Thirty-one differentiated experience families

The registry covers care services, recurring schedules, school pickup, overnight and urgent care, hotel and event childcare, holiday programmes, development services, educational products, preschool admissions, Academy, B2B, Partner OS, Quality Check 360 and managed solutions.

Each family has its own story, customer guidance, relevant specifications, configuration priorities, Trust positioning and operational continuity. The schema—not route-specific duplication—controls the fields.

### 3. Self-service configurator

The configurator supports text, numbers, money, dates, times, booleans, selections, multiselections, territories, lists and structured long-form fields. It renders schema variant groups, preserves administrator-configured defaults, records customer identity once, and requires explicit terms/privacy consent. Non-medical schemas receive an additional boundary acknowledgement.

### 4. Canonical revalidation

MZ2 does not calculate uncontrolled prices or invent capacity. It delegates price and availability revalidation to the accepted Conversion Universe, which in turn uses Finance, Inventory, Provider, Academy, corporate quota or manual-review authorities according to the offer.

### 5. Conversion and handover continuity

Category-native sessions wrap the canonical conversion session. On commitment, a durable configuration snapshot and handover event are stored with schema key/version and canonical outcome references. Operations receive the exact customer configuration rather than a generic note.

### 6. Category-native discovery

Marketplace discovery now carries schema and experience configuration metadata. Search exposes schema-generated filters, category-native result cards and same-archetype comparison. Homepage cards display concise archetype-specific signals while preserving the accepted Homepage Flagship composition.

### 7. Mon ANGELCARE continuity

A protected continuity route exposes the immutable customer selection attached to the canonical journey. Re-entry of already supplied data is therefore unnecessary unless an operational change requires it.

## Persistence

Seven additive evidence and continuity tables are introduced:

1. `angelcare_marketplace_experience_sessions`
2. `angelcare_marketplace_experience_configuration_snapshots`
3. `angelcare_marketplace_experience_price_results`
4. `angelcare_marketplace_experience_availability_results`
5. `angelcare_marketplace_experience_handover_events`
6. `angelcare_marketplace_experience_render_events`
7. `angelcare_marketplace_experience_errors`

The migration also adds non-destructive schema/handover metadata to existing conversion records and refreshes the catalogue-discovery view with category-native fields.

## Source quality evidence

- 155 static contractual checks passed.
- 37 TypeScript/TSX files passed syntax validation.
- 42 roots passed a lightweight virtual semantic TypeScript check.
- Installer rehearsal passed without build, package installation, Git, SQL or deployment.

## Scope boundary

Visual SVGs are design concepts, not browser screenshots. The runtime runner is included for the user’s deployed environment. No live operational result is claimed without executing it against real records.
