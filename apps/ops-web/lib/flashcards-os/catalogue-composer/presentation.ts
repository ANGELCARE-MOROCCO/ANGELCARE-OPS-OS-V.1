export function money(value:number|null|undefined){return value==null?'Non configuré':`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(value)} Dh`}
export function sourceLabel(mode:'database'|'catalogue_seed'){return mode==='database'?'Catalogue local en base':'Référentiel catalogue embarqué (MODE DÉMO)'}
