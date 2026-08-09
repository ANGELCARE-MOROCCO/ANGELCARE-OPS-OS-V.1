import { InternalModuleAdapter } from './internal-module-adapter'
import type { AdapterConfig } from '../types'
export class TrainerPlanningAdapter extends InternalModuleAdapter{constructor(config:AdapterConfig){super(config,'/api/traininghub/trainer-planning/revenue-os')}}
