# ANGELCARE CAREERS 2027 — MASTER ENGINEERING BUILD BLUEPRINT R1

**Status:** Proposed product/engineering contract for repository reconciliation and implementation. **Date:** 19 October 2026. **Owner context:** AngelCare Marketplace. **Delivery scope:** New additive Careers world; no monetization in this release.

## 0 — Non-negotiable outcomes

Build a credible, internationally accessible, fully functional career marketplace for **adult professionals seeking child-sector work** and employers hiring for households, nurseries, schools, colleges, pediatric settings, hospitality, camps, NGOs, and adjacent child-focused workplaces.

* Never reduce the platform to a homepage plus two empty dashboards. Build public discovery, complete candidate operations, complete hirer operations, and an operator/admin authority.
* Job discovery, candidate registration, vacancies, internal applications, communications, interview management, offers and hiring must work end-to-end without purchase or monetization dependencies.
* Maintain **one identity authority**, role-specific entry pages and role-specific portal memberships. One person may separately act as a candidate and authorized hirer, without exposing candidate activity to their employer organization.
* No fake jobs, employer logos, salary claims, hiring metrics, certifications, reviews, social proof or artificial scarcity.
* Country/city, language, salary, occupation and employer sector are discoverability dimensions, not excuses to construct hundreds of unique regulatory engines.
* Preserve the existing marketplace shell, header, navigation, footer, Experience/Studio authority, Families/Services, Academy, products and all their route/permissions contracts. Careers is additive and distinct from purchasable services.
* Real users need supportive empty, loading, incomplete, error, permission-denied, offline/retry and success states, not design-only screens.
* No billing, pricing plans, ad placements, subscriber tiers, paid boosts, commissions, optional-product upsells or paywalled recruiting in this build.

## 1 — Product topology and navigation

```
ANGELCARE MARKETPLACE
  └── ANGELCARE CAREERS
      ├── PUBLIC WORLD (indexable, content-rich)
      │   ├── Careers home
      │   ├── Jobs search / individual job detail
      │   ├── Sector, occupation, geography, and abroad fronts
      │   ├── Employers directory / employer detail / reviews
      │   ├── Salaries, career guides, resources, trust, support
      │   ├── Candidate acquisition / sign-up / sign-in
      │   └── Hirer acquisition / sign-up / sign-in
      ├── CANDIDATE CAREER STUDIO (authenticated)
      ├── HIRER HIRING STUDIO (authenticated organization context)
      ├── SHARED CAREERS DOMAIN (identity, jobs, applications, etc.)
      └── EXISTING ADMIN + CAREERS OPERATIONS MODULE
```

### Global public header contract

Brand/AngelCare Careers link; Jobs; Sectors; Employers; Jobs Abroad; Career Resources (including Salaries & Reviews); candidate CTA **Build my profile / Find a job**; hirer CTA **Post a job**; Sign in. Responsive accessible compact/mobile navigation and language selector. Show the actual active role when signed in; provide a safe role switcher when both roles exist. No hidden mandatory fees or fake account counts.

### Homepage contract (`/careers`)

1. Credible editorial hero with role/title and location search, country selector, domestic/abroad toggle and two clear CTAs (Find a Job / Hire Talent).
2. Visually rich **sector gateway rail** with editorial/canonical imagery: household childcare; nurseries; kindergarten/preschool; schools/colleges; international schools; pediatrics/neonatal; therapy/development; hotels/kids clubs; camps/sports; NGO/public services; school transport/food/support; child-focused digital/education roles. Taxonomy supports remaining sectors without new code.
3. Curated/algorithmic *actual published jobs*, with salary display only when known and actual status/last-reviewed dates; never fabricated job counts.
4. Search by occupation, skill, location, sector, job arrangement and salary with direct navigation to results preserving filters.
5. **Explore Careers Abroad** by destination and employer-declared international applicant acceptance/sponsorship; no promise of visa eligibility.
6. Actual employer discovery (logo only from authorized/verified source), responsive employer profile cards and sector cards.
7. Candidate journey module, hirer journey module, trust/safety explanation and detailed links.
8. Salary insights, reviews, resources and articles only when grounded published content exists; elegant empty editorial alternatives otherwise.
9. SEO-friendly editorial/footer zones linking to indexable curated occupation/geography pages only when substantive content exists.
10. Real accessibility, responsive motion/performance safeguards, clear content hierarchy and no forced signup to inspect job details.

