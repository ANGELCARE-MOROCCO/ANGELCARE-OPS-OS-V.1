import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class EmailOsAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/email-os/revenue-os')}}
