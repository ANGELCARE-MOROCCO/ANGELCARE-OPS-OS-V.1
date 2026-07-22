import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class AcademyDeliveryAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/traininghub/delivery/revenue-os')}}
