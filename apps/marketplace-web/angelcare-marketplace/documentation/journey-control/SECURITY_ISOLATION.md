# Security & Isolation

Service-role repository access is guarded by authenticated context and Marketplace permissions. Customer reads are constrained by owner user, family account or tenant. Administrative reads apply tenant and territory scope. All new tables have RLS enabled; anon/authenticated direct table access is revoked. Documents retain visibility metadata.
