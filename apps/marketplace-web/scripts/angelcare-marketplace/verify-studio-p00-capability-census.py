#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd().resolve()
doc=root/'docs/angelcare-marketplace/studio-saturation'
required=['P00_CAPABILITY_CENSUS.md','P00_CAPABILITY_REGISTRY.json','P00_SOURCE_REGISTRY_CANDIDATES.json','P00_ACTION_REGISTRY_CANDIDATES.json','P00_ADMIN_DESTINATION_MAP.json','P00_RUNTIME_SURFACE_MAP.json','P00_STUDIO_GAP_MATRIX.json','P00_ZERO_TYPING_OPPORTUNITIES.json','P00_PATCH_DEPENDENCY_MAP.json','P00_DATA_BINDING_CLASSIFICATION.json','P00_FAIL_CLOSED_INPUTS.json','P00_ROUTE_INVENTORY.json','P00_DATA_AUTHORITY_INVENTORY.json','P00_PERMISSION_INVENTORY.json','P00_EXPORT_AUTHORITY_INVENTORY.json','P00_EVIDENCE_SHA.json','P00_AUDIT_CENSUS.json','P00_PUBLICATION_CENSUS.json','P00_GOVERNANCE_MAP.json','P00_NO_NEW_WORKSPACE_RULE.json','P00_CERTIFICATION.json','P00_GAPS_AND_BLOCKERS.md']
errors=[]
for name in required:
    if not (doc/name).is_file(): errors.append('MISSING_ARTIFACT '+name)
checks={
 'studio_picker':('angelcare-marketplace/studio-universal/picker-data.ts',["angelcare_marketplace_media_assets","angelcare_marketplace_catalog_categories","angelcare_marketplace_homepage_collections"]),
 'studio_cta':('angelcare-marketplace/studio-universal/puck-config.tsx',['primaryCtaHref','secondaryCtaHref']),
 'studio_runtime':('angelcare-marketplace/studio-universal/StudioPublishedRenderer.tsx',['product_grid','collection_rail','searchDiscovery']),
 'category_templates':('angelcare-marketplace/category-native/types.ts',['admin_studio_template','public_experience_template','conversion_template','operations_handover_type','homepage_card_template','availability_authority']),
 'conversion':('angelcare-marketplace/conversion-universe/repository.ts',['createPublicConversionSession','revalidateConversionPrice','revalidateConversionAvailability','recordConversionConsent','confirmPublicConversion','getOrCreatePublicBasket']),
 'inquiry':('angelcare-marketplace/public-universe/repository.ts',['createPublicInquiry','angelcare_marketplace_public_inquiries','angelcare_marketplace_public_events']),
 'experience_core':('angelcare-marketplace/experience-builder/repository.ts',['angelcare_marketplace_cms_templates','angelcare_marketplace_cms_symbols','angelcare_marketplace_cms_dependency_edges','createPreview','transitionPage']),
 'item_runtime':('app/angelcare-marketplace/[locale]/marketplace/item/[itemSlug]/page.tsx',['AdaptiveExperience','getAdaptiveExperience']),
}
for label,(rel,tokens) in checks.items():
    p=root/rel
    if not p.is_file(): errors.append('MISSING_SOURCE '+rel); continue
    text=p.read_text(errors='ignore')
    for token in tokens:
        if token not in text: errors.append(f'MISSING_EVIDENCE {label} {token}')
# Validate P00 machine artifacts
if (doc/'P00_CAPABILITY_REGISTRY.json').is_file():
    reg=json.loads((doc/'P00_CAPABILITY_REGISTRY.json').read_text())
    if len(reg.get('capabilities',[]))<35: errors.append('CAPABILITY_REGISTRY_TOO_SMALL')
if (doc/'P00_SOURCE_REGISTRY_CANDIDATES.json').is_file():
    x=json.loads((doc/'P00_SOURCE_REGISTRY_CANDIDATES.json').read_text())
    ids={r['source_id'] for r in x.get('sources',[])}
    for expected in ['catalog_item','catalog_category','homepage_collection','media_asset','cms_page','cms_template','experience_schema','territory','academy_program','navigation_destination']:
        if expected not in ids: errors.append('MISSING_SOURCE_CANDIDATE '+expected)
if (doc/'P00_ACTION_REGISTRY_CANDIDATES.json').is_file():
    x=json.loads((doc/'P00_ACTION_REGISTRY_CANDIDATES.json').read_text())
    ids={r['action_id'] for r in x.get('actions',[])}
    for expected in ['navigation.open','catalog.open_item','booking.start','quotation.start','basket.add','checkout.start','inquiry.submit','academy.enroll','subscription.start','family_request.start']:
        if expected not in ids: errors.append('MISSING_ACTION_CANDIDATE '+expected)
if (doc/'P00_CERTIFICATION.json').is_file():
    c=json.loads((doc/'P00_CERTIFICATION.json').read_text())
    if c.get('status')!='PASS': errors.append('CERTIFICATION_NOT_PASS')
    inv=c.get('invariants',{})
    for k in ['shadow_system_created','database_change','sql_required','migration','local_build','global_typescript','commit','push','deploy']:
        if inv.get(k) is not False: errors.append('INVARIANT_FAIL '+k)
print('='*78)
print(' ANGELCARE MARKETPLACE — P00 TARGETED VERIFICATION')
print('='*78)
if errors:
    for e in errors: print('FAIL',e)
    print(f'P00_VERIFY=FAIL ERRORS={len(errors)}')
    raise SystemExit(1)
print('PASS P00_ARTIFACTS='+str(len(required)))
print('PASS STUDIO_BOUNDARY_EVIDENCE=8')
print('PASS SOURCE_REGISTRY_CONSTITUTION')
print('PASS ACTION_REGISTRY_CONSTITUTION')
print('PASS CATEGORY_NATIVE_TEMPLATE_AUTHORITY')
print('PASS CONVERSION_UNIVERSE_AUTHORITY')
print('PASS EXPERIENCE_CORE_AUTHORITY')
print('PASS PUBLIC_INQUIRY_AUTHORITY')
print('PASS NO_LOCAL_BUILD NO_GLOBAL_TYPESCRIPT SQL=NO DEPLOY=NO')
print('P00_VERIFY=PASS')
