import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class ProposalsAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/proposals/revenue-os')}}