## 2 — Complete public route inventory and page acceptance

These route names are **proposed contracts**, not claims that repository paths already exist. Final mapping follows read-only route audit. Stable IDs must resolve even if slugs change.

| Route family | Page contract / critical functional elements | Discovery/indexability |
|---|---|---|
| `/careers` | Hero search, sector navigator, legitimate current jobs, employers, abroad, user journeys | Index |
| `/careers/jobs` | Search results, query/filter chips, sorting, pagination, saved search, empty/skeleton/error | Index landing; canonical policy for arbitrary filters |
| `/careers/jobs/[slug-or-id]` | Authoritative single vacancy: title, employer, location, salary if declared, schedule, compensation unit/currency, responsibilities, skills, terms, verified signal, apply, share/save/report | Index live canonical jobs; expired jobs not eligible for active JobPosting |
| `/careers/sectors` | Visual directory of all career settings | Index |
| `/careers/sectors/[slug]` | Sector editorial, occupations, active jobs, employers, related roles | Index only when populated/substantive |
| `/careers/roles` / `[slug]` | Occupations, requirements, transferable skills, active positions, related career routes | Index substantive content |
| `/careers/locations/[country]/[region-or-city]` | Local jobs, employers and sector browsing | Avoid empty/thin infinite combinations |
| `/careers/abroad` | Global opportunities, international applicant reach, destination/language/relocation filters | Index |
| `/careers/employers` | Employer directory, sector/location filters, verified-status distinctions | Index |
| `/careers/employers/[slug-or-id]` | Legitimate organization identity, work setting, employer-provided description/media, verified-status details, active jobs, reviews where permitted | Index approved public content; household privacy exceptions |
| `/careers/salaries` | Role/location pay research, method and sample size, actual source date; no invented estimates | Index if supported |
| `/careers/reviews` | Moderated workplace experiences, guidelines, explain limitations and privacy | Index approved public content only |
| `/careers/career-guides` / `[slug]` | Interviews, CVs, qualifications, role guides, moving country, candidate safety | Index editorial content |
| `/careers/for-candidates` | Why use AngelCare, screenshots grounded in implemented UX, sign-up link | Index |
| `/careers/for-employers` | Recruiting workflow and employer types, legitimate posting guide, sign-up link | Index |
| `/careers/how-it-works` | Separate candidate and hirer guides, application and verification processes | Index |
| `/careers/trust` | Verification definitions, reports, child safeguarding, fraud warnings | Index |
| `/careers/help` / `[article]` | Searchable knowledge center, contacts, appeals and support routes | Index useful help articles |
| `/careers/contact`, `/about` | Real contact channels, product/organization identity, support scope | Index |
| `/careers/terms`, `/privacy`, `/cookies`, `/community-guidelines`, `/accessibility` | Correct policies; version, effective date, contact | Index as appropriate |
| `/careers/report` | Authenticated or guest-safe abuse/fake-job report intake and ticket feedback | Generally noindex |
| `/careers/status` (optional) | Service health / known outages; link from Help | Depends on actual operations |

**Public front doctrine:** one dynamic page system for sectors/roles/locations backed by the canonical taxonomy and real vacancies. Different editorial composition for sectors is allowed, but no hardcoded duplicate platform or fake inventory. Use live canonical item media when authorized; otherwise approved brand/editorial assets. No invented organizational logos.

## 3 — Candidate authentication and account recovery

Dedicated, strongly branded candidate sign-up and sign-in at `/careers/candidate/sign-up` and `/careers/candidate/sign-in` (actual routes may map to shared handlers). Include forgot/reset password, email confirmation, verification-pending, session-expired, account-locked/rate-limited, suspicious-login, consent controls, optional passkeys/social login if supported by existing authority, and account deletion/export. All auth screens must be usable with password managers and accessible copy/paste.

**Progressive sign-up:** email/credential → verify → desired job category + city/country → reach useful portal. Let people browse, save when supported, or begin a job application before requiring a long CV. Complete profile contextually at application; never destroy the application draft after sign-up.

**Account model:** platform user ID is singular; candidate profile belongs privately to that user. Employer organization membership is a separate authorized relationship. Role switching uses guarded session context and preserves complete privacy boundaries.

