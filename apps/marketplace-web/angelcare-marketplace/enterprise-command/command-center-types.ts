export type CommandSeverity='healthy'|'watch'|'attention'|'critical'
export type CommandObjectKind='order'|'payment'|'mission'|'case'|'territory'|'customer'|'provider'|'signal'

export type CommandMetric={
 key:string
 label:string
 value:number
 display:string
 deltaLabel:string|null
 severity:CommandSeverity
 detail:string|null
 drawer:'payment'|'supply'|'customer-case'|'territory'|'executive'|'runway'|null
}

export type RunwayItem={
 id:string
 kind:CommandObjectKind
 severity:Exclude<CommandSeverity,'healthy'>
 reference:string
 title:string
 subtitle:string
 amount:number|null
 currencyLabel:string
 ageMinutes:number|null
 territory:string|null
 customerName:string|null
 customerId:string|null
 orderId:string|null
 paymentId:string|null
 missionId:string|null
 caseId:string|null
 route:string|null
 recommendedAction:string
 recommendedActionKey:string
 payload:Record<string,unknown>
}

export type PressureRow={
 key:string
 label:string
 healthy:number
 attention:number
 critical:number
 trend:'up'|'down'|'flat'
 exposure:number|null
 exposureLabel:string
 drawer:'payment'|'supply'|'customer-case'|'territory'|'runway'
}

export type TerritoryPulse={
 id:string
 name:string
 code:string|null
 demand:number
 supply:number
 capacityPercent:number|null
 openOrders:number
 activeMissions:number
 revenue:number
 conversion:number|null
 providerShortage:number
 customerCases:number
 severity:CommandSeverity
}

export type MoneyMotion={
 ordered:number
 authorized:number
 captured:number
 outstanding:number
 refunded:number
 wallet:number
 offline:number
 invoicesDue:number
 reconciliation:number
}

export type OperatingMove={
 id:string
 rank:number
 title:string
 impact:string
 actionLabel:string
 drawer:'payment'|'supply'|'customer-case'|'territory'|'runway'
 severity:Exclude<CommandSeverity,'healthy'>
 targetId:string|null
}

export type ExecutiveSignal={
 id:string
 label:string
 value:string
 direction:'up'|'down'|'flat'
 severity:CommandSeverity
 detail:string
 drawer:'executive'|'territory'|'payment'|'supply'|'customer-case'
}

export type CommandCenterEvent={
 id:string
 kind:string
 reference:string
 title:string
 subtitle:string
 status:string
 route:string
 occurredAt:string
 amount:number|null
 currencyLabel:string|null
 territory:string|null
}

export type CommandCenterSnapshot={
 generatedAt:string
 windowLabel:string
 metrics:CommandMetric[]
 runway:RunwayItem[]
 events:CommandCenterEvent[]
 pressure:PressureRow[]
 territories:TerritoryPulse[]
 money:MoneyMotion
 operatingMoves:OperatingMove[]
 executiveWatch:ExecutiveSignal[]
 counts:{
  orders:number
  payments:number
  missions:number
  cases:number
  providers:number
  territories:number
 }
 health:{
  unavailableSignals:string[]
 }
}
