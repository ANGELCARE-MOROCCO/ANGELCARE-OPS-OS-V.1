import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class TrainingHubCommercialAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/traininghub/commercial/revenue-os')}}