## 4 — Candidate Career Studio: full menu and screens

| Candidate route | Required behavior |
|---|---|
| `/careers/candidate/portal` | Personalized home: relevant current jobs, resume application, interview agenda, responses, alerts, onboarding completeness, useful next actions; no invented numerical KPIs |
| `/jobs` | Authenticated search/preferences; link to public indexable job pages |
| `/saved` | Save/unsave jobs, folders or manageable collections, stale/expired warnings |
| `/applications` | Submitted/draft/withdrawn applications, stage, date, next action and search/filter |
| `/applications/[id]` | Full submitted snapshot, current stage, history allowed to candidate, conversation, requested information, interview/offer and withdraw action |
| `/passport` | Career identity, summary, occupations, age-group experience, languages, skills, work preference, verification provenance |
| `/cv-portfolio` | CV upload/parser with review, versions, approved sanitized work samples, privacy by section; no children’s personal information |
| `/interviews` | Calendar/list, time zone, consent-based scheduling, reschedule and confirmations |
| `/inbox` | Accessible messaging, attachments, moderation/reporting and notifications |
| `/alerts` | Saved searches, role/city/country criteria, frequency and unsubscribe |
| `/discoverability` | Opt-in recruiter search, visibility to specific organizations, discrete job-seeking mode, blocked employers |
| `/insights` | Practical profile suggestions, career paths and transparent match explanations; no hidden employability grade |
| `/settings` | Account, language, timezone, privacy, notifications, sessions, security, export/delete data |
| `/help` | Job seeker support, account recovery, suspicious employer reporting, appeals |

### Candidate application journey (non-negotiable)

`Job detail → Apply → (sign in or sign up without losing context) → select CV/passport → answer only role-related questions → review → submit atomically → receipt + timestamp → tracked application detail → messages/interviews/offer or outcome`.

* Duplicate submissions of the same candidate to the same vacancy must be handled deliberately, preferably with one canonical application and an edit/withdraw/reapply policy.
* Documents and answers stored as immutable submission snapshots; later candidate profile changes cannot silently rewrite submitted answers.
* Offer and declined outcomes must remain understandable; internal recruiter evaluations/notes remain private.
* Where external applications are allowed, unmistakably label **External application** and never imply AngelCare can track the application after redirect.

## 5 — Hirer authentication, organization creation, and modes

Dedicated hirer sign-up/sign-in with employer-type selection: **private family / childcare or education institution / healthcare or therapy / hospitality or youth activity / NGO or public establishment / multi-site organization / other child-sector employer**. Same identity authority, separate portal membership and permissions.

### Hirer onboarding

Account → select employer type → organization or household employer profile → provide public employer identity or privacy-safe household alias → set hiring location → email/contact verification → lightweight legitimacy checks appropriate to exposure and risk → create first job **draft immediately** → publish once required verification is satisfied. Save unfinished draft.

Household-specific rule: never disclose a full home address, exact child identity, child images, household contact numbers or confidential family details in public vacancies. Show approximate location and duties. Private detailed information is exchanged only when appropriate.

Institutional roles: organization owner/admin, recruiter, hiring manager, interviewer, viewer; branch/site-level scopes where needed. Approval and audit for membership additions and access to candidate data. An employer account is not automatically a commercial Marketplace seller account.

## 6 — Hirer Hiring Studio: full menu and screens

| Hirer route | Required behavior |
|---|---|
| `/careers/hirer/portal` | Active jobs, applications requiring action, interviews, offers, unresolved verification and next steps |
| `/jobs` | Jobs list, state/status, duplicate, pause, renew, edit, close, filled, archive, dashboard filters |
| `/jobs/new` | Guided role template, occupation, sector, location, arrangement, duties, salary/units, schedule, languages, necessary skills, applicant reach, sponsorship/relocation declarations, publish review |
| `/jobs/[id]` | Posting overview, previews, freshness, source, manage publication, associated pipeline |
| `/applications` | Cross-job applicant inbox, filter/sort/bulk actions with explicit guardrails |
| `/jobs/[id]/candidates` | Kanban/list candidate pipeline; compare role-relevant details, bookmarks, stage movement |
| `/talent-search` | Search **opt-in discoverable profiles**, role-specific skills, experience, location and availability; explain visibility |
| `/talent-pools` | Saved candidates with consent/status and controlled retention; never bypass candidate privacy |
| `/interviews` | Candidate invitations, interview slots, scheduling/reschedule, panel members, professional scorecards |
| `/offers` | Draft/review/send/withdraw offer, candidate receipt, acceptance/decline, completion status |
| `/inbox` | Job-specific/candidate-specific communication threads, templates and attachment controls |
| `/team` | Invitations, roles, access scopes, transfer organization ownership, audit |
| `/organization` | Public company/household profile, approved logo/media, sites, employment settings and published jobs |
| `/verification` | Legitimacy evidence, statuses, corrections, renewals when applicable |
| `/insights` | Actual vacancy impressions, starts/submits, recruiter responses, funnel and hiring outcomes—with definitions and no phantom counts |
| `/settings` | Organization settings, branch/timezone/language, notifications, security and support |

