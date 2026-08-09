export const customerProfiles=['Parent','Tuteur','Foyer','École','Crèche','Hôtel','Clinique','Entreprise','Organisateur événementiel','Client voyage','Institution'] as const
export const missionFormats=['Mission unique','Missions identiques répétées','Missions adaptées répétées','Programme progressif multi-jours','Récurrence hebdomadaire','Couverture week-end','Programme vacances','Service de nuit'] as const
export const objectiveGroups={
  'Supervision & famille':['Supervision sécurisée','Couverture travail parental','Repos parental','Répit familial','Continuité des routines','Soutien fratrie','Couverture événementielle','Remplacement temporaire'],
  'Développement':['Développement linguistique','Communication','Lecture','Numératie','Motricité fine','Motricité globale','Créativité','Concentration','Mémoire','Préparation scolaire','Autonomie','Émotions','Interaction sociale'],
  'Routines':['Routine du matin','Routine repas','Hygiène','Sieste','Devoirs','Préparation coucher','Transition sortie école','Organisation','Rangement','Participation aux soins personnels'],
  'Soutien adapté':['Régulation sensorielle','Renforcement communication','Transitions','Participation sociale','Prévisibilité','Régulation émotionnelle','Choix structurés','Participation communautaire','Continuité école-maison'],
  'Événements & sorties':['Sécurité groupe','Engagement participants','Animation structurée','Atelier créatif','Rotation groupes d’âge','Supervision transport','Coordination repas','Continuité flux événementiel']
} as const
export const progressionModels=[
  ['familiarisation','Familiarisation et ligne de base'],['routine','Installation des routines'],['independence','Autonomie progressive'],['language','Enrichissement linguistique'],['school','Préparation scolaire'],['sensory','Progression sensorielle douce'],['postpartum','Stabilisation familiale post-partum'],['holiday','Programme vacances'],['identical','Couverture récurrente identique']
] as const
export const environmentOptions=['Parent présent','Parent partiellement présent','Parent absent','Matériel client','Matériel AngelCare','Repas client','Transport client','Transport AngelCare','Accès restreint','Multi-sites','Espace extérieur','Animaux présents'] as const
