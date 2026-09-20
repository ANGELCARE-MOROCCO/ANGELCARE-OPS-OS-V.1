# P07 Native Forms & Conversion Wiring — Certification

P07 binds Studio form blocks to existing Marketplace workflow authorities without creating a Studio-specific inbox, booking store, order store, enrollment store or subscription store.

## Certified workflow families
- General/Partner inquiry -> existing Public Inquiry authority.
- Service booking, quotation, Academy enrollment and Partner subscription -> existing Conversion Universe with pricing, availability, consent and confirmation gates.
- Authenticated family request -> existing Family Experience authority.
- Establishment/Hospitality/Health Partner/Corporate -> existing B2B public diagnostic authority.

## Authoring/runtime contract
Studio persists only a versioned workflow reference and canonical target reference. Authoring cannot submit live customer records. Public runtime renders the governed workflow and routes submission through the canonical server executor.

## Phase boundaries
P08 assigned-template public render switching remains OFF. P09 owns final attribution saturation. No SQL, migration, database schema change, local build or global TypeScript sweep is part of P07.
