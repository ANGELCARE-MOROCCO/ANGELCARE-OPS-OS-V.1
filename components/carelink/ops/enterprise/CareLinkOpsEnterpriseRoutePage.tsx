import { CareLinkOpsEnterpriseWorkspace, type CareLinkOpsViewKey } from './CareLinkOpsEnterpriseWorkspace'
import { loadCareLinkOpsSnapshot, type OpsEnterpriseSnapshot } from '@/lib/carelink/ops-enterprise'
import { CARELINK_OPS_NAV } from '@/lib/carelink/constants'

type Props = {
  view: CareLinkOpsViewKey
  title: string
  subtitle: string
  apiPath: string
  initialSnapshot?: OpsEnterpriseSnapshot
}

export async function CareLinkOpsEnterpriseRoutePage({ view, title, subtitle, apiPath, initialSnapshot }: Props) {
  const snapshot = initialSnapshot || await loadCareLinkOpsSnapshot()
  return <CareLinkOpsEnterpriseWorkspace view={view} title={title} subtitle={subtitle} apiPath={apiPath} initialSnapshot={snapshot} />
}