begin;
-- DATA-PRESERVING SAFE ROLLBACK
-- Financial, identity, Wallet, payment, order and audit evidence is never dropped.
update public.angelcare_marketplace_payment_methods set status='suspended',updated_at=now() where method_kind not in('invoice','bank_transfer');
update public.angelcare_marketplace_wallet_policies set status='suspended',updated_at=now() where status='active';
update public.angelcare_marketplace_wallet_campaigns set status='suspended',updated_at=now() where status in('active','scheduled');
update public.angelcare_marketplace_wallet_accounts set status='restricted',risk_reason=coalesce(risk_reason,'Safe rollback: new spending disabled'),updated_at=now() where status='active';
update public.angelcare_marketplace_payment_intents set status='reconciliation_pending',updated_at=now() where status in('created','requires_method','requires_customer_action','pending','authorized','partially_captured');
select 'customer_payment_wallet_layer_disabled_records_preserved' as result,
 (select count(*) from public.angelcare_marketplace_wallet_ledger_entries) as preserved_ledger_entries,
 (select count(*) from public.angelcare_marketplace_payment_intents) as preserved_payment_intents,
 (select count(*) from public.angelcare_marketplace_customer_accounts) as preserved_customer_accounts;
commit;
