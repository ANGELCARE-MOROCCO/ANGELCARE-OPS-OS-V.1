# Tenant Isolation Contract

Tenant workspace hydration requires `marketplace.partner_os.tenant.access`. Non-admin context must carry the exact tenant ID. `assertTenantScope` rejects cross-tenant access. Direct anon/auth table access is revoked; service-side repositories remain authoritative.
