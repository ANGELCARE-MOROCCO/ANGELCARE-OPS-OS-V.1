import type { StudioBindingTargetDescriptor, StudioBindingValueType, StudioLiveBindingDescriptor, StudioLiveBindingMap, StudioLiveBindingReference } from './types'
import { STUDIO_BINDING_MISSING_POLICIES, STUDIO_LIVE_BINDING_VERSION } from './types'
import { PUBLIC_EXPERIENCE_TYPED_BINDINGS } from '@/angelcare-marketplace/public-experience-authority/typed-bindings'

const descriptor=(key:string,label:string,description:string,group:StudioLiveBindingDescriptor['group'],valueType:StudioBindingValueType,authority:string):StudioLiveBindingDescriptor=>({key,label,description,group,valueType,publicSafe:true,authority,freshness:'request'})

const BASE_STUDIO_LIVE_BINDINGS: readonly StudioLiveBindingDescriptor[] = [
  descriptor('item.name','Nom du produit / service','Nom localisé issu du catalogue publié.','identity','text','Category-Native / catalog item'),
  descriptor('item.short_description','Description courte','Description courte localisée du catalogue.','content','text','Category-Native / catalog item'),
  descriptor('item.description','Description complète','Description publique localisée du catalogue.','content','text','Category-Native / catalog item'),
  descriptor('schema.name','Nom du schéma Experience','Nom localisé de l’archétype Experience actif.','schema','text','Category-Native / experience schema'),
  descriptor('schema.description','Description du schéma Experience','Description publique du schéma Experience actif.','schema','text','Category-Native / experience schema'),
  descriptor('price.label','Prix affiché','Prix public déjà formaté ou libellé Sur devis.','commerce','text','Category-Native / catalog pricing'),
  descriptor('price.amount','Montant numérique','Montant catalogue courant lorsqu’il existe.','commerce','number','Category-Native / catalog pricing'),
  descriptor('price.currency','Devise','Libellé de devise canonique.','commerce','text','Category-Native / catalog pricing'),
  descriptor('price.mode','Mode de prix','Mode canonique de tarification.','commerce','text','Category-Native / catalog pricing'),
  descriptor('availability.label','Disponibilité affichée','Statut de disponibilité traduit pour le client.','availability','text','Category-Native / availability authority'),
  descriptor('availability.reason','Motif de disponibilité','Motif public fourni par l’autorité de disponibilité.','availability','text','Category-Native / availability authority'),
  descriptor('availability.available_quantity','Quantité disponible','Capacité disponible lorsqu’elle est publiquement déterminable.','availability','number','Category-Native / availability authority'),
  descriptor('media.primary.url','Média principal · URL','URL du premier média canonique actif.','media','url','Category-Native / catalog media'),
  descriptor('media.primary.alt','Média principal · texte alternatif','Texte alternatif localisé du média principal.','media','text','Category-Native / catalog media'),
  descriptor('media.gallery','Galerie média','Galerie complète des médias canoniques actifs.','media','items','Category-Native / catalog media'),
  descriptor('trust.primary','Confiance · preuve principale','Première preuve ou garantie publique disponible.','trust','text','Category-Native / trust labels'),
  descriptor('trust.claims','Confiance · toutes les preuves','Liste structurée des preuves publiques et garanties de gouvernance.','trust','items','Category-Native / trust labels'),
  descriptor('experience.fields','Champs publics Experience','Tous les champs publics du schéma avec valeurs formatées.','configuration','items','Category-Native / public schema fields'),
  descriptor('variants.items','Variantes actives','Variantes actives publiées pour l’offre.','configuration','items','Category-Native / catalog variants'),
  descriptor('variants.count','Nombre de variantes','Nombre de variantes actives.','configuration','number','Category-Native / catalog variants'),
 ] as const

const publicExperienceBindingGroup = (
  key: string,
): StudioLiveBindingDescriptor['group'] => {
  const prefix = key.split('.')[0]

  if (prefix === 'pricing') return 'commerce'
  if (prefix === 'seo') return 'schema'

  if (
    [
      'identity',
      'availability',
      'media',
      'trust',
      'reviews',
      'relations',
      'product',
      'service',
      'academy',
      'b2b',
      'storefront',
    ].includes(prefix)
  ) {
    return prefix as StudioLiveBindingDescriptor['group']
  }

  return 'content'
}

const PUBLIC_EXPERIENCE_STUDIO_BINDINGS: readonly StudioLiveBindingDescriptor[] =
  PUBLIC_EXPERIENCE_TYPED_BINDINGS
    .filter(
      (row) =>
        !BASE_STUDIO_LIVE_BINDINGS.some(
          (existing) => existing.key === row.key,
        ),
    )
    .map((row) =>
      descriptor(
        row.key,
        row.label,
        `Binding Public Experience canonique · ${row.authority}`,
        publicExperienceBindingGroup(row.key),
        row.valueType as StudioBindingValueType,
        row.authority,
      ),
    )

export const STUDIO_LIVE_BINDINGS: readonly StudioLiveBindingDescriptor[] = [
  ...BASE_STUDIO_LIVE_BINDINGS,
  ...PUBLIC_EXPERIENCE_STUDIO_BINDINGS,
]

export const STUDIO_BINDING_TARGETS: readonly StudioBindingTargetDescriptor[] = [
  {key:'eyebrow',label:'Eyebrow',accepts:['text']},
  {key:'title',label:'Titre',accepts:['text']},
  {key:'lead',label:'Sous-titre / lead',accepts:['text']},
  {key:'body',label:'Corps',accepts:['text']},
  {key:'primaryCtaLabel',label:'Libellé CTA principal',accepts:['text']},
  {key:'secondaryCtaLabel',label:'Libellé CTA secondaire',accepts:['text']},
  {key:'mediaUrl',label:'Média principal',accepts:['url']},
  {key:'mediaAlt',label:'Texte alternatif média',accepts:['text']},
  {key:'items',label:'Éléments / cartes',accepts:['items']},
] as const

const byKey=new Map(STUDIO_LIVE_BINDINGS.map(row=>[row.key,row]))
const targetByKey=new Map(STUDIO_BINDING_TARGETS.map(row=>[row.key,row]))

export function studioLiveBinding(key:string){return byKey.get(key)||null}
export function studioBindingTarget(key:string){return targetByKey.get(key)||null}
export function studioCompatibleBindings(targetKey:string){const target=studioBindingTarget(targetKey);return target?STUDIO_LIVE_BINDINGS.filter(row=>target.accepts.includes(row.valueType)):[]}
export function studioBindingTargetsForFields(fields:readonly string[]){const set=new Set(fields);return STUDIO_BINDING_TARGETS.filter(row=>set.has(row.key))}
export function isStudioLiveBindingReference(value:unknown):value is StudioLiveBindingReference{if(!value||typeof value!=='object'||Array.isArray(value))return false;const row=value as Record<string,unknown>;return row.version===STUDIO_LIVE_BINDING_VERSION&&typeof row.bindingKey==='string'&&Boolean(studioLiveBinding(row.bindingKey))&&typeof row.missingPolicy==='string'&&STUDIO_BINDING_MISSING_POLICIES.includes(row.missingPolicy as any)}
export function normalizeStudioLiveBindingMap(value:unknown):StudioLiveBindingMap{if(!value||typeof value!=='object'||Array.isArray(value))return{};const out:StudioLiveBindingMap={};for(const [target,reference] of Object.entries(value as Record<string,unknown>)){if(studioBindingTarget(target)&&isStudioLiveBindingReference(reference))out[target]=reference}return out}
