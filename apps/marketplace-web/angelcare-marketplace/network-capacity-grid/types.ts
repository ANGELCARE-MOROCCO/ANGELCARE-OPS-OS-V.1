export type NetworkWorkspaceMode='overview'|'providers'|'availability'|'capacity'|'assignments'|'suppliers'|'vendors'|'partners'|'quality'
export type NetworkSeverity='healthy'|'watch'|'attention'|'critical'
export type NetworkDrawerKind='provider'|'availability'|'capacity'|'territory'|'assignment'|'supplier'|'vendor'|'partner'|'quality'|'create_provider'

export interface NetworkDrawerDescriptor{kind:NetworkDrawerKind;id:string;title:string;subtitle:string}
export interface TerritoryOption{id:string;reference:string;code:string;name:string;status:string}
export interface ProviderNetworkRecord{
 id:string;reference:string;name:string;providerType:string;email:string|null;phone:string|null;territoryId:string|null;territoryName:string;
 onboardingStatus:string;operationalStatus:string;riskLevel:string;services:string[];ageGroups:string[];languages:string[];zones:string[];
 eligibilityStatus:string;eligibilityScore:number|null;eligibilityBlockers:string[];
 availabilityState:'available'|'assigned'|'unavailable'|'restricted'|'offline';
 activeMissions:number;upcomingMissions:number;scheduledMinutesToday:number;assignmentCount:number;
 documentValid:number;documentAttention:number;certificationActive:number;certificationAttention:number;
 performanceCount:number;performanceAverage:number|null;openIncidents:number;updatedAt:string
}
export interface AvailabilityNetworkRecord{
 id:string;providerId:string;providerReference:string;providerName:string;weekday:number;startsAt:string;endsAt:string;zones:string[];
 services:string[];maxDailyMinutes:number;maxWeeklyMinutes:number;active:boolean;state:string
}
export interface AssignmentNetworkRecord{
 id:string;missionId:string;missionReference:string;missionTitle:string;providerId:string|null;providerReference:string;providerName:string;
 roleKey:string;status:string;serviceType:string;territoryId:string|null;territoryName:string;scheduledStart:string|null;scheduledEnd:string|null;
 conflicts:string[];proposalCount:number;updatedAt:string
}
export interface TerritoryCapacityRecord{
 id:string;reference:string;name:string;status:string;providers:number;eligible:number;available:number;assigned:number;demandNext4h:number;
 activeMissions:number;capacityGap:number;coverageRate:number;criticalCapabilities:number;qualitySignals:number
}
export interface CapabilityCapacityRecord{
 key:string;label:string;demand:number;qualified:number;available:number;assigned:number;deficit:number;coverageRate:number;severity:NetworkSeverity
}
export interface SupplierNetworkRecord{
 id:string;reference:string;code:string;legalName:string;name:string;status:string;qualityStatus:string;territoryId:string|null;
 territoryName:string;paymentTerms:string|null;offerCount:number;updatedAt:string
}
export interface VendorNetworkRecord{
 id:string;reference:string;name:string;status:string;territoryIds:string[];catalogCount:number;contractReference:string|null;settlementStatus:string;
 activeContracts:number;openOrders:number;qualityOpen:number;performanceAverage:number|null;updatedAt:string
}
export interface PartnerNetworkRecord{
 id:string;reference:string;code:string;legalName:string;name:string;tenantType:string;territoryId:string|null;territoryName:string;
 status:string;onboardingScore:number;healthStatus:string;updatedAt:string
}
export interface QualitySignal{
 id:string;kind:'document'|'certification'|'performance'|'incident'|'vendor_quality'|'supplier_quality'|'partner_health';
 reference:string;title:string;detail:string;severity:NetworkSeverity;providerId:string|null;relatedId:string;territoryName:string;createdAt:string
}
export interface NetworkMovement{id:string;kind:string;title:string;detail:string;reference:string;when:string;drawerKind:NetworkDrawerKind;drawerId:string}
export interface NetworkMetrics{
 providers:number;availableNow:number;assigned:number;atCapacity:number;unavailable:number;openMissions:number;unassignedMissions:number;
 criticalTerritories:number;qualifiedCapabilities:number;coverageRate:number;providerCases:number;documentsAttention:number;qualityAttention:number
}
export interface NetworkCapacitySnapshot{
 generatedAt:string;metrics:NetworkMetrics;providers:ProviderNetworkRecord[];availability:AvailabilityNetworkRecord[];assignments:AssignmentNetworkRecord[];
 territories:TerritoryCapacityRecord[];capabilities:CapabilityCapacityRecord[];suppliers:SupplierNetworkRecord[];vendors:VendorNetworkRecord[];
 partners:PartnerNetworkRecord[];quality:QualitySignal[];movement:NetworkMovement[];territoryOptions:TerritoryOption[]
}
