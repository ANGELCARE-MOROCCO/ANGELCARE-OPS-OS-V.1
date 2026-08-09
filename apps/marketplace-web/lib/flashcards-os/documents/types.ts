export type FlashcardsDocumentOrientation='portrait'|'landscape'
export type FlashcardsDocumentDensity='compact'|'standard'|'detailed'
export type FlashcardsDocumentAudience='customer'|'parent'|'teacher'|'operations'|'commercial'|'executive'
export type FlashcardsDocumentConfidentiality='public'|'internal'|'confidential'|'restricted'
export type FlashcardsDocumentSourceType='collection'|'workbench'|'sellable_b2c'|'sellable_b2b'|'ready_plan'|'quotation'|'custom'
export type FlashcardsDocumentSection={key:string;title:string;description?:string;kind:'summary'|'facts'|'list'|'timeline'|'table'|'text';rows?:Array<Record<string,unknown>>;items?:string[];content?:string;mandatory?:boolean}
export type FlashcardsDocumentSource={sourceType:FlashcardsDocumentSourceType;sourceId:string;title:string;subtitle:string;reference:string;version:string;category:string;audience:string;summary:string;facts:Array<{label:string;value:string}>;sections:FlashcardsDocumentSection[];metadata:Record<string,unknown>}
export type FlashcardsDocumentTemplate={code:string;name:string;description:string;family:'product'|'package'|'learning'|'production'|'commercial'|'enterprise';defaultOrientation:FlashcardsDocumentOrientation;defaultAudience:FlashcardsDocumentAudience;defaultDensity:FlashcardsDocumentDensity;sectionKeys:string[];mandatorySectionKeys:string[]}
