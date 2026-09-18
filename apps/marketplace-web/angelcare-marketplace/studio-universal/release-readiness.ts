import { studioAuditSummary } from './audit-ledger'
import { ANGELCARE_STUDIO_DEVELOPER_CONTRACT } from './developer-contract'
import { ANGELCARE_STUDIO_MANIFEST } from './manifest'
import { ANGELCARE_MARKETPLACE_RELEASE_CONTRACT, marketplaceReleaseChain } from './release-contract'
import { studioAcceptanceSummary } from './runtime-acceptance'

export function studioReleaseReadiness(){
  const audit=studioAuditSummary()
  const acceptance=studioAcceptanceSummary()
  const hardFailures=audit.controls.filter(row=>row.state==='FAIL')
  const runtimePending=audit.controls.filter(row=>row.state==='PARTIAL')
  const releasePending=audit.controls.filter(row=>row.state==='PENDING')
  return {
    schemaVersion:'2026-09-18.4',
    workspace:{id:ANGELCARE_STUDIO_MANIFEST.workspaceId,version:ANGELCARE_STUDIO_MANIFEST.version,engine:ANGELCARE_STUDIO_MANIFEST.engine},
    source:{pass:hardFailures.length===0,hardFailures:hardFailures.map(row=>row.id),audit},
    runtime:{status:runtimePending.length?'pending-browser-acceptance':'source-clear',pending:runtimePending.map(row=>row.id),acceptance},
    release:{status:releasePending.length?'pending-release-execution':'ready',pending:releasePending.map(row=>row.id),contract:ANGELCARE_MARKETPLACE_RELEASE_CONTRACT,chain:marketplaceReleaseChain()},
    developerContractVersion:ANGELCARE_STUDIO_DEVELOPER_CONTRACT.schemaVersion,
    productionReady:hardFailures.length===0&&runtimePending.length===0&&releasePending.length===0,
  }
}
