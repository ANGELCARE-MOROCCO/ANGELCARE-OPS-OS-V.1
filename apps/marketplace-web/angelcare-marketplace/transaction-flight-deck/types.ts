export type FlightStage='new'|'payment'|'confirmed'|'preparation'|'assigned'|'scheduled'|'executing'|'blocked'|'recovery'|'completed'|'financial_close'|'closed'|'cancelled'
export type FlightSeverity='healthy'|'watch'|'attention'|'critical'
export type DrawerKind='order'|'triage'|'mission'|'provider'|'schedule'|'exception'|'recovery'|'closure'|'communication'

export type FlightDeckOrder={
 id:string;reference:string;title:string;journeyType:string;status:string;stage:FlightStage;severity:FlightSeverity;riskLevel:string
 customerId:string|null;customerName:string;customerTier:string;territoryId:string|null;territoryName:string
 amount:number;captured:number;refunded:number;outstanding:number;paymentStatus:string
 scheduledStart:string|null;scheduledEnd:string|null;providerId:string|null;providerName:string;fulfillmentStatus:string
 nextAction:string;nextActionDueAt:string|null;createdAt:string;updatedAt:string
 lineCount:number;missionId:string|null;missionReference:string|null;missionStatus:string|null;fulfillmentCaseId:string|null
 exceptionCount:number;recoveryCount:number;invoiceCount:number;receiptCount:number;evidenceCount:number
 closure:{fulfillment:boolean;payment:boolean;invoice:boolean;receipt:boolean;evidence:boolean;customer:boolean;ready:boolean}
}
export type FlightMission={id:string;reference:string;orderId:string|null;orderReference:string;title:string;status:string;priority:string;riskLevel:string;providerId:string|null;providerName:string;scheduledStart:string;scheduledEnd:string;territoryId:string|null;territoryName:string;lateRisk:boolean;incidentCount:number;proposalCount:number}
export type FlightException={id:string;source:'operating_case'|'incident'|'fulfillment';sourceId:string;reference:string;orderId:string|null;orderReference:string;customerName:string;title:string;kind:string;status:string;severity:FlightSeverity;financialExposure:number;dueAt:string|null;elapsedMinutes:number;nextAction:string;fulfillmentCaseId:string|null;missionId:string|null}
export type FlightRecovery={id:string;reference:string;fulfillmentCaseId:string|null;orderId:string|null;orderReference:string;recoveryType:string;status:string;urgency:string;customerSummary:string;internalStrategy:string;dueAt:string|null;updatedAt:string;remedy:Record<string,unknown>}
export type FlightProvider={id:string;reference:string;name:string;status:string;type:string;territoryId:string|null;territoryName:string;serviceCategories:string[];zones:string[];eligibilityStatus:string;eligibilityScore:number|null;workload:number;activeMissions:number}
export type StageMetric={stage:FlightStage;label:string;count:number;value:number}
export type FlightDeckSnapshot={generatedAt:string;metrics:{active:number;executing:number;blocked:number;completedToday:number;valueInFlow:number;outstanding:number;unassigned:number;lateRisk:number;openExceptions:number;recoveryActive:number};stages:StageMetric[];orders:FlightDeckOrder[];missions:FlightMission[];exceptions:FlightException[];recoveries:FlightRecovery[];providers:FlightProvider[];territories:Array<{id:string;name:string;code:string}>}
export type WorkspaceMode='overview'|'incoming'|'orders'|'fulfillment'|'dispatch'|'exceptions'|'recovery'|'completed'
export type DrawerDescriptor={kind:DrawerKind;id:string;title:string;subtitle?:string;orderId?:string;missionId?:string;exceptionId?:string;recoveryId?:string;full?:boolean;minimized?:boolean}
