import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class OpportunitiesAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/revenue-opportunities/revenue-os')}}
