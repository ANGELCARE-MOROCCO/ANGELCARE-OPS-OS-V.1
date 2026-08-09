# ANGELCARE BUILD 360 — Ultra Delivery 5/5

**Final consolidated delivery:** Original Mega ZIP 19 + Original Mega ZIP 20  
**Build root:** `angelcare-platform/apps/ops-web/angelcare-marketplace`  
**French is the canonical source language.**  

## Route groups

- Trust: `/admin/trust` plus SOP, standards, evidence, badges, Quality Check 360, audit, non-conformity, CAPA, complaints, investigations, sensitive content, compliance and reports.
- Public Trust: `/[locale]/trust` plus safety, quality, providers, standards, complaints and verification reference.
- Finance: `/admin/finance` plus price books, revenue streams, margins, discounts, commissions, invoice readiness, reconciliation, exceptions and reports.
- Analytics: `/admin/analytics` plus executive and every accepted business domain.
- Security: `/admin/security` plus access, roles, permissions, tenant/territory isolation, sessions, events, secrets, retention, reviews and backups.
- QA: `/admin/quality-assurance` plus suites, runs, defects, regressions, accessibility, localization, security, performance and release.
- Launch: `/admin/launch` plus readiness, blockers, evidence, approvals, runbook, monitoring and post-launch.

All API routes are thin adapters to permissioned server handlers.
