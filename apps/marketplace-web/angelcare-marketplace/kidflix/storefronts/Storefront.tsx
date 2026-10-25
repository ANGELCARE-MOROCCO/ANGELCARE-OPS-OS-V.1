"use client";
import {previewDocuments} from "../documents/model";
import {DocumentsStorefront} from "../documents/DocumentsStorefront";
import {ReferenceStorefront} from "../storefront-reference/ReferenceStorefront";
import type {Locale} from "../catalogue";
import type {StorefrontData,Edition} from "./model";
export function Storefront(props:{family:string;locale:Locale;initial:StorefrontData;initialFilters?:Record<string,string>;previewEdition?:Edition}){
 if(props.family==='documents'&&props.initial.documents)return <DocumentsStorefront preview={Boolean(props.previewEdition)} locale={props.locale} initial={props.previewEdition?previewDocuments(props.initial.documents,props.previewEdition,props.initial.documentsPortraits):props.initial.documents} initialFilters={props.initialFilters}/>;
 return <ReferenceStorefront key={props.family+":"+props.locale+":"+JSON.stringify(props.initialFilters||{})} {...props}/>;
}
