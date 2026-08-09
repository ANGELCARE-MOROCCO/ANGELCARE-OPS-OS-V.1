# Ordered Migration Plan

Apply manually or through the established safe process in this exact order:
1. `20260801010000_..._mz04_sovereign_control.sql`
2. `20260801020000_..._mz05_experience_cms.sql`
3. `20260801030000_..._mz06_public_universe.sql`
4. `20260801040000_..._mz07_family_engine.sql`

All are additive, RLS-enabled and direct-access restricted. Use the supplied safe rollback only under explicit operational authorization.
