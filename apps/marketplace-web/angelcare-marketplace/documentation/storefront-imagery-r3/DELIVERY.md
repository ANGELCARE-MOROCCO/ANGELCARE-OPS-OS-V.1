# Ten storefronts: dedicated editorial imagery R3

This installer replaces built-in editorial imagery across Corporates, Establishments, Health Partners, Hospitality, Partner OS, Professionals, Quality Check, Development, Kits and Academy. It requires the installed Business Worlds R2 source.

The package contains 54 independently generated editorial photographs in ten separate collections. No photograph is shared between storefronts. Compatible contextual slots may reuse a photograph within their own storefront. Each source prompt and image assignment is included in the package.

The photographs illustrate the storefront's purpose. They do not document actual named AngelCare staff, facilities, products, software screens, certifications or customer outcomes. Canonical product/service media and existing operator-supplied hero media keep their current precedence. Real catalogue photographs are not replaced by generated editorial imagery.

Generation method: one built-in image-generation request per dedicated scene, followed by WebP encoding at the original 1536×1024 dimensions. These are editorial illustrations, not product photography or fabricated evidence. PROMPTS.json records all 54 scene prompts.

## Surgical scope

Four existing source files change only their editorial-image URL binding: Shared.tsx, EducationalDiscovery.tsx, ImmersiveStorefront.tsx and SignatureExperiences.tsx. One new editorial-media.ts registry selects imagery by storefront and contextual image key. No section, placement, stylesheet, layout, colour, wording, action, filter, form, canonical journey, importer or atomic schema is redesigned or reduced.

## Collections

| Storefront | Images | Purpose |
|---|---:|---|
| Corporates | 7 | Employee family benefits, return to work, continuity and employer planning |
| Establishments | 6 | Learning environments, team practice, parents and institutional organisation |
| Health Partners | 6 | Maternity-to-home continuity, non-medical family support and coordination |
| Hospitality | 6 | Family stays, kids club, concierge, guest childcare and seasonal experiences |
| Partner OS | 3 | Organisation, role collaboration and prepared activation |
| Professionals | 5 | Professional identity, practical skills, family work and peer learning |
| Quality Check | 3 | Observation, evidence preparation and constructive improvement |
| Development | 6 | Language, autonomy, creativity, attention and family participation |
| Kits | 6 | Materials in use, picture cards, digital-to-physical activity and family rituals |
| Academy | 6 | Adult learning, practical training, pedagogy and team preparation |

## Install

```bash
(
unzip -q -o "$HOME/Downloads/ANGELCARE_TEN_STOREFRONTS_DEDICATED_IMAGERY_R3_20261010.zip" -d "$HOME/Downloads" &&
node "$HOME/Downloads/ANGELCARE_TEN_STOREFRONTS_DEDICATED_IMAGERY_R3_20261010/install.mjs" "$HOME/Desktop/angelcare-platform"
) || echo "Installation stopped; terminal remains open."
```

Installation checks package hashes and the four installed source baselines before writing. Any unexpected edit is preserved and stops the installation. Exact current files are backed up under apps/marketplace-web/.angelcare_patch_backups. The printed rollback command restores those bytes; rollback refuses to overwrite later edits. Reinstallation is idempotent.

Installation executes no SQL, dependency installation, TypeScript gate, full application build, commit, push or deployment. After installation, release through the existing Marketplace GHCR workflow and deploy the resulting immutable image in Coolify.

## Completed verification

- Four before/after component comparisons preserve the exact JSX structure, text and non-image attributes.
- 54 readable images, 54 unique image hashes and zero cross-storefront editorial asset reuse.
- 23 isolated browser checks: ten storefronts in French desktop and Arabic mobile layouts, plus three operator-hero precedence checks. Dynamic image selectors and canonical catalogue image containment were exercised. No browser exceptions or horizontal overflow were found.
- Six installer safety checks: complete installation, repeat installation, preservation of later edits, exact rollback, repeat rollback and refusal of unrecognised local edits.
- Installer checks 61 installed file hashes and preservation of 41 protected source files, including stylesheets, homepage, shell, existing storefronts and atomic boundaries.

VERIFICATION.json includes the test results. Browser verification uses actual components with synthetic catalogue fixtures and preview-only framework adapters. It is not a deployed storefront check or a full Marketplace image build. Homepage, Families and Home Services are outside this image replacement scope and remain untouched.
