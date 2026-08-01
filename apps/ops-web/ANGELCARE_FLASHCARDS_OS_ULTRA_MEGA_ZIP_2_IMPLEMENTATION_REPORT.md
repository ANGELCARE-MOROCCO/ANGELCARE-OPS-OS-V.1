# ANGELCARE FLASHCARDS OS — Ultra Mega ZIP 2
## Intelligence Sovereignty and Product Design Command

**Delivery ID:** `ANGELCARE_FLASHCARDS_OS_ULTRA_MEGA_ZIP_2`  
**Version:** `2.0.0`  
**Release date:** 31 July 2026  
**Protected route:** `/flashcards-os/intelligence`  
**Database namespace:** `flashcards_os`  
**Delivery mode:** additive, terminal-applicable, cumulative over Ultra Mega ZIP 1

---

## 1. Executive result

Ultra Mega ZIP 2 activates the Intelligence master universe of AngelCare Flashcards OS. It adds a governed external-research acquisition layer through Tavily, a governed reasoning and synthesis layer through OpenRouter, evidence lineage, human arbitration, product-opportunity qualification, product-design architecture, privacy controls, provider usage controls, cost accounting, and a database-backed intelligence job system.

The delivery preserves the signed boundary:

- It does **not** generate images, illustrations, PDFs, MP4 files, classroom decks, or any final creative product asset.
- It does **not** introduce the final copy-ready Production Command Compiler; that remains Ultra Mega ZIP 3.
- It does **not** allow Tavily to process private internal customer or learner records.
- It does **not** expose Tavily or OpenRouter credentials to the browser.
- It does **not** allow AI prose to replace deterministic opportunity scoring or human approval.

The canonical output of this delivery is an approved, evidence-backed Product Design dossier marked ready for the Ultra Mega ZIP 3 handoff.

---

## 2. Activated operating universe

The six-master Flashcards OS shell now activates:

1. Command
2. Product
3. **Intelligence**

Solutions, Revenue, and Delivery & Experience remain contractually contained for later Ultra Mega ZIPs.

The Intelligence contextual navigation provides direct access to:

- Intelligence Command Bridge
- Research Mission Control
- New Research Mission
- Evidence Observatory
- Research Synthesis Chamber
- Product Opportunity Radar
- Product Design Portfolio
- Product Design War Room
- Design Comparison Theatre
- Model & Spend Control
- Intelligence Run Ledger
- Usage Control Centre

---

## 3. Intelligence architecture

### 3.1 External intelligence pathway

```text
Approved Research Mission
→ Tavily acquisition
→ Source normalization
→ Duplicate and evidence governance
→ Human source arbitration
→ OpenRouter synthesis
→ Human conclusion
→ Product opportunity or strategic decision
```

Tavily is confined to approved external acquisition. It is not called for portfolio-only analysis or other internal reasoning.

### 3.2 Internal intelligence pathway

```text
Approved AngelCare internal context
→ Minimum-necessary context compiler
→ Privacy redaction and blocking
→ OpenRouter structured reasoning
→ Rule validation
→ Human decision
```

### 3.3 Provider containment

Both provider adapters are server-only modules. Provider API keys are read only through server environment variables. The patch contains no `NEXT_PUBLIC_` provider credential and no client-side provider URL call.

### 3.4 Structured output

OpenRouter tasks are governed by typed JSON Schema recipes. Structured validation is applied before business records are accepted. Model routing supports a primary model and ordered fallbacks, while recording the model actually used.

---

## 4. Delivered domain capabilities

### 4.1 Research missions

A research mission controls:

- Strategic question
- Research purpose
- Product domain and linked collections
- Geographic and language scope
- Source requirements
- Included and excluded domains
- Search depth and limits
- Cost ceiling
- Owner, reviewer, status, and deadlines
- Approval, execution, cancellation, and audit

Lifecycle:

```text
Draft → Submitted → Approved → Queued → Acquiring
→ Evidence Review → Ready for Synthesis → Synthesizing
→ Human Review → Completed / Reopened / Archived
```

### 4.2 Evidence governance

Every external source can retain:

- Title, domain, URL, author, publication and retrieval dates
- Source category, country, language
- Content snapshot and hash
- Tavily request lineage
- Relevance, freshness, and authority assessments
- Duplicate group
- Human acceptance status and reviewer

