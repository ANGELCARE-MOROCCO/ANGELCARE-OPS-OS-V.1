# ANGELCARE Marketplace — Category-Native Commerce Control Plane MZ1

## Implementation report

This delivery establishes the first half of the unified Category-Native Commerce, Experience and Self-Service Engine. It is cumulative over the accepted Marketplace and does not replace the existing catalogue, homepage, Finance, Inventory, Territory, Family, Academy, CRM, Partner OS, Quality, Provider or audit authorities.

## Delivered scale

- **31 governed commercial archetypes**
- **840 field definitions** shared across administration, CSV, public projection metadata and operations handover
- **4 variant-group definitions**
- **16 category-aware homepage block definitions**
- **31 category-specific CSV reference templates**
- **7 protected administration workspaces**
- **12 protected API route families**
- **1 ordered additive migration** and **1 data-preserving rollback**

## Product surfaces

1. Category-Native Command
2. Experience Schema Architecture Studio
3. Purpose-built Archetype Studio
4. CSV Template Factory
5. Category-Native Import Command
6. Homepage Designer 2.0
7. Commerce Studio integration

## Architectural law

The Experience Schema Registry is the persistent contract between:

`Admin Studio → CSV → Validation → Homepage → Public template → Conversion → Operations handover → Analytics`

The current MZ1 delivery completes the administrative control plane and records the public/conversion/handover template contracts that MZ2 will consume. It does not duplicate public customer journeys already present in the Marketplace.

## Safety

- No approval queue was introduced.
- All ordinary actions remain direct for authorized administrators.
- Mutations pass through protected server APIs and are audited.
- Import execution is separated from dry-run validation.
- Rollback preserves schema, import, catalogue and audit history.
- No build, Git operation, deployment or automatic SQL execution belongs to the installer.
