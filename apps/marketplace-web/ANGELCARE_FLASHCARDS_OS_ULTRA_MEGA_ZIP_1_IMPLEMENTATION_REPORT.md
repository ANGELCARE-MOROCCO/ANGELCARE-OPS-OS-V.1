# ANGELCARE FLASHCARDS OS — ULTRA MEGA ZIP 1
## Sovereign Foundation, Portfolio and Collection Operating System

**Delivery status:** implementation package complete  
**Canonical route:** `/flashcards-os`  
**Repository placement:** `apps/ops-web/app/(protected)/flashcards-os`  
**Database namespace:** `flashcards_os`  
**Delivery doctrine:** additive, protected, tenant-contained, no unrelated module rewrite

## 1. Delivered operating capability

Ultra Mega ZIP 1 establishes the sovereign foundation of ANGELCARE Flashcards OS. It is not a catalogue mock-up. It introduces the protected product operating shell, data-driven taxonomy, canonical collection registry, twelve-section collection dossiers, card-level editorial registry, legacy catalogue integrity ledger, permissions, tenant containment, RLS, audit, event outbox and runtime fallback.

The implementation deliberately does **not** contain Tavily, OpenRouter, prompt-command compilation, Windows Product Vault, sellable-composition, learning-journey, CRM, invoicing or after-sales implementations. Their master universes remain visibly contracted and inactive until their signed Ultra Mega ZIPs. No fake page or static “completed” workflow has been used to simulate later scope.

## 2. Runtime architecture

```text
Protected /flashcards-os route
        ↓
Flashcards OS permission boundary
        ↓
Purpose-built server and client workspaces
        ↓
Application mutation APIs with server-side RBAC
        ↓
Tenant-filtered service repository
        ↓
public.fc_os_* server compatibility views
        ↓
flashcards_os canonical schema
        ↓
RLS · audit ledger · transactional outbox
```

The application can boot in two controlled modes:

- **Database live:** the UMZ1 migration is installed and all create/update/arbitration commands are active.
- **Catalogue seed evidence:** the interface remains inspectable from the immutable seed if the migration is not yet present. Mutating commands fail safely instead of inventing persistence.

## 3. Protected workspaces delivered

| Route | Individual layout | Operational purpose |
|---|---|---|
| `/flashcards-os` | Executive Command Theatre | Portfolio pressure, lifecycle, data integrity and decision queue |
| `/flashcards-os/product` | Portfolio Landscape | Portfolio architecture, readiness, domains and product control |
| `/flashcards-os/product/taxonomy` | Product Taxonomy Atlas | Expandable hierarchy, coverage matrix, node inspection and category creation |
| `/flashcards-os/product/collections` | Collection Registry | Search, filtering, product identity, readiness, historical facts and collection creation |
| `/flashcards-os/product/collections/[collectionId]` | Collection Dossier | Product passport, lifecycle, twelve dossier sections, edition/format lineage and governed editing |
| `/flashcards-os/product/collections/[collectionId]/cards` | Card Content Registry | Stable card sequence, editorial matrix, card inspector and real-source content entry |
| `/flashcards-os/governance/import-control` | Catalogue Integrity Ledger | Source anomalies, doctrine, dossier linking and governed human arbitration |

Additional route-quality surfaces:

- Root loading state
- Controlled error state
- Product dossier not-found state
- Responsive shell and contextual navigation

## 4. Six-master navigation doctrine

The shell exposes exactly six master universes:

1. Command
2. Product
3. Intelligence
4. Solutions
5. Revenue
6. Delivery & Experience

Only **Command** and **Product** are active in UMZ1. The other universes are visible as contracted delivery boundaries, marked by their future Ultra Mega ZIP number, and cannot mislead users into believing unfinished engines exist.

## 5. Legacy catalogue structuring

The supplied 2022 catalogue has been transcribed into a canonical seed and SQL migration without silently correcting source issues.

| Evidence metric | Value |
|---|---:|
| Canonical collection records | 103 |
| Master product domains | 10 |
| Active/legacy subdomains | 12 |
| Total taxonomy nodes | 22 |
| Known card quantity total | 1,352 |
| Collections with N/A quantity | 9 |
| Historical unit-price sum | 2,956 Dh |
| Preserved anomaly decisions | 18 |
| Collections carrying anomalies | 15 |

