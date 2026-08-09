# Ultra Mega ZIP 2 — Architecture, Privacy and Provider-Control Report

## 1. Trust boundaries

```text
Browser
  │ no provider keys, no direct provider calls
  ▼
AngelCare protected Next.js server
  ├─ RBAC and tenant resolution
  ├─ command validation
  ├─ context minimisation
  ├─ privacy redaction/blocking
  ├─ Tavily server adapter
  ├─ OpenRouter server adapter
  └─ audit/outbox
  ▼
flashcards_os PostgreSQL/Supabase namespace
  ├─ research/evidence lineage
  ├─ model profiles and recipes
  ├─ jobs and runs
  ├─ provider calls and usage
  ├─ opportunity scoring
  └─ Product Design versions and decisions
```

## 2. External intelligence rule

Tavily may receive an approved public-web research question and controlled search policy. It must not receive parent identities, learner identities, customer contact data, invoices, private CRM notes, confidential pricing exceptions, or unrelated internal strategy.

## 3. Internal intelligence rule

Internal analysis uses OpenRouter only. The context compiler selects the minimum records needed for the task, applies redaction, records a context snapshot, and links the intelligence run to that snapshot.

## 4. Sensitive data controls

The implementation includes:

- Email masking
- Telephone masking
- API key, bearer token, password, and secret masking
- Learner-identity prohibition
- Prohibited-field inspection
- Redaction event records
- Blocked run states
- No provider secrets in client bundles
- No `NEXT_PUBLIC_` Tavily or OpenRouter values

## 5. OpenRouter routing controls

Model profiles govern:

- Primary model
- Ordered fallback models
- Structured output schema
- Context and output limits
- Timeout and retries
- Task cost ceiling
- Zero-data-retention preference
- Data-collection denial preference
- Parameter-support requirement
- Profile status and effective dates

The run ledger records requested and actual models, fallback, token usage, cost, latency, validation, and human decision.

## 6. Tavily acquisition controls

Research missions govern:

- Query intent
- Search depth
- Maximum results
- Included and excluded domains
- Geographic and language scope
- Date horizon
- Mission credit ceiling
- Approval before execution
- Human evidence review after acquisition

## 7. Deterministic authority

AI does not authoritatively determine:

- Opportunity score
- Approval
- Product publication
- Product price
- Financial totals
- Product release
- Customer communication

The opportunity score is calculated and persisted through deterministic business factors. AI supplies explanation and options.

## 8. Job resilience

The job system supports:

- Idempotency keys
- Atomic job claim
- `FOR UPDATE SKIP LOCKED`
- Attempt counters
- Configurable retry limit
- Failed and dead-letter states
- Blocked state for privacy/configuration problems
- Cancellation
- Correlation through intelligence runs and provider calls
- Audit and outbox events

## 9. Creative-production exclusion

The code contains no image generation endpoint, video renderer, PDF product-asset generator, creative-file output, or final Production Command Compiler. Product Design produces governed product architecture only.

## 10. Operational prerequisites

Live provider execution requires:

- Valid Tavily credentials and sufficient Tavily account capacity
- Valid OpenRouter credentials and sufficient OpenRouter balance
- Approved model profiles compatible with the configured structured output
- A configured worker secret when the process endpoint is called by a scheduler or external worker
- Database migration applied successfully
- Appropriate Flashcards OS permissions assigned

These provider and environment prerequisites were not simulated as successful without credentials.
