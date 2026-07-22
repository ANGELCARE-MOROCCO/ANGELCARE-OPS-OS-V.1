import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class CampaignsAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/campaigns/revenue-os')}}
