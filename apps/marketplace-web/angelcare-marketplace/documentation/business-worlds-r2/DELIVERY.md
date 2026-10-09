# ANGELCARE Business Worlds R2

Seven dedicated business landing pages replace the shared R1 business composition. Each page combines an educational narrative, its own opening and section sequence, a working interactive preparation tool, published catalogue discovery and a public enquiry form. Development, Kits and Academy receive additional educational discovery modules.

## Page architecture

| World | Dedicated composition | Functional preparation | Conversion authority |
|---|---|---|---|
| Corporates | Work/family editorial collage; everyday situations; employer programme portfolio; employee/employer perspectives; programme framework; deployment sequence | Perspective selection, employer priorities and project brief | Existing B2B public diagnostics, `corporate` |
| Establishments | Campus masthead; nursery/school context; spaces/team/parents/organisation explorer; Academy/Quality/Partner OS connections; stakeholder perspectives; diagnostic roadmap | Institution context, diagnostic dimensions and priorities | Existing B2B public diagnostics, `establishment` |
| Health Partners | Warm family/partner opening; maternity-to-home continuum; public programme dossiers; family/organisation perspectives; coordination framework; workshop preparation | Stage, perspective and non-medical support priorities | Existing B2B public diagnostics, `health_partner` |
| Hospitality | Photographic destination opening; five-stage stay itinerary; four programme dossiers; editorial gallery; property explorer; programme anatomy; seasonal preparation | Stay stage, hotel/resort context and programme priorities | Existing B2B public diagnostics, `hospitality` |
| Partner OS | Dark product opening; explicitly explanatory organisation map; workspace/roles/plan/readiness explorer; workflows; responsibility map; activation sequence | Operating layer and organisation priorities | Existing public inquiries, `partner_os` |
| Professionals | Portrait collage; professional direction explorer; practice mosaic; role dossiers; Academy connection; progression sequence; separate existing-member access | Direction, competency priorities and pathway brief | Existing public inquiries, `provider` |
| Quality Check | Scope/evidence document opening; evaluation dimension explorer; method walkthrough; evidence checklist; explanatory deliverable structures; action progression | Evaluation scope, evidence preparation and priorities | Existing B2B public diagnostics, `establishment`, explicit Quality context |

The seven bodies use separate composer components. Shared buttons, photos, offer cards, field handling and accessible tools support them. The public request pages for the four institutional units, Partner OS contact, Quality Check and the new professional participation route are complete. Ten request/diagnostic routes use the same robust public submission component.

## Customer journey and catalogue

- Public education remains available with zero catalogue offers. Empty catalogue states explain how to prepare a request and retain the actual form.
- All catalogue cards use the unchanged canonical R1 item helpers and detail journeys. Unknown schema keys remain visible. No display group creates an atomic request need.
- The existing catalogue completion loader continues beyond the first page. Local search, offer type, price/name order, pagination, saved selection and comparison operate on those canonical items.
- Product/service card media use `contain`. Missing media receive a truthful empty state. Editorial photography uses `cover` intentionally.
- Partner OS plans expose only published native resource information, actual amount/currency labels and the actual billing period, including quarterly/custom periods. No module entitlement is invented.
- Tool choices create a visible public project brief. Copy is available; adding the brief to a message is explicit and preserves existing typed content. No personal input is stored in local storage or analytics.
- Existing public events record public choices and conversion outcomes. Analytics exclude contact information and message text.
- French, English and Arabic include form copy, educational content and tools. Public resource text retains its declared original language rather than inventing translations.

## Submission behaviour

The frontend uses the existing authorities without modifying their repositories, API handlers or database schema. Institutional requests retain the existing required organisation/city/email/phone fields and exact `consent: "on"` contract. Partner OS and professional enquiries retain the public inquiry contract, consent boolean, source route and audience. The form locks duplicate submissions, handles HTTP/JSON/network failures and a 25-second client timeout, retains values after failure, and confirms success only when a valid backend public reference is returned.

Health support is explicitly non-medical. Quality explorers produce preparation, not an official score or certification. Professional enquiries do not promise recruitment or assignments. The Partner OS opening is labelled as a functioning explanation, not a connected dashboard.

## Boundaries

Homepage World02 R4, Families R2, Home Services R1, the global shell code/logos/navigation/footer, native catalogue projections, atomic/category imports, catalogue repository/types, canonical item routes, existing engagement authority and published Studio priority remain intact. The redesigned source-owned worlds compose the existing global shell directly; shell files are unchanged. Published Studio is still selected before any source-owned business or consumer renderer.

The source audit verified **9,924 uploaded files unchanged** outside the existing R1 package scope and the nine declared R2 integration edits. The installer snapshots its protected boundaries and verifies that installation leaves their current bytes unchanged.

## Verification

- Scoped client TypeScript: passed, 30 source files including type dependencies.
- Public request/server wrapper TypeScript: passed using the actual global shell parameter contract; backend dependency graph excluded.
- Runtime submission/localisation/brief/privacy and installed-route contract: **45/45**.
- Existing handlers and repositories: **12/12**, executed with mocked Supabase/NextResponse boundaries; no live database writes.
- Actual dispatcher, shell composition, public destinations and CSS module purity: **16/16**.
- Browser suite: **62/62**, desktop French, mobile English/Arabic, empty catalogues, tools, canonical cards, selection persistence, comparison limit, public forms, errors, duplicate prevention and analytics privacy.
- Existing Homepage runtime: **71/71**; Families: **35/35**; Home Services: **37/37**.
- Installer/rollback results are included in the package report.

Browser records and API responses are isolated verification fixtures. They are excluded from the installer. Screenshots are captures of the implemented source, not generated design mockups or live production records. The included review ZIP contains opening, interactive and enquiry views plus mobile/RTL captures; full-page compositor artifacts are avoided.

## Install

Download `ANGELCARE_BUSINESS_WORLDS_R2_20261009.zip` to Downloads. Run:

```bash
unzip -q -o "$HOME/Downloads/ANGELCARE_BUSINESS_WORLDS_R2_20261009.zip" -d "$HOME/Downloads" &&
node "$HOME/Downloads/ANGELCARE_BUSINESS_WORLDS_R2_20261009/install.mjs" "$HOME/Desktop/angelcare-platform"
```

The installer verifies every package hash and exact R1 file baseline before writing, backs up changed files, verifies the standalone runtime and protected boundaries, then prints installed hashes and the backup’s rollback command. It accepts already-installed bytes without a new backup. Unexpected local edits stop the Node process before writing and preserve the terminal session. It performs no Git reset/clean and no forced overwrite. Rollback checks for later edits before restoring exact backups or removing newly installed files.

## Release gates

Installation is separate from staging, commit, push, image build and deployment. This package runs no SQL, dependency installation, global TypeScript or full app build. After installation: commit/push the reviewed source, build the complete Marketplace image remotely, verify its immutable GHCR reference, then verify the deployed storefronts and public enquiry processing. Live database availability, authentication-protected member access, production delivery and deployed performance remain release checks; isolated browser fixtures do not establish those outcomes.
