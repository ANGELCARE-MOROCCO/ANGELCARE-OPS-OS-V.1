import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class InternalTasksAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/tasks/revenue-os')}}
