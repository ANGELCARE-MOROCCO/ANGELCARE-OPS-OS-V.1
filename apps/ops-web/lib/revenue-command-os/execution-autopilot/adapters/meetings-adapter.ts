import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class MeetingsAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/meetings/revenue-os')}}
