#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import re, sys

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
checks: list[tuple[str,bool,str]] = []

def text(rel: str) -> str:
    p=root/rel
    return p.read_text(encoding='utf-8',errors='replace') if p.is_file() else ''

def check(name: str, ok: bool, detail: str='') -> None:
    checks.append((name,bool(ok),detail))

migration_rel='supabase/migrations/20260810050000_angelcare_marketplace_ultra_mz2_final_production_authority.sql'
migration=text(migration_rel)
check('MZ2 migration exists', bool(migration))
for label,pattern in [('DROP TABLE',r'(?im)^\s*drop\s+table\b'),('TRUNCATE',r'(?im)^\s*truncate\b'),('DELETE FROM',r'(?im)^\s*delete\s+from\b'),('ON DELETE CASCADE',r'(?i)on\s+delete\s+cascade')]:
    check(f'MZ2 migration excludes destructive {label}', re.search(pattern,migration) is None)
for table in ['angelcare_marketplace_workspace_access','angelcare_marketplace_academy_remediations','angelcare_marketplace_homepage_release_dossiers']:
    check(f'MZ2 migration defines {table}', f'create table if not exists public.{table}' in migration)
    check(f'MZ2 migration enables RLS for {table}', f'alter table public.{table} enable row level security' in migration)
check('MZ2 migration grants server-only authority tables to service_role', 'to service_role' in migration)
check('MZ2 migration is transactional', migration.lstrip().startswith('begin;') and migration.rstrip().endswith('commit;'))

# MZ1 preserved corrected migration.
mz1mig=text('supabase/migrations/20260810030000_angelcare_marketplace_ultra_mz1_vertical_operating_kernel.sql')
check('Corrected MZ1 trigger idempotency preserved', re.search(r'drop\s+trigger\s+if\s+exists\s+angelcare_marketplace_operating_timeline_no_update\s+on\s+public\.angelcare_marketplace_operating_timeline',mz1mig,re.I) is not None)

# No generic/placeholder final Admin architecture.
scanned=[]
for base in [root/'app/angelcare-marketplace',root/'angelcare-marketplace']:
    if not base.exists(): continue
    for p in base.rglob('*'):
        if p.is_file() and p.suffix in {'.ts','.tsx'}:
            scanned.append((p,p.read_text(encoding='utf-8',errors='replace')))
for forbidden in ['AuthorityWorkspace','PlaceholderWorkspace','GovernancePanel']:
    hits=[str(p.relative_to(root)) for p,s in scanned if forbidden in s]
    check(f'No retained generic {forbidden}', not hits, ', '.join(hits[:8]))

admin_pages=list((root/'app/angelcare-marketplace/(protected)/admin').rglob('page.tsx'))
aliases=[p for p in admin_pages if re.search(r'^\s*export\s*\{\s*default\s*\}\s*from',p.read_text(errors='replace'),re.M)]
check('No exact Admin page re-export aliases remain', not aliases, ', '.join(str(p.relative_to(root)) for p in aliases[:8]))
placeholder_hits=[]
for p in admin_pages:
    s=p.read_text(errors='replace').lower()
    if any(x in s for x in ['placeholderworkspace','not implemented','coming soon','bientôt disponible']): placeholder_hits.append(str(p.relative_to(root)))
check('No explicit incomplete Admin page markers', not placeholder_hits, ', '.join(placeholder_hits[:8]))

# Navigation is canonical and physically resolvable.
nav=text('angelcare-marketplace/shells/AdminNavigation.tsx')
hrefs=re.findall(r"href:\s*['\"]([^'\"]+)['\"]",nav)
check('Admin navigation is rationalized below 80 static links', 0 < len(hrefs) < 80, str(len(hrefs)))
check('Admin navigation contains no duplicate destinations', len(hrefs)==len(set(hrefs)), str(len(hrefs)-len(set(hrefs))))
page_routes=[]
for p in (root/'app').rglob('page.tsx'):
    parts=[]
    for part in p.relative_to(root/'app').parent.parts:
        if part.startswith('(') and part.endswith(')'): continue
        parts.append(part)
    page_routes.append('/'+'/'.join(parts) if parts else '/')
def route_match(href:str,route:str)->bool:
    hp=[] if href=='/' else href.strip('/').split('/')
    rp=[] if route=='/' else route.strip('/').split('/')
    if len(hp)!=len(rp): return False
    return all(b.startswith('[') and b.endswith(']') or a==b for a,b in zip(hp,rp))
broken=[h for h in hrefs if not any(route_match(h,r) for r in page_routes)]
check('Every static Admin navigation destination resolves', not broken, ', '.join(broken[:8]))
check('Security backup/recovery route is real', (root/'app/angelcare-marketplace/(protected)/admin/security/backups/page.tsx').is_file())
check('Workspace access governance route is real', (root/'app/angelcare-marketplace/(protected)/admin/security/workspace-access/page.tsx').is_file())

