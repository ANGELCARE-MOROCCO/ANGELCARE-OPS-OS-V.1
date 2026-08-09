# Ultra Mega ZIP 2 — Route, Data and Permission Register

## Protected pages

1. `/flashcards-os/intelligence`
2. `/flashcards-os/intelligence/research`
3. `/flashcards-os/intelligence/research/new`
4. `/flashcards-os/intelligence/research/[missionId]`
5. `/flashcards-os/intelligence/evidence`
6. `/flashcards-os/intelligence/syntheses/[synthesisId]`
7. `/flashcards-os/intelligence/opportunities`
8. `/flashcards-os/intelligence/opportunities/[opportunityId]`
9. `/flashcards-os/intelligence/product-design`
10. `/flashcards-os/intelligence/product-design/[designId]`
11. `/flashcards-os/intelligence/product-design/[designId]/compare`
12. `/flashcards-os/intelligence/control/models`
13. `/flashcards-os/intelligence/control/runs`
14. `/flashcards-os/intelligence/control/usage`

## API route files

1. `research/missions/route.ts`
2. `research/missions/[missionId]/route.ts`
3. `research/missions/[missionId]/approve/route.ts`
4. `research/missions/[missionId]/execute/route.ts`
5. `research/missions/[missionId]/cancel/route.ts`
6. `research/evidence/[sourceId]/review/route.ts`
7. `research/syntheses/route.ts`
8. `opportunities/route.ts`
9. `opportunities/from-mission/route.ts`
10. `opportunities/[opportunityId]/decision/route.ts`
11. `product-design/designs/route.ts`
12. `product-design/designs/[designId]/versions/route.ts`
13. `product-design/designs/[designId]/architect/route.ts`
14. `product-design/designs/[designId]/decision/route.ts`
15. `control/model-profiles/route.ts`
16. `control/model-profiles/[profileId]/route.ts`
17. `jobs/process/route.ts`

## Database tables

### Research and evidence

- `research_missions`
- `research_queries`
- `research_runs`
- `research_sources`
- `source_snapshots`
- `source_duplicates`
- `evidence_claims`
- `claim_source_links`
- `evidence_reviews`
- `research_syntheses`

### Signals and opportunities

- `intelligence_signals`
- `product_opportunities`
- `opportunity_scores`
- `opportunity_decisions`

### Product Design

- `product_designs`
- `product_design_versions`
- `design_audiences`
- `design_requirements`
- `design_content_groups`
- `design_alternatives`
- `design_assumptions`
- `design_risks`
- `design_decisions`
- `design_evidence_links`

### Intelligence control

- `model_profiles`
- `intelligence_recipes`
- `context_snapshots`
- `intelligence_runs`
- `provider_calls`
- `usage_ledger`
- `redaction_events`
- `provider_health_events`
- `intelligence_jobs`

## Permissions

- `flashcards_os.view_intelligence`
- `flashcards_os.create_research`
- `flashcards_os.approve_research`
- `flashcards_os.execute_research`
- `flashcards_os.review_evidence`
- `flashcards_os.run_synthesis`
- `flashcards_os.manage_opportunities`
- `flashcards_os.manage_product_design`
- `flashcards_os.approve_product_design`
- `flashcards_os.manage_model_profiles`
- `flashcards_os.view_intelligence_costs`
- `flashcards_os.process_intelligence_jobs`
- `flashcards_os.audit_intelligence`
- `flashcards_os.admin_intelligence`
