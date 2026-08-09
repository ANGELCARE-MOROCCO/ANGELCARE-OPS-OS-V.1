import type { CustomerPlaneDefinition } from '@/types/angelcare360/customer-experience'

export const ACADEMIC_AUTHORITY_PLANES: Record<'attendance' | 'timetable' | 'learning' | 'assessment', CustomerPlaneDefinition[]> = {
  attendance: [
    ['live-control','Contrôle du jour','Présence et complétude en direct'],
    ['students','Élèves','Dossiers et historique'],
    ['classes','Classes','Feuilles et fermeture'],
    ['absences','Absences','Exceptions et relances'],
    ['late-arrivals','Retards','Durée, motifs et récidive'],
    ['justifications','Justifications','Preuves et décisions'],
    ['corrections','Corrections','Avant/après et approbation'],
    ['day-closure','Clôture','Readiness institutionnelle'],
    ['analytics','Analyse','Tendances expliquées'],
    ['audit','Audit','Chronologie et preuves'],
  ].map(([key,label,description])=>({key,label,description})),
  timetable: [
    ['command','Commandement','Readiness et publication'],
    ['calendar','Calendrier','Architecture temporelle'],
    ['classes','Classes','Planning par groupe'],
    ['teachers','Enseignants','Charge et conflits'],
    ['constraints','Contraintes','Règles de planification'],
    ['conflicts','Conflits','Détection et résolution'],
    ['publication','Publication','Impact et approbation'],
    ['revisions','Révisions','Versions et historique'],
    ['audit','Audit','Preuves de changement'],
  ].map(([key,label,description])=>({key,label,description})),
  learning: [
    ['command','Commandement','Exécution académique'],
    ['curriculum','Programme','Structure et couverture'],
    ['courses','Cours','Planifié versus réalisé'],
    ['progression','Progression','Avancement traçable'],
    ['homework','Devoirs','Publication et échéances'],
    ['submissions','Soumissions','Réception et revue'],
    ['review','Revue','Blocages et actions'],
    ['audit','Audit','Chronologie académique'],
  ].map(([key,label,description])=>({key,label,description})),
  assessment: [
    ['assessment-command','Commandement','Readiness des résultats'],
    ['sessions','Sessions','Cadre d’évaluation'],
    ['examinations','Examens','Épreuves et barèmes'],
    ['gradebook','Notes','Matrice de production'],
    ['missing-grades','Notes manquantes','Exceptions et responsables'],
    ['averages','Moyennes','Calcul explicable'],
    ['validation','Validation','Chaîne d’autorité'],
    ['report-cards','Bulletins','Studio de production'],
    ['appreciations','Appréciations','Rédaction et revue'],
    ['publication','Publication','Résultats et preuves'],
    ['assessment-audit','Audit','Historique académique'],
  ].map(([key,label,description])=>({key,label,description})),
}

export const ACADEMIC_AUTHORITY_ROUTE_MAP = {
  attendance: '/angelcare-360-command-center/presences',
  timetable: '/angelcare-360-command-center/emploi-du-temps',
  learning: '/angelcare-360-command-center/academique',
  assessment: '/angelcare-360-command-center/academique',
} as const