### Complete native hiring flow

`Hirer signup → create organization/household → create job draft → review/publish → candidate discovery and applications → sort/shortlist → message/invite → interview and evaluate → offer → candidate response → record hire or close vacancy`.

Core operations must not depend on future add-ons. Internal recruiter notes are not public to candidates. An employer can operate multiple jobs and team members through organization-scoped permissions.

## 7 — Canonical taxonomy and search/matching model

Keep separate dimensions rather than hardcoding category-country permutations:

* **Employment setting:** households, nurseries/daycare, preschool/kindergarten, primary, secondary/colleges, international schools, public education, pediatrics/hospitals, maternity/neonatal, therapy/development, hospitality/kids clubs, camps/sports, NGO/child protection, school support/transport/food, edtech/digital, public agencies/specialist institutions.
* **Occupation:** nanny, family assistant, early childhood educator, Montessori guide, teacher, nurse, pediatrician, therapy specialist, school administrator, counselor, driver and others with controlled extensible synonyms.
* **Age cohort:** newborn, infant, toddler, preschool, primary age, adolescents, multi-age, non-child-contact support role.
* **Arrangement:** full-time, part-time, fixed-term, permanent, temporary, seasonal, internship, live-in, remote/hybrid only where actual duties permit.
* **Destination:** country, region, city, place; timezone, currency and language are presentation/data fields, not separate engines.
* **Mobility:** local applicants accepted, overseas applicants accepted, sponsorship employer-declared yes/no/unknown, relocation support declared yes/no/unknown; no generated claim of visa approval.

**Search UX:** keyword + semantic synonym matching; sector/role/location/experience/salary/job type/age cohort/language/work authorization declarations; autocomplete, spelling tolerance, URL-preserved filters, sort by relevance/date, clear filters, save search, 0-result suggestions. Match explanations must derive from explicit job requirements and actual candidate-consented fields. Never infer sensitive personal traits or automatically reject without accountable human process.

## 8 — One shared domain with strict data ownership

**Do not create redundant business tables if repository authorities already cover these semantics; map them during audit.** Logical entities, not mandated physical SQL table names:

`CareerUserRole, CandidateProfile, CandidateExperience, CandidateCredential, CandidatePortfolioAsset, CandidatePreference, CandidateVisibilityRule, EmployerOrganization, EmployerSite, EmployerMembership, EmployerVerification, Occupation, EmploymentSetting, Job, JobRevision, JobScreeningQuestion, JobSearchIndex, SavedJob, SavedSearch, JobAlert, Application, ApplicationSnapshot, ApplicationEvent, Interview, InterviewParticipant, Evaluation, Offer, MessageThread, Message, Notification, TalentPool, TalentPoolMember, EmployerReview, SalaryObservation, ModerationCase, SupportCase, AuditEvent.`

Fundamental relationships:

* One platform user → zero/one private candidate profile; zero/multiple employer memberships scoped to organizations.
* One employer organization → many members, sites, job listings, talent pools and hiring processes.
* One published vacancy → many applications; each application joins one candidate and one vacancy with immutable submitted snapshot.
* Interviews, offers and messages reference authorized applications and organization context; access must be checked server-side on every operation.
* Public employer profile and private verification case must not share raw document storage or APIs.
* Role/locale/country taxonomies are controlled catalog data, not novel database schema per location.

### Minimum authoritative lifecycle state contracts

