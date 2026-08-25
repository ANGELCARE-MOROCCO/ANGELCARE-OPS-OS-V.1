-- ANGELCARE Marketplace 01–06 Production Reality Closure permissions
-- Additive only. No destructive DDL. Fresh production schema validated 2026-08-24.
begin;

insert into public.angelcare_marketplace_permissions(permission_key,name,category,sensitive,description) values
('marketplace.finance.manage','Gérer les opérations financières','Finance Authority',true,'Créer et modifier factures, reçus et paiements opérationnels sous contrôle RBAC.'),
('marketplace.catalog.purge','Purger un objet catalogue','Marketplace Commerce',true,'Suppression définitive d’un objet catalogue archivé, uniquement après contrôle des dépendances transactionnelles.')
on conflict (permission_key) do update set name=excluded.name,category=excluded.category,sensitive=excluded.sensitive,description=excluded.description;

insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key
from public.angelcare_marketplace_roles r
join public.angelcare_marketplace_permissions p on p.permission_key='marketplace.finance.manage'
where r.role_key in ('marketplace_super_admin','marketplace_executive','marketplace_finance_manager')
on conflict do nothing;

insert into public.angelcare_marketplace_role_permissions(role_key,permission_key)
select r.role_key,p.permission_key
from public.angelcare_marketplace_roles r
join public.angelcare_marketplace_permissions p on p.permission_key='marketplace.catalog.purge'
where r.role_key='marketplace_super_admin'
on conflict do nothing;

commit;
