import type { B2BVertical } from './types'
export const verticalLabels:Record<B2BVertical,{fr:string;en:string;ar:string;accent:string}>={
 establishment:{fr:'Établissements, écoles & crèches',en:'Schools & childcare establishments',ar:'المؤسسات والمدارس والحضانات',accent:'institution'},
 hospitality:{fr:'Hôtellerie & hospitalité familiale',en:'Hotels & family hospitality',ar:'الفنادق والضيافة العائلية',accent:'hospitality'},
 health_partner:{fr:'Maternité & accompagnement non médical',en:'Maternity & non-medical family support',ar:'الأمومة والدعم الأسري غير الطبي',accent:'health'},
 corporate:{fr:'Entreprise, RH & avantages familles',en:'Corporate HR & family benefits',ar:'الشركات والموارد البشرية ومزايا الأسرة',accent:'corporate'},
}
export function localeText(locale:string,values:{fr:string;en:string;ar:string}){return locale==='ar'?values.ar:locale==='en'?values.en:values.fr}
