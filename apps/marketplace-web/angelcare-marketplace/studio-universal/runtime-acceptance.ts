export type StudioAcceptanceState = 'source-proven' | 'runtime-required' | 'release-required'
export interface StudioAcceptanceControl { id:string; label:string; state:StudioAcceptanceState; evidence:string }

export const ANGELCARE_STUDIO_RUNTIME_ACCEPTANCE: readonly StudioAcceptanceControl[] = [
  {id:'M01',label:'Ouvrir le Studio officiel',state:'runtime-required',evidence:'Route admin protégée et workspace unique.'},
  {id:'M02',label:'Sélectionner une page réelle',state:'runtime-required',evidence:'Index Experience Core.'},
  {id:'M03',label:'Ajouter un bloc',state:'runtime-required',evidence:'Puck Components.'},
  {id:'M04',label:'Déplacer et réordonner',state:'runtime-required',evidence:'Puck DnD.'},
  {id:'M05',label:'Dupliquer et supprimer',state:'runtime-required',evidence:'Outils opérateur.'},
  {id:'M06',label:'Modifier texte et design',state:'runtime-required',evidence:'Inspecteur Puck.'},
  {id:'M07',label:'Sélectionner un média Vault',state:'runtime-required',evidence:'Picker Media Vault.'},
  {id:'M08',label:'Redimensionner/replier les rails',state:'runtime-required',evidence:'Rails Studio.'},
  {id:'M09',label:'Scroller une page longue',state:'runtime-required',evidence:'Canvas tall-page.'},
  {id:'M10',label:'Enregistrer puis recharger',state:'runtime-required',evidence:'Experience Core persistence.'},
  {id:'M11',label:'Aperçu sécurisé',state:'runtime-required',evidence:'Preview token Experience Core.'},
  {id:'M12',label:'Importer une page complète',state:'runtime-required',evidence:'Universal Import.'},
  {id:'M13',label:'Réviser fidélité/pertes',state:'runtime-required',evidence:'Candidate Review.'},
  {id:'M14',label:'Appliquer candidat dans canvas monté',state:'runtime-required',evidence:'setData + history.'},
  {id:'M15',label:'Éditer heading/bouton importé',state:'runtime-required',evidence:'Imported block editability.'},
  {id:'M16',label:'Remplacer média importé',state:'runtime-required',evidence:'Vault picker.'},
  {id:'M17',label:'Supprimer section importée',state:'runtime-required',evidence:'Puck CRUD.'},
  {id:'M18',label:'Canvas = Preview = Public',state:'runtime-required',evidence:'Runtime parity source contract + browser proof.'},
  {id:'M19',label:'Aucune erreur hydration/console Studio',state:'runtime-required',evidence:'Browser acceptance.'},
  {id:'M20',label:'Responsive mobile/tablet/desktop/wide',state:'runtime-required',evidence:'Device modes + public runtime.'},
  {id:'M21',label:'FR/EN/AR et RTL',state:'runtime-required',evidence:'Locale/direction runtime.'},
  {id:'M22',label:'Publication gouvernée',state:'runtime-required',evidence:'Publication gate + Experience Core transition.'},
  {id:'M23',label:'Lint Studio ciblé',state:'release-required',evidence:'Part 4 targeted lint gate.'},
  {id:'M24',label:'Build Marketplace GHCR One-Off',state:'release-required',evidence:'Marketplace release authority only.'},
  {id:'M25',label:'Image taggée SHA exact',state:'release-required',evidence:'Immutable GHCR tag.'},
  {id:'M26',label:'Digest GHCR certifié',state:'release-required',evidence:'Immutable image evidence.'},
  {id:'M27',label:'Coolify deploy sans cache',state:'release-required',evidence:'Canonical deployment authority.'},
  {id:'M28',label:'Smoke public post-déploiement',state:'release-required',evidence:'Public route acceptance.'},
] as const

export function studioAcceptanceSummary(){
  const controls=[...ANGELCARE_STUDIO_RUNTIME_ACCEPTANCE]
  return {
    total:controls.length,
    sourceProven:controls.filter(row=>row.state==='source-proven').length,
    runtimeRequired:controls.filter(row=>row.state==='runtime-required').length,
    releaseRequired:controls.filter(row=>row.state==='release-required').length,
    controls,
  }
}
