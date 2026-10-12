-- Read-only after activation; creates no account and sends no email.
select public.angelcare_marketplace_customer_social_ready() as required_revision;
select p.proname,p.prosecdef,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_role_allowed,
 has_function_privilege('anon',p.oid,'EXECUTE') as anonymous_allowed,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_allowed
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('angelcare_marketplace_complete_customer_social_profile','angelcare_marketplace_customer_social_ready');
-- Expect customer-social-r1-20261012; service_role true, anon/authenticated false.