Domain distribution:

- Language: 22
- Geography: 30
- Mathematics: 18
- Zoology: 17
- General Knowledge: 16

The seed preserves duplicate names, repeated source lines, missing card quantities, numbering anomalies and taxonomy-review flags. The catalogue does not provide card-by-card content, so `structuredCardCount` begins at zero and no card concepts, texts, translations or activities were fabricated.

## 6. Canonical collection dossier contract

Every collection exposes twelve governed sections:

1. Product identity
2. Doctrine and objectives
3. Audience intelligence
4. Structured card register
5. Product and format specification
6. Research and evidence
7. Product design
8. Production commands
9. Sources and final deliverables
10. Quality and approvals
11. Costing and commercial readiness
12. Performance and customer learning

UMZ1 activates the foundation sections and preserves the correct contracts for future engines. Future sections are clearly marked with their delivery boundary and are not presented as live functionality.

## 7. Database foundation

The additive migration creates 20 canonical tables:

- `portfolios`
- `product_families`
- `categories`
- `collections`
- `collection_versions`
- `editions`
- `formats`
- `variants`
- `cards`
- `collection_relationships`
- `collection_dossier_sections`
- `import_batches`
- `import_issues`
- `workflow_approvals`
- `comments`
- `assignments`
- `audit_events`
- `outbox_events`
- `configuration`
- `permission_catalogue`

Key controls:

- Internal `tenant_key` on every canonical table
- RLS enabled across the namespace
- Authenticated tenant-read policy on canonical tables
- Browser roles revoked from public compatibility views
- Service-role-only writes after server-side AngelCare RBAC
- Tenant-filtered repository reads and writes
- Immutable approved/superseded collection versions
- Updated-at triggers
- Structured-card count reconciliation RPC
- Audit ledger
- Transactional outbox
- Safe access-module and access-route registry integration

## 8. Permissions delivered

- `flashcards_os.view`
- `flashcards_os.manage_portfolio`
- `flashcards_os.manage_taxonomy`
- `flashcards_os.manage_collections`
- `flashcards_os.manage_content`
- `flashcards_os.approve_product`
- `flashcards_os.audit`
- `flashcards_os.admin`

Privileged AngelCare roles are recognised at the module boundary. All API mutations independently re-check their required permission.

## 9. Mutation APIs delivered

- Create a taxonomy node
- Create a canonical collection
- Update a collection dossier
- Create a real card record
- Arbitrate a legacy import issue with mandatory justification

Every mutation validates input, resolves the current actor, enforces permission, uses tenant-contained persistence, records an audit event, writes an outbox event and revalidates affected application paths.

## 10. UI/UX implementation standard

UMZ1 includes eight purpose-built workspace components and a 691-line isolated design system. The interface uses a premium white enterprise language, compact executive density, strong information hierarchy, controlled gradients as accents, visible lineage and decision-first interaction.

It intentionally avoids:

- A sidebar containing dozens of equal buttons
- A generic repeated dashboard template
- Childish flashcard decoration
- Dark application theme
- Raw database identifiers as primary labels
- False AI controls
- Invented card content
- Historical prices presented as current commercial truth

## 11. Verification executed

Completed gates:

- 29/29 UMZ1 acceptance checks
- 21/21 catalogue integrity checks
- 25/25 SQL architecture checks
- 28 TypeScript/TSX files transpiled through the TypeScript syntax gate
- 49 local module imports resolved
- Strict isolated static TypeScript gate passed

A full Next.js application build was not run, in accordance with the signed terminal policy. The attached source did not include a complete `node_modules`; the execution environment’s package mirror also lacked one transitive package. Therefore, the package includes both the real dependency-backed `tsconfig.flashcards-os-umz1.json` and the self-contained static gate. The real config is executed automatically by the verification script whenever the target repository has its normal dependencies installed.

## 12. Non-regression and future contract protection

UMZ1 does not modify an unrelated runtime module. Later Ultra Mega ZIPs must remain cumulative and may not:

- Replace the product truth with files
- Generate final creative assets internally
- Remove source evidence
- Convert historical prices into active prices automatically
- Collapse B2C and B2B into one generic CRM
- Replace purpose-built layouts with a shared generic template
- Bypass audit, permission or release lineage