**Jobs**: `draft → pending_review → published → paused | expired | filled | closed → archived`. Enforce allowed transitions, reasons, immutable lifecycle events, publish/expiry timestamps, active status for discoverability. Support reopen/renew with freshness controls and documented behavior.

**Applications**: `draft → submitted → acknowledged/under_review → shortlisted → interview → offer → hired OR declined`; orthogonal controlled states `withdrawn`, `on_hold`, `closed_due_to_vacancy`. Define a transition table centrally. Candidate-visible progress can be less granular than internal employer state, never falsely claim 'viewed' if no reliable event exists.

**Interviews**: `proposed → accepted/declined → scheduled → completed | canceled | no_show`, timezone aware.

**Offers**: `draft → sent → accepted | declined | withdrawn | expired`. Recording a hire requires an auditable acceptance or authorized conclusion, not simply dragging a card.

**Verification**: `not_started → submitted → needs_information | under_review → verified | rejected | expired`; badges describe *what* was checked and should never imply child-safety clearance when not established.

## 9 — Essential API and event boundaries (contracts, not invented endpoints)

Candidate APIs: profile/versioning, credentials, CV upload and sanitization, consent/visibility, jobs search and save, application draft/submit/read/withdraw, saved alerts, messages, interview actions, offers, notifications and account controls.

Employer APIs: organization create/verify/read, membership/roles, site management, vacancies draft/publish/manage, applicant listing/search, pipeline transitions, talent-pool membership, interviews/evaluations, offers, team inbox and actual analytics.

Admin APIs: verification queues, report triage, job quality, abuse moderation, review moderation, appeal, taxonomy config, notification incident views and audit.

Internal events (only when justified by existing architecture): `job.published`, `job.expired`, `application.submitted`, `application.stage_changed`, `message.sent`, `interview.scheduled`, `offer.sent`, `offer.accepted`, `organization.verified`, `report.created`. Use durable transaction/outbox semantics or existing equivalent to prevent lost notifications and duplicated side effects. Idempotency for submit, send, change-stage and publish operations.

**Media security:** private credentials/CVs/attachments in private storage with expiring authorized access; content-type/size validation, malware scanning appropriate to upload capabilities, consented visibility, content sanitization; no sensitive data in logs or public search indexes.

## 10 — Missing mandatory platform components to catch before build

1. **Operator/admin Careers module:** employer verification, job moderation, fake listing/impersonation reports, account appeals, response queues, content authority and audit logs. This cannot be left as an unspecified future dashboard.
2. **Notifications infrastructure:** email + in-app; event templates, preferences, deduplication, delivery retry, bounce handling and one-click unsubscribe where applicable. Native calendar invitation when confirmed, timezone aware.
3. **Help/support ecosystem:** searchable documentation, support ticket, account recovery, employer reporting, candidate complaint, appeal, tracking and human escalation.
4. **Real organization directory and profile management:** approved employer details, site locations, verified aspects, legitimate logos, role-controlled editing and privacy-safe household public profiles.
5. **Authenticity control:** fraudulent job detection, duplicate vacancy mitigation, unusual activity and spam rate limits, aging/expiry/reminder, verification provenance.
6. **Application continuity:** guest-to-signed-in intent preservation, draft autosave, refresh/back handling, upload retry and idempotent submit.
7. **Access/policy states:** unauthorized, unauthenticated, suspended, membership expired/revoked, empty, loading, server error, unavailable job, candidate withdraw, revoked offer and sensitive data access denied.
8. **Consent and privacy center:** candidate discoverability off-by-default unless explicitly enabled, blocked employers, data export/removal, document control and appropriate retention/erasure policy.
9. **SEO/publishing engine:** indexable detail pages, canonical URLs, real vacancy expiration and single-job JobPosting schema only on eligible live pages. Country/sector editorial pages only when useful content exists.
10. **Multi-language system:** content/localization architecture, initial market-language priorities (e.g. English/French/Arabic if aligned with AngelCare), RTL Arabic, local salary currency formats, timezones and accessible terminology without separate engines.
11. **Accessibility/performance/quality:** WCAG 2.2 AA design target, keyboard and screen-reader checks, readable focus states, forms, sensible target size, mobile and low-bandwidth resilience.
12. **Analytics/observability:** operational event definitions for real job views, application start/submit, recruiter first response, interviews, offers, confirmed hires, abuse resolution; performance, errors, queue failures and audit trails.
13. **Editorial authority:** publish/update real sector content, guides, frequently asked questions and approved imagery without code changes, using existing Studio/CMS authority where appropriate.
14. **Trust presentation:** verified identity/organization/credential/work eligibility assertions are separate badges with evidence, issuer, scope, dates and limits—no universal “ChildSafe Certified” claim.
15. **Abandoned/dormant journeys:** job draft reminder, stale role reconfirmation, unresponded application notifications with sensible controls, expired search alerts, candidate document refresh.
16. **Data integrity and abuse handling:** applicant deduplication, jobs with multiple hiring locations, organization deactivation effects, retention after closure, export and deletion requests, spam messages and impersonation handling.

