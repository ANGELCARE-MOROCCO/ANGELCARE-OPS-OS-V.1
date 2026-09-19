import fs from 'node:fs'
const pkg=JSON.parse(fs.readFileSync(new URL('../../package.json',import.meta.url),'utf8'))
const out={
 schemaVersion:'2026-09-19.1',
 product:'AngelCare Marketplace Studio',
 workspace:'angelcare-marketplace-studio',
 puckVersion:pkg.dependencies?.['@puckeditor/core']||pkg.devDependencies?.['@puckeditor/core']||null,
 releaseAuthority:{workflow:'Build Marketplace GHCR One-Off',workflowPath:'.github/workflows/build-marketplace-ghcr-oneoff.yml',image:'ghcr.io/angelcare-morocco/angelcare-marketplace',tag:'EXACT_PRODUCT_SOURCE_COMMIT_SHA'},
 sqlRequired:false,
 localProductionBuild:false,
 postSourceGates:['GHCR_ONE_OFF_BUILD','IMMUTABLE_IMAGE','COOLIFY_DEPLOY_WITHOUT_CACHE','PUBLIC_RUNTIME_ACCEPTANCE'],
}
process.stdout.write(JSON.stringify(out,null,2)+'\n')