# Final vertical registry and SQL registry truth.
registry=text('angelcare-marketplace/final-vertical/registry.ts')
reg_keys=set(re.findall(r"key:'([^']+)'",registry))
reg_entries=re.findall(r"key:'([^']+)'.*?route:'([^']+)'.*?domain:'([^']+)'.*?sourceTable:'([^']*)'",registry)
check('MZ2 final registry contains at least 120 workspace contracts', len(reg_keys)>=120, str(len(reg_keys)))
sql_keys=set(re.findall(r"\('([^']+)','/angelcare-marketplace/admin/",migration))
check('MZ2 SQL seeds every final registry workspace', reg_keys <= sql_keys, f'missing={sorted(reg_keys-sql_keys)[:8]}')
check('MZ2 SQL has no extra final registry keys', sql_keys <= reg_keys, f'extra={sorted(sql_keys-reg_keys)[:8]}')
missing_routes=[]
for key,route,domain,table in reg_entries:
    if not any(route_match(route,r) for r in page_routes): missing_routes.append((key,route))
check('Every final registry workspace has a physical page route', not missing_routes, repr(missing_routes[:8]))

# DDL table truth for all registry source tables.
ddl='\n'.join(p.read_text(errors='replace') for p in (root/'supabase/migrations').glob('*.sql'))
ddl_tables=set(re.findall(r'create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)',ddl,re.I))
source_tables={x[3] for x in reg_entries if x[3]}
missing_tables=sorted(source_tables-ddl_tables)
check('Every final registry source table exists in DDL', not missing_tables, ', '.join(missing_tables[:12]))
check('Localization SEO registry points to canonical SEO table', "key:'localization.seo'" in registry and "sourceTable:'angelcare_marketplace_seo_metadata'" in registry[registry.index("key:'localization.seo'"):registry.index("key:'localization.readiness'")])

# Purpose-specific control rooms for formerly generic domains.
for rel,symbol in [
 ('angelcare-marketplace/final-vertical/components/domains/QaControlRoom.tsx','QaControlRoom'),
 ('angelcare-marketplace/final-vertical/components/domains/LaunchReleaseControlRoom.tsx','LaunchReleaseControlRoom'),
 ('angelcare-marketplace/final-vertical/components/domains/IntelligenceDecisionRoom.tsx','IntelligenceDecisionRoom'),
 ('angelcare-marketplace/final-vertical/components/domains/PlatformPerformanceWorkspace.tsx','PlatformPerformanceWorkspace'),
 ('angelcare-marketplace/final-vertical/components/domains/GrowthControlRoom.tsx','GrowthControlRoom'),
 ('angelcare-marketplace/final-vertical/components/domains/SecurityControlRoom.tsx','SecurityControlRoom'),
 ('angelcare-marketplace/final-vertical/components/domains/TrustQualityControlRoom.tsx','TrustQualityControlRoom'),
]: check(f'Purpose-built {symbol} exists', symbol in text(rel))
final_page=text('angelcare-marketplace/final-vertical/admin-page.tsx')
for domain in ['qa','launch','intelligence','platform_performance','growth','security','trust']:
    check(f'Final renderer explicitly handles {domain}', f'{domain}:' in final_page)

# Academy verticality.
academy_ui=text('angelcare-marketplace/academy-engine/components/AcademyFinalCommand.tsx')
academy_repo=text('angelcare-marketplace/academy-engine/final-repository.ts')
academy_handlers=text('angelcare-marketplace/academy-engine/final-api-handlers.ts')
for term in ['createSession','markAttendance','createAssessment','createRemediation','snapshot.remediations']:
    check(f'Academy UI exposes {term}', term in academy_ui)
for term in ['createAcademyRemediation','transitionAcademyRemediation','reviewAssessmentResult','transitionAcademyB2B','transitionAcademyPublication']:
    check(f'Academy backend exposes {term}', term in academy_repo or term in academy_handlers)
for route in [
 'app/api/angelcare-marketplace/academy/final/sessions/route.ts',
 'app/api/angelcare-marketplace/academy/final/assessments/route.ts',
 'app/api/angelcare-marketplace/academy/final/remediations/route.ts',
 'app/api/angelcare-marketplace/academy/final/remediations/[remediationId]/transition/route.ts',
 'app/api/angelcare-marketplace/academy/final/results/[resultId]/review/route.ts',
]: check(f'Academy API exists: {route.split("academy/final/")[-1]}', (root/route).is_file())

# Localization: all former placeholders are real command pages and APIs.
loc_ui=text('angelcare-marketplace/localization-intelligence/components/LocalizationAuthorityCommand.tsx')
loc_repo=text('angelcare-marketplace/localization-intelligence/final-repository.ts')
loc_handler=text('angelcare-marketplace/localization-intelligence/final-api-handlers.ts')
for capability in ['translation','glossary','memory','review','seo','readiness']:
    check(f'Localization final authority covers {capability}', capability in (loc_ui+loc_repo).lower())
