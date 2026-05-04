# SALES MODULE V30 — PACK 2 EXECUTION CONTROL LAYER

Inject these files into your project root after Pack 1.

Pack 2 adds real sales execution depth:
- Action Orchestrator
- Script Builder
- Follow-up Engine
- Payment Command
- Deal Desk
- Sales execution engine utilities
- SQL migration for script templates, follow-up sequences, payment promises, discount approvals and decision rules

Recommended injection order:
1. Copy app/components/sales-os/*
2. Copy app/(protected)/sales/* new routes
3. Run supabase/migrations/20260501_sales_execution_os_v30_pack2.sql
4. Open /sales/action-orchestrator, /sales/script-builder, /sales/follow-up-engine, /sales/payment-command, /sales/deal-desk

This pack does not touch auth, middleware, global layout, voice, CRM, operations, HR, or market-os.