## 11 — Credibility/authenticity contract (public and protected)

* Public: real platform identity/about, contact/support routes, transparent policies, trustworthy job descriptions, posted/updated date, employer-declared facts clearly distinguished from verified facts, job report CTA, applied status where authorized, no misleading 'recent' or fake application counts.
* Institutional employer: public organization profile with controlled claims/real media, any verification aspect explicitly named. Household: only alias/approximate location and no exact address or child-sensitive data.
* Reviews: moderation, conflict-of-interest rules, anti-defamation and privacy-safe presentation, minimum anonymity thresholds as needed, no fabricated testimonials, dispute/response procedure.
* Candidate: private-by-default sensitive profile/documents, opt-in discoverability, human-explainable matching, safe reporting, application status and contact mechanisms.
* Cross-border: employer-declared sponsorship != immigration eligibility; relevant official guidance links if present, no automatic legal decision engine.
* Safety controls protect both sides without demanding full invasive documentary compliance before basic browsing.

## 12 — Design system and core component library

**Visual doctrine:** premium, internationally credible, visually rich/dense but not chaotic; trustworthy adult professional identity; AngelCare brand affiliation; actual illustrative photography where authorized; no cartoonish job board aesthetic, fake logos or decorative clutter that harms scanning.

Shared public components: careers global shell, hero search, responsive sector gateway, profession chips, verified employer cards, real job cards, salary treatment, location badges, interview/benefit badges, report/share/save, refined empty-state illustrations, accessible footer.

Shared portal components: signed-in shell, work navigation, search/filter rail, configurable table/grid, candidate comparison, kanban pipeline with accessible list alternative, date/time picker, file uploader, rich text / description editor with sanitation, dialogs/drawers, message center, notifications, timeline, disclosure/consent, verification badge and account switcher.

Atomic states for **every** interactive surface: loading, success, empty, permission denied, validation error, server error, expired/inactive, drafts, conflict/concurrent edit, save pending, accessible keyboard/mobile. Every CTA requires an existing authorized action and success/failure feedback.

## 13 — Product experience acceptance journeys

**E2E A — Candidate from search engine:** Search engine → valid job detail → browse job without login → Apply → candidate signup and email verification → CV/profile review → application atomic submission → receipt → candidate portal application record → employer sees it → candidate receives update.

**E2E B — Household:** new family hirer → household profile/approximate location → publish appropriate childcare job after verification → search/select real adult candidate → message → interview → offer → candidate accept/decline → record outcome. Exact residence and child identity never exposed publicly.

**E2E C — Institutional school:** school admin → organization + branch → invite recruiter with role → publish several positions → applications → compare/shortlist → assign interviewers → issue offers → close jobs → view accurate analytics. Reviewer cannot access unrelated branches without authorization.

**E2E D — Careers abroad:** candidate searching from one country → destination filter + employer international acceptance → open role → read actual sponsorship declaration and relevant requirements → submit → interview across time zones. No claim of guaranteed work authorization.

**E2E E — Multi-role user:** one person signs up as candidate then later becomes authorized hirer → changes portal context securely → unrelated hirer colleagues never see private career activity.

**E2E F — Trust incident:** fraudulent vacancy reported → moderation case created → admin reviews and suspends visibility if warranted → affected users informed appropriately → appeal documented → published index and cache reflect revised state.

**E2E G — Vacancy lifecycle:** published job expires/closes → search removes it promptly → job detail clearly says no longer accepting applicants → `JobPosting` structured data expires/is removed → saved applications remain visible according to policy.

