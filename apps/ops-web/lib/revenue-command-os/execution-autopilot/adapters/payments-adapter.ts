import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class PaymentsAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/payments/revenue-os')}}