Evidence claims retain source links, supporting extracts, direct/inferred classification, confidence, geographic and audience applicability, contradictions, and review status.

### 4.3 Research synthesis

Synthesis output separates:

- External-source findings
- Internal AngelCare facts
- AI inference
- Contradictions
- Limitations
- Assumptions
- Remaining research gaps
- Human conclusion and next action

### 4.4 Product opportunity intelligence

Opportunities may originate from manual executive signals, portfolio gaps, taxonomy gaps, missing age/language/context coverage, catalogue anomalies, and completed research missions. Receiving contracts are prepared for later CRM, bundle, journey, complaint, and return signals without fabricating those future data streams.

The authoritative opportunity score is deterministic and persisted. OpenRouter provides analysis and narrative; it does not secretly produce the score.

### 4.5 Product Design Intelligence

The Product Design War Room supports versioned product architecture across:

- Executive thesis
- Problem and evidence
- Target markets and learner profiles
- Age, context, pain points, and outcomes
- Educational doctrine and objectives
- Content perimeter and proposed card architecture
- Sequence and progression
- Language, inclusion, and cultural strategy
- Product-format strategy
- Portfolio overlap and differentiation
- Bundle and learning-journey compatibility
- Commercial hypothesis
- Production complexity
- Rights, safety, assumptions, and risks
- Alternative concepts and trade-offs
- Human decisions and approval
- Explicit Ultra Mega ZIP 3 readiness

No final product asset is generated.

---

## 5. Purpose-built front-end delivery

Fourteen protected pages and fifteen intelligence components were added. Major surfaces have individual layout contracts rather than one repeated dashboard template:

1. Intelligence Command Bridge
2. Research Mission Control
3. Research Mission Builder
4. External Research Observatory
5. Evidence Observatory
6. Research Synthesis Chamber
7. Product Opportunity Radar
8. Product Opportunity Dossier
9. Product Design Portfolio
10. Product Design War Room
11. Design Comparison Theatre
12. Model & Spend Control
13. Intelligence Run Ledger
14. Usage Control Centre

The interface remains premium white enterprise AngelCare UI, with high information density, explicit decisions, visible lineage, and no generic chatbot as the principal operating experience.

---

## 6. Protected routes

```text
/flashcards-os/intelligence
/flashcards-os/intelligence/research
/flashcards-os/intelligence/research/new
/flashcards-os/intelligence/research/[missionId]
/flashcards-os/intelligence/evidence
/flashcards-os/intelligence/syntheses/[synthesisId]
/flashcards-os/intelligence/opportunities
/flashcards-os/intelligence/opportunities/[opportunityId]
/flashcards-os/intelligence/product-design
/flashcards-os/intelligence/product-design/[designId]
/flashcards-os/intelligence/product-design/[designId]/compare
/flashcards-os/intelligence/control/models
/flashcards-os/intelligence/control/runs
/flashcards-os/intelligence/control/usage
```

Every page applies page-level permission checks.

---

## 7. API contract

Seventeen server-governed API route files provide:

- Research mission listing and creation
- Mission reading and editing
- Mission approval, execution, and cancellation
- Evidence review
- Synthesis queueing
- Opportunity listing, creation, mission promotion, and decision
- Product Design listing, creation, versioning, architecture, and decision
- Model-profile reading and control
- Governed intelligence-job processing

Every operational route applies RBAC or the dedicated worker secret and returns governed JSON.

---

## 8. Database delivery

Migration:

```text
supabase/migrations/20260731_flashcards_os_ultra_mega_zip2_intelligence.sql
```

The migration is additive, transaction-wrapped, and cumulative over Ultra Mega ZIP 1. It introduces 33 canonical tables:

- 10 research and evidence tables
- 4 signal and opportunity tables
- 10 Product Design tables
- 9 model, context, run, provider, usage, privacy, health, and job tables

All new tables contain `tenant_key`, are RLS-enabled, and have controlled public compatibility views. The migration seeds model profiles, intelligence recipes, 14 permissions, and internal portfolio signals only. It seeds no customer or learner data.

Approved research syntheses and approved Product Design versions are protected against destructive deletion.

