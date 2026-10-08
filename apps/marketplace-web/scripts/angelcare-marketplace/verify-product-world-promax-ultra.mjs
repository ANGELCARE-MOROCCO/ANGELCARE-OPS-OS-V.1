import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd()
const runtime=path.join(root,'angelcare-marketplace/studio-universal/components/StudioProductWorldRuntime.tsx')
const actions=path.join(root,'angelcare-marketplace/studio-universal/components/StudioProductCommerceActions.tsx')
const css=path.join(root,'angelcare-marketplace/studio-universal/components/studio-product-world-runtime.module.css')
const checks=[]
const need=(file,token,label)=>{const body=fs.readFileSync(file,'utf8');const ok=body.includes(token);checks.push([ok,label]);console.log(`${ok?'PASS':'FAIL'} ${label}`)}
for(const f of [runtime,actions,css]){const ok=fs.existsSync(f);checks.push([ok,`FILE ${path.relative(root,f)}`]);console.log(`${ok?'PASS':'FAIL'} FILE ${path.relative(root,f)}`)}
if(fs.existsSync(runtime)){
 need(runtime,"data-ac-product-world-runtime=\"studio-product-promax-ultra\"",'SEMANTIC RUNTIME MARKER')
 need(runtime,"isProductKind",'PRODUCT-ONLY RECOMMENDATION GATE')
 need(runtime,"recommendationRows",'SIMILAR PRODUCT FILTER')
 need(runtime,"humanLabel",'CUSTOMER LABEL MAPPER')
 need(runtime,"humanValue",'CUSTOMER VALUE MAPPER')
 need(runtime,"availabilityView",'NON-CONTRADICTORY AVAILABILITY')
 need(runtime,"uniqueMedia",'MEDIA DEDUPLICATION')
 need(runtime,"sellerName",'PROVENANCE / SELLER SURFACE')
 need(runtime,"deliveryText",'DELIVERY SURFACE')
 need(runtime,"compactEmpty",'COMPACT EMPTY REVIEW STATE')
 need(runtime,"ProductCommerceActions",'CANONICAL COMMERCE ACTIONS')
 need(runtime,"<BundleSection",'BUNDLE SECTION')
 need(runtime,"<AccessorySection",'ACCESSORY SECTION')
 need(runtime,"<SimilarProducts",'SIMILAR PRODUCTS SECTION')
 if(fs.readFileSync(runtime,'utf8').includes('CommerceHeader')){checks.push([false,'NO DUPLICATE GLOBAL HEADER']);console.log('FAIL NO DUPLICATE GLOBAL HEADER')}else{checks.push([true,'NO DUPLICATE GLOBAL HEADER']);console.log('PASS NO DUPLICATE GLOBAL HEADER')}
 if(fs.readFileSync(runtime,'utf8').includes('MegaCommerceFooter')){checks.push([false,'NO DUPLICATE GLOBAL FOOTER']);console.log('FAIL NO DUPLICATE GLOBAL FOOTER')}else{checks.push([true,'NO DUPLICATE GLOBAL FOOTER']);console.log('PASS NO DUPLICATE GLOBAL FOOTER')}
}
if(fs.existsSync(actions)){
 need(actions,"/api/angelcare-marketplace/conversion/basket",'REAL BASKET API')
 need(actions,"/api/angelcare-marketplace/homepage/engagement",'REAL FAVORITES API')
 need(actions,"languageValue",'VARIANT LOCALIZATION')
}
const fail=checks.filter(([ok])=>!ok).length
console.log(`CHECKS=${checks.length}`);console.log(`PASS=${checks.length-fail}`);console.log(`FAIL=${fail}`);if(fail)process.exit(1)