check('Localization final APIs are workspace-access governed', 'requireMarketplaceWorkspaceApiContext' in loc_handler)
check('Localization final pages are workspace-access governed', 'requireMarketplaceWorkspacePageContext' in text('angelcare-marketplace/localization-intelligence/final-admin-page.tsx'))
for name in ['translations','sources','imports','glossary','memory','reviews','seo','readiness']:
    route=root/f'app/angelcare-marketplace/(protected)/admin/localization/{name}/page.tsx'
    check(f'Localization route complete: {name}', route.is_file() and 'PlaceholderWorkspace' not in route.read_text(errors='replace'))

# Live Experience real governance.
live_repo=text('angelcare-marketplace/live-experience-command/repository.ts')
live_ui=text('angelcare-marketplace/live-experience-command/components/LiveGovernanceCommand.tsx')
for mode in ['audiences','placements','schedules','experiments','settings','history']:
    check(f'Live Experience governance implements {mode}', mode in (live_repo+live_ui))
for label,needle in [('persist governed records','saveLiveGovernance'),('guarded lifecycle transitions','transitionLiveGovernance'),('schedule collision detection',"new MarketplaceError('CONFLICT'"),('experiment governance','experiments')]:
    check(f'Live Experience command evidence: {label}', needle in (live_repo+live_ui))

# Homepage release authority.
home_repo=text('angelcare-marketplace/homepage-final/repository.ts')
home_ui=text('angelcare-marketplace/homepage-final/components/HomepageReleaseAuthority.tsx')
for capability in ['createHomepageRelease','transitionHomepageRelease','rollback','preview','readiness','published']:
    check(f'Homepage release authority covers {capability}', capability.lower() in (home_repo+home_ui).lower())
check('Homepage release history route uses governed release authority', 'HomepageReleasePage' in text('app/angelcare-marketplace/(protected)/admin/homepage/history/page.tsx'))

# Workspace access doctrine.
access_catalog=text('angelcare-marketplace/workspace-access/catalog.ts')
access_context=text('angelcare-marketplace/auth/context.ts')
access_repo=text('angelcare-marketplace/workspace-access/repository.ts')
master_keys=set(re.findall(r"key:'(workspace\.[^']+)'",access_catalog))
check('Workspace governance exposes compact master workspaces', 10 <= len(master_keys) <= 20, str(len(master_keys)))
for key in ['workspace.commerce_revenue','workspace.operations','workspace.supply','workspace.partners','workspace.academy','workspace.experience','workspace.finance','workspace.trust_quality','workspace.intelligence','workspace.platform_security','workspace.launch_governance']:
    check(f'Workspace access catalog contains {key}', key in master_keys)
check('Workspace access mutations validate canonical access catalog', 'MARKETPLACE_ACCESS_WORKSPACE_BY_KEY.has' in access_repo)
check('Admin remains absolute in permission guard', "context.roleKeys.includes('marketplace_admin')" in access_context)
check('CEO/admin/super_admin fail-safe remains absolute', "['ceo','admin','super_admin']" in access_context)
check('Legacy permission guards inherit master-workspace access', 'accessWorkspaceKeyForPermission' in access_context)
check('Operating workspace guards inherit master-workspace access', 'accessWorkspaceKeyForOperatingWorkspace' in access_context)
check('Sensitive decisions remain separate from workspace grant', 'isSensitiveWorkspacePermission(permission)' in access_context)
check('Admin access control itself remains admin-only', "permission === 'marketplace.admin.access'" in access_context)

# Analytics -> action.
metric=text('angelcare-marketplace/analytics-security/components/MetricRegistry.tsx')
analytics=text('angelcare-marketplace/analytics-security/components/AnalyticsCommand.tsx')
check('Metric analytics can open real operating cases', 'CreateFinalCase' in metric)
check('Analytics command can create executive action case', 'CreateFinalCase' in analytics)

# Access-denied / login architecture preserved and no AC360 auth coupling.
admin_auth=text('angelcare-marketplace/auth/admin/admin-auth.ts')
check('Marketplace Admin auth has no AC360 access-table dependency', 'angelcare360_operator_tenant_access_accounts' not in admin_auth)
check('Marketplace-owned admin access policy remains active', 'angelcare_marketplace_admin_access_policies' in text('lib/auth/marketplace-access-policy.ts'))

# Route count should not grow gratuitously from audited baseline; MZ2 may add APIs while consolidating Admin routes.
check('Admin page count remains controlled', len(admin_pages) <= 440, str(len(admin_pages)))

failed=[x for x in checks if not x[1]]
for name,ok,detail in checks:
    print(('PASS' if ok else 'FAIL')+'  '+name+(f' [{detail}]' if detail else ''))
print(f'\nULTRA MEGA ZIP 2 STATIC ACCEPTANCE: {"PASS" if not failed else "FAIL"} ({len(checks)-len(failed)}/{len(checks)})')
if failed: raise SystemExit(1)
