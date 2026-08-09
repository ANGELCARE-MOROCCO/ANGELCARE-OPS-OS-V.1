import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class ReportingAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/reporting/revenue-os')}}
