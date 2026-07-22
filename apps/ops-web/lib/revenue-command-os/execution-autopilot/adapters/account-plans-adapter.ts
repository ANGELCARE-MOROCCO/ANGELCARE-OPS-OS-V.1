import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class AccountPlansAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/account-plans/revenue-os')}}