**E2E H — Interruption:** mobile user loses connection mid-application, resumes saved draft without duplicate submission or lost uploaded CV.

## 14 — Accessibility, security, SEO and nonfunctional gates

**Accessibility:** target WCAG 2.2 AA, proper headings/labels, full keyboard access, focus visibility, screen-reader-compatible pipeline alternative, color contrast, mobile zoom, password-manager compatibility and no forced cognitive tests for ordinary login (W3C guidance: https://www.w3.org/TR/WCAG22/).

**Auth & platform security:** server-side role and organization checks on every action; use existing hardened auth/session system; MFA for high-privilege operations, risk-based step-up and secure recovery; private storage, encryption in transit and at rest as supported by infrastructure, audit, abuse/rate controls (OWASP: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

**SEO:** index live publicly available jobs, canonical detail URL, correct `JobPosting` structured data on individual job pages only, programmatic freshness and removal/expiration, canonical/hreflang when applicable, responsive rendering, crawlers must not need authentication; use Google Search Central guidance: https://developers.google.com/search/docs/appearance/structured-data/job-posting. Search result pages and location-sector permutations should not become millions of thin autogenerated indexable pages.

**Performance acceptance targets:** instrument Core Web Vitals for real users; target good thresholds (LCP <=2.5 seconds, INP <=200ms, CLS <=0.1 at p75), within device/network segmentation; optimize hero/editorial imagery and critical path. Operational targets for uptime, delivery latency and search freshness must be set based on observed infrastructure capacity rather than invented performance promises.

**Observability:** on-call errors/alerts for auth, failed applications, jobs not appearing after publish, message delivery, payment systems untouched, notification backlog, moderation SLA and index freshness.

## 15 — Engineering delivery order and dependency gates

**G0 — Actual-system audit / preservation map (mandatory before code)**

Inventory current marketplace routes/layouts, identity/auth, organizations/memberships, existing admin, Studio/Public Experience authority, search, messaging, email/events, file storage, translation, database contracts and existing deployment workflow. Identify reuse, extension, conflicts and unavailable services. Produce a *verified* route map and integration matrix. No unverified assumptions about actual repository implementation.

**G1 — Canonical information architecture + design system**

Freeze public sitemap/navigation, Candidate/Hirer menu, taxonomy/filters, route contracts, responsive grids, desktop/mobile wireflows, CTA/action table, component reuse inventory and state coverage. Existing marketplace chrome remains unchanged except approved additive navigation integration.

**G2 — Shared domain, auth and authorization**

Map/create Careers logical entities/migrations where necessary, user-role separation, organization membership, job state machine, application submission atomicity, privacy and credentials access policy, admin moderation skeleton. Reuse existing storage/auth authorities.

**G3 — Public discovery and hirer publication**

Build Careers public homepage, sectors/roles/location fronts, employer directory/profiles, real job search + detail, direct job creation draft/publish, verification and canonical published read indexes. Critical gate: the public job is actually persisted and indexable.

**G4 — Candidate Career Studio and apply-to-hire loop**

Candidate signup/signin/recovery, progressive profile, CV/passport, actual application submission and tracking, hirer applicant inbox/pipeline, messaging, interviews and offers. Gate: two real test accounts complete an auditable hire end-to-end.

**G5 — Competitive advanced UX**

Saved searches/alerts, candidate discovery opt-in, talent pools, comparison, teams/multi-site, abroad filtering, recommendations with explanations, deeper public careers material, analytics. Advanced AI assistance is a separate guarded subfeature, not critical-path dependency for the hiring engine.

**G6 — Public maturity, trust and content**

Salaries/reviews where actual moderated data exists, professional career guides, editorial authority, support/appeals, accessibility, localization/RTL and indexing/structured data validation.

**G7 — Certification & deployment**

Permission-matrix tests, state-machine tests, E2E journeys A–H, abuse/security/a11y/performance checks, integration compatibility checks, localized smoke tests, release plan, rollback and monitoring. Start with limited activation/data density while allowing global discovery. Do not confuse a passing build with feature completeness or production trust certification.

Each gate must end with: changed-file manifest, source evidence, automated result, failure/blocker list, acceptance outcomes and next-gate readiness. Release blockers must never be silently suppressed.

## 16 — Repository integration/release doctrine (AngelCare specific)

* Work only within the relevant `apps/marketplace-web` scope unless separately approved.
* Do **not** invent new standalone applications, independent auth, redundant CMSs or billing authority.
* Integrate additive Careers entry/navigation without changing existing 12 storefront navigation contract except explicitly approved link placement, and without replacing existing homepage worlds or shell.
* Preserve Studio/Public Experience assignments: new public Careers editorial modules should use the existing authority where appropriate after source verification; no replacement or regressions for Families/Academy/DCE.
* Before mutating source, obtain actual file names, exported contracts, DB owners and route collisions from repository audit. This blueprint alone is not a completed source audit.
* Local builds remain **forbidden during source patch/apply** under existing preference. Use targeted verification; authorized remote build pipeline: GitHub Actions `Build Marketplace GHCR One-Off` → immutable `ghcr.io/angelcare-morocco/angelcare-marketplace:<exact-source-SHA>` → verified GHCR digest → Coolify `Deploy Without Cache`.
* Do not stage/commit/push/deploy unrelated DCE/homepage/VoltHub files. Always distinguish source commit SHA, image digest, and running deployment.

## 17 — Definition of done and executive checkpoints

**Do not label release complete unless all are true:**

- [ ] All required public fronts reachable through live navigation, with useful indexable content and correct empty-state alternatives.
- [ ] Dedicated candidate/hirer signup, signin, verification, recovery and role switching.
- [ ] Candidate creates career profile, manages CV, applies, tracks and receives communication.
- [ ] Hirer creates employer identity, publishes job, processes candidate, interviews, offers and records hire.
- [ ] Both sides can complete without a paywall, billing or future add-on.
- [ ] Every public job exists canonically, has correct state, can expire and cannot masquerade as active after closure.
- [ ] Employee identity, organization membership, child-sector qualifications, public visibility and sensitive documents stay access-controlled.
- [ ] Public organization profiles and household-sensitive public aliases behave differently where privacy demands it.
- [ ] International filters use factual employer declarations, not false visa assurances.
- [ ] All primary CTAs, notifications, emails and admin moderation pathways are wired and tested.
- [ ] Browser/mobile, screen reader/keyboard, locales/RTL, SEO structured data, expired job cleanup and performance monitored.
- [ ] E2E scenarios A–H pass; permission matrix/red-team negative tests pass.
- [ ] Existing Marketplace Families, Academy, DCE and global chrome regression gates pass.
- [ ] Release artifact and live deployment source SHA/digest/commit match; rollback is documented.

**Management reporting:** verified active employers, genuine active jobs, new applicants, completion rate, median first employer response, interview/offer/hire event counts, stale-job ratio, report resolution, returning hirers, returning candidates, real search zero-result rate. Do not show invented dashboards or claim a successful hire solely on an employer-only status change.

## 18 — Explicit exclusions for R1

No monetization architecture, subscriptions, advertisements, paid boosts, commissions, seller checkout, post-hire workforce suites, immigration eligibility decision engine, bespoke country-by-country regulatory implementation, third-party recruitment agency marketplace, or AI autonomously rejecting applicants. Avoid speculative microservices or introducing a second identity platform. Essential legal/safety controls are **not** excluded.

## 19 — Engineering handoff request: required first artifacts

1. `CAREERS_SOURCE_AUTHORITY_INVENTORY`: existing routes, shell, auth, roles, DB, search, CMS, media, messages, notifications, deployment.
2. `CAREERS_ROUTE_AND_NAV_MATRIX`: public, candidate, hirer, admin entrypoints, actions and required states.
3. `CAREERS_DOMAIN_OWNERSHIP_MAP`: reused vs additive entities and permissions, no circular authority.
4. `CAREERS_UX_SCREEN_CONTRACTS`: desktop/mobile screens, component authorities, source-backed actions, accessibility/empty/error states.
5. `CAREERS_E2E_AND_RELEASE_GATES`: A–H scenarios, regression suite, preview verification, remote build/rollout gates.

After these artifacts are verified against the repository, implementation can proceed without engineers guessing at existing AngelCare contracts.

---

**Approval framing:** This is an engineering-ready **proposed product blueprint**, not a claim that AngelCare Careers is implemented, that the repo has been inspected, or that routes/DB schemas already exist. The first engineering milestone is a targeted source audit and exact reconciliation.
