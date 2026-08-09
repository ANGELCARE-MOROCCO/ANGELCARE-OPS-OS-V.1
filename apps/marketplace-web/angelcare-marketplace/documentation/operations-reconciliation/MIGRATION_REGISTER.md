# Migration Register

Migration: `20260802210000_angelcare_marketplace_operations_reconciliation_universe.sql`. It is additive, idempotently materializes fulfillment from eligible Journey Control records, registers module sequence 24, enables RLS, revokes anon/authenticated direct access and grants service-role access. Rollback disables runtime and drops projections/triggers while retaining operational and financial history.
