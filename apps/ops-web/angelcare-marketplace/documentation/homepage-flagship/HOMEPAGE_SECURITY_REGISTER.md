# Security Register

Backoffice pages and APIs require the existing server permission `marketplace.cms.pages.manage`. Sensitive writes generate Marketplace audit events. New tables use RLS, revoke direct anon/authenticated table access, and grant service-role access only. Anonymous saved/compare selections use an opaque HTTP-only same-site cookie. No service key is referenced by client code.
