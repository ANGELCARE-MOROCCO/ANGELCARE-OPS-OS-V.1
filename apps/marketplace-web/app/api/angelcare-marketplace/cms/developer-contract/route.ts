import { createHash } from 'node:crypto'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { buildExperienceDeveloperContract, developerContractCsv, developerContractTxt } from '@/angelcare-marketplace/experience-builder/developer-contract'
import { ANGELCARE_STUDIO_DEVELOPER_CONTRACT, studioDeveloperContractCsv, studioDeveloperContractTxt } from '@/angelcare-marketplace/studio-universal/developer-contract'
import { buildStudioSourceRegistryDeveloperContract, studioSourceRegistryContractCsv, studioSourceRegistryContractTxt } from '@/angelcare-marketplace/studio-source-registry/developer-contract'
import { studioPickerDeveloperContractCsv, studioPickerDeveloperContractJson, studioPickerDeveloperContractTxt } from '@/angelcare-marketplace/studio-picker/developer-contract'
import { studioActionDeveloperContractCsv, studioActionDeveloperContractJson, studioActionDeveloperContractTxt } from '@/angelcare-marketplace/studio-action-registry/developer-contract'
import { studioTemplateAssignmentDeveloperContractCsv, studioTemplateAssignmentDeveloperContractJson, studioTemplateAssignmentDeveloperContractTxt } from '@/angelcare-marketplace/studio-template-assignment/developer-contract'
import { studioLiveBindingDeveloperContractCsv, studioLiveBindingDeveloperContractJson, studioLiveBindingDeveloperContractTxt } from '@/angelcare-marketplace/studio-live-binding/developer-contract'
import { studioDynamicSourceDeveloperContractCsv, studioDynamicSourceDeveloperContractJson, studioDynamicSourceDeveloperContractTxt } from '@/angelcare-marketplace/studio-dynamic-source/developer-contract'
import { studioWorkflowDeveloperContractCsv, studioWorkflowDeveloperContractJson, studioWorkflowDeveloperContractTxt } from '@/angelcare-marketplace/studio-workflows/developer-contract'
import { studioPublicRuntimeDeveloperContractCsv, studioPublicRuntimeDeveloperContractJson, studioPublicRuntimeDeveloperContractTxt } from '@/angelcare-marketplace/studio-public-runtime/developer-contract'
import { studioAttributionDeveloperContract, studioAttributionDeveloperContractCsv, studioAttributionDeveloperContractTxt } from '@/angelcare-marketplace/studio-attribution/developer-contract'
import { studioTrustInspectorDeveloperContractCsv, studioTrustInspectorDeveloperContractJson, studioTrustInspectorDeveloperContractTxt } from '@/angelcare-marketplace/studio-trust-inspector/developer-contract'
import { studioGovernanceDeveloperContractCsv, studioGovernanceDeveloperContractJson, studioGovernanceDeveloperContractTxt } from '@/angelcare-marketplace/studio-governance-engine/developer-contract'
import { studioDependencyInvalidationDeveloperContractCsv, studioDependencyInvalidationDeveloperContractJson, studioDependencyInvalidationDeveloperContractTxt } from '@/angelcare-marketplace/studio-dependency-invalidation/developer-contract'
import { studioContractSaturationDeveloperContractCsv, studioContractSaturationDeveloperContractJson, studioContractSaturationDeveloperContractTxt } from '@/angelcare-marketplace/studio-contract-saturation/developer-contract'
import { homepageProMaxDeveloperContractCsv, homepageProMaxDeveloperContractJson, homepageProMaxDeveloperContractTxt, HOMEPAGE_PRO_MAX_DEVELOPER_CONTRACT_SHA256 } from '@/angelcare-marketplace/studio-homepage-pro-max/developer-contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await requireMarketplaceApiContext('marketplace.cms.export')
  const params=new URL(request.url).searchParams
  const format = params.get('format') || 'json'
  const scope = params.get('scope') || 'experience-core'
  if(scope==='homepage-pro-max'){
    const contract=homepageProMaxDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Homepage-Pro-Max-SHA256':HOMEPAGE_PRO_MAX_DEVELOPER_CONTRACT_SHA256};
    if(format==='txt')return new Response(homepageProMaxDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-homepage-pro-max.txt"'}});
    if(format==='csv')return new Response(homepageProMaxDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-homepage-pro-max.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-homepage-pro-max.json"'}})
  }
  if(scope==='contract-saturation'){
    const contract=studioContractSaturationDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Contract-P13-SHA256':contract.hash};
    if(format==='txt')return new Response(studioContractSaturationDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-contract-saturation-p13.txt"'}});
    if(format==='csv')return new Response(studioContractSaturationDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-contract-saturation-p13.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-contract-saturation-p13.json"'}})
  }
  if(scope==='dependency-invalidation'){
    const contract=studioDependencyInvalidationDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Dependency-P12-SHA256':contract.hash};
    if(format==='txt')return new Response(studioDependencyInvalidationDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-dependency-invalidation-p12.txt"'}});
    if(format==='csv')return new Response(studioDependencyInvalidationDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-dependency-invalidation-p12.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-dependency-invalidation-p12.json"'}})
  }
  if(scope==='governance-policy'){
    const contract=studioGovernanceDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Governance-P11-SHA256':contract.hash};
    if(format==='txt')return new Response(studioGovernanceDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-governance-p11.txt"'}});
    if(format==='csv')return new Response(studioGovernanceDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-governance-p11.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-governance-p11.json"'}})
  }
  if(scope==='trust-inspector'){
    const contract=studioTrustInspectorDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Trust-Inspector-SHA256':contract.hash};
    if(format==='txt')return new Response(studioTrustInspectorDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-trust-inspector.txt"'}});
    if(format==='csv')return new Response(studioTrustInspectorDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-trust-inspector.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-trust-inspector.json"'}})
  }
  if(scope==='attribution'){
    const contract=studioAttributionDeveloperContract();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Attribution-SHA256':contract.hash};
    if(format==='txt')return new Response(studioAttributionDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-attribution.txt"'}});
    if(format==='csv')return new Response(studioAttributionDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-attribution.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-attribution.json"'}})
  }
  if(scope==='public-runtime'){
    const contract=studioPublicRuntimeDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Public-Runtime-SHA256':contract.hash};
    if(format==='txt')return new Response(studioPublicRuntimeDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-public-runtime.txt"'}});
    if(format==='csv')return new Response(studioPublicRuntimeDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-public-runtime.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-public-runtime.json"'}})
  }
  if(scope==='workflows'){
    const contract=studioWorkflowDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Workflow-SHA256':contract.hash};
    if(format==='txt')return new Response(studioWorkflowDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-workflows.txt"'}});
    if(format==='csv')return new Response(studioWorkflowDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-workflows.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-workflows.json"'}})
  }
  if(scope==='dynamic-sources'){
    const contract=studioDynamicSourceDeveloperContractJson();const json=JSON.stringify(contract,null,2);const headers={'Cache-Control':'no-store','X-Studio-Dynamic-Source-SHA256':contract.hash};
    if(format==='txt')return new Response(studioDynamicSourceDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-dynamic-sources.txt"'}});
    if(format==='csv')return new Response(studioDynamicSourceDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-dynamic-sources.csv"'}});
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-dynamic-sources.json"'}})
  }
  if(scope==='live-bindings'){
    const contract=studioLiveBindingDeveloperContractJson()
    const json=JSON.stringify(contract,null,2)
    const headers={'Cache-Control':'no-store','X-Studio-Live-Binding-SHA256':contract.hash}
    if(format==='txt')return new Response(studioLiveBindingDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-live-bindings.txt"'}})
    if(format==='csv')return new Response(studioLiveBindingDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-live-bindings.csv"'}})
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-live-bindings.json"'}})
  }
  if(scope==='template-assignment'){
    const contract=studioTemplateAssignmentDeveloperContractJson()
    const json=JSON.stringify(contract,null,2)
    const headers={'Cache-Control':'no-store','X-Studio-Template-Assignment-SHA256':contract.hash}
    if(format==='txt')return new Response(studioTemplateAssignmentDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-template-assignment.txt"'}})
    if(format==='csv')return new Response(studioTemplateAssignmentDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-template-assignment.csv"'}})
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-template-assignment.json"'}})
  }
  if(scope==='actions'){
    const contract=studioActionDeveloperContractJson()
    const json=JSON.stringify(contract,null,2)
    const headers={'Cache-Control':'no-store','X-Studio-Action-Registry-SHA256':contract.hash}
    if(format==='txt')return new Response(studioActionDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-action-registry.txt"'}})
    if(format==='csv')return new Response(studioActionDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-action-registry.csv"'}})
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-action-registry.json"'}})
  }
  if(scope==='picker'){
    const contract=studioPickerDeveloperContractJson()
    const json=JSON.stringify(contract,null,2)
    const headers={'Cache-Control':'no-store','X-Studio-Picker-SHA256':contract.hash}
    if(format==='txt')return new Response(studioPickerDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-picker-contract.txt"'}})
    if(format==='csv')return new Response(studioPickerDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-picker-contract.csv"'}})
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-picker-contract.json"'}})
  }
  if(scope==='source-registry'){
    const contract=buildStudioSourceRegistryDeveloperContract()
    const json=JSON.stringify(contract,null,2)
    const headers={'Cache-Control':'no-store','X-Studio-Source-Registry-SHA256':contract.hash}
    if(format==='txt')return new Response(studioSourceRegistryContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-source-registry.txt"'}})
    if(format==='csv')return new Response(studioSourceRegistryContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-source-registry.csv"'}})
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-source-registry.json"'}})
  }
  if(scope==='studio'){
    const json=JSON.stringify(ANGELCARE_STUDIO_DEVELOPER_CONTRACT,null,2)
    const hash=createHash('sha256').update(json).digest('hex')
    const headers={'Cache-Control':'no-store','X-Studio-Contract-SHA256':hash}
    if(format==='txt')return new Response(studioDeveloperContractTxt(),{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-developer-contract.txt"'}})
    if(format==='csv')return new Response(studioDeveloperContractCsv(),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-visual-catalogue.csv"'}})
    return new Response(json,{headers:{...headers,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="angelcare-marketplace-studio-developer-contract.json"'}})
  }
  const contract = buildExperienceDeveloperContract()
  const headers = { 'Cache-Control': 'no-store', 'X-Experience-Contract-SHA256': contract.contractHash }
  if (format === 'txt') return new Response(developerContractTxt(contract), { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="angelcare-experience-developer-contract.txt"' } })
  if (format === 'csv') return new Response(developerContractCsv(contract), { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="angelcare-experience-developer-contract.csv"' } })
  return new Response(JSON.stringify(contract, null, 2), { headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="angelcare-experience-developer-contract.json"' } })
}