A database worker RPC uses `FOR UPDATE SKIP LOCKED` to claim bounded intelligence jobs safely.

---

## 9. Intelligence job architecture

The database-backed job system provides:

- Explicit job types
- Idempotency keys
- Safe claim and processing
- Bounded retries
- Failure details
- Dead-letter state
- Cancellation and blocked states
- Run correlation
- Provider-call lineage
- Usage and cost accounting
- Audit and outbox events

Implemented job responsibilities include:

- External source acquisition through Tavily
- Evidence claim extraction through OpenRouter
- Research synthesis through OpenRouter
- Product opportunity architecture through OpenRouter
- Product Design architecture through OpenRouter

No uncontrolled autonomous agent is introduced.

---

## 10. Privacy and financial governance

The server privacy firewall includes:

- Email and phone redaction
- Credential and secret redaction
- Learner-identity blocking
- Prohibited-field detection
- Redaction-event persistence
- Provider-routing policy controls
- Zero-data-retention preference support
- Data-collection denial support
- Minimum-necessary context snapshots

Cost governance includes:

- Per-mission credit ceiling
- Monthly budget configuration
- Model-profile cost ceiling
- Token input/output accounting
- Provider cost accounting
- Latency and fallback tracking
- Usage ledger
- Provider health events

---

## 11. New permissions

```text
flashcards_os.view_intelligence
flashcards_os.create_research
flashcards_os.approve_research
flashcards_os.execute_research
flashcards_os.review_evidence
flashcards_os.run_synthesis
flashcards_os.manage_opportunities
flashcards_os.manage_product_design
flashcards_os.approve_product_design
flashcards_os.manage_model_profiles
flashcards_os.view_intelligence_costs
flashcards_os.process_intelligence_jobs
flashcards_os.audit_intelligence
flashcards_os.admin_intelligence
```

Research creation, research approval, research execution, evidence review, Product Design management, Product Design approval, worker processing, model administration, and audit remain distinct authorities.

---

## 12. Environment contract

The package installs `.env.flashcards-os.example` only. It never writes secrets into `.env` automatically.

Required for live external intelligence:

```text
TAVILY_API_KEY
OPENROUTER_API_KEY
```

Recommended:

```text
TAVILY_PROJECT_ID
OPENROUTER_APP_NAME
OPENROUTER_SITE_URL
FLASHCARDS_OS_INTELLIGENCE_WORKER_SECRET
```

Privacy, timeout, fallback, budget, and retry defaults are documented in the example.

---

## 13. Verification evidence

Executed in the reconstructed AngelCare ops-web source with Ultra Mega ZIP 1 applied:

```text
PASS  41/41 Ultra Mega ZIP 2 acceptance checks
PASS  31/31 SQL intelligence architecture checks
PASS  20/20 intelligence-boundary checks
PASS  83 TypeScript/TSX source files transpiled
PASS  197/197 local imports resolved
PASS  Isolated strict static TypeScript check — 0 errors
```

Additional delivery verification includes:

- Clean installer run
- Idempotent second installer run
- Timestamped backup creation
- Exact-migration database-runner dry interception
- Package SHA-256 generation
- ZIP integrity check
- Extracted-package verification

No full Next.js build was run, in accordance with the signed contract.

No live Tavily request was executed because user credentials were not supplied to the build environment.

No live OpenRouter request was executed because user credentials were not supplied to the build environment.

No live database migration was applied by the delivery creator. The exact migration runner is included for the user’s environment.

---

## 14. Cumulative integrity

Ultra Mega ZIP 1 remains intact:

- Command and Product master universes remain active.
- Product, taxonomy, collection, card, and import-control routes remain present.
- Collection dossiers now mark Research and Product Design as partially active.
- Production Commands and Product Vault remain locked for Ultra Mega ZIP 3.
- No unrelated AngelCare application module is intentionally rewritten.

---

## 15. Correct post-install state

After application patch, database migration, secrets configuration, and normal application start:

```text
http://localhost:3000/flashcards-os/intelligence
```

The system is then structurally ready to execute governed Tavily and OpenRouter jobs. Provider execution still depends on valid credentials, provider availability, account budgets, and the user’s selected model profiles.
