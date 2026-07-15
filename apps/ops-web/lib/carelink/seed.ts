import type { CareLinkAgent, CareLinkMission, DispatchThread, OpsKpi } from './types'

export const carelinkAgents: CareLinkAgent[] = [
  {
    id: 'agent-001', code: 'AC-FLD-001', fullName: 'Imane El Fassi', role: 'Spécialiste enfance', phone: '+212 6 00 00 00 01', city: 'Rabat', zones: ['Agdal', 'Hay Riad', 'Souissi'], languages: ['FR', 'AR', 'EN'], skills: ['Accompagnement enfant', 'Premiers secours', 'Routines à domicile'], status: 'active', complianceStatus: 'ready', reliabilityScore: 94, acceptanceRate: 91, onTimeRate: 96, reportRate: 98, avatarInitials: 'IF',
  },
  {
    id: 'agent-002', code: 'AC-FLD-002', fullName: 'Salma Benali', role: 'Aidante', phone: '+212 6 00 00 00 02', city: 'Casablanca', zones: ['Maarif', 'Anfa', 'Racine'], languages: ['FR', 'AR'], skills: ['Accompagnement senior', 'Aide à la mobilité', 'Aide aux repas'], status: 'warning', complianceStatus: 'warning', reliabilityScore: 87, acceptanceRate: 86, onTimeRate: 89, reportRate: 93, avatarInitials: 'SB',
  },
  {
    id: 'agent-003', code: 'AC-FLD-003', fullName: 'Nadia Ait Omar', role: 'Agent terrain soins à domicile', phone: '+212 6 00 00 00 03', city: 'Marrakech', zones: ['Gueliz', 'Hivernage'], languages: ['FR', 'AR'], skills: ['Assistance quotidienne', 'Aide à l’hygiène', 'Présence accompagnée'], status: 'active', complianceStatus: 'ready', reliabilityScore: 91, acceptanceRate: 90, onTimeRate: 92, reportRate: 95, avatarInitials: 'NA',
  },
]

export const carelinkMissions: CareLinkMission[] = [
  {
    id: 'mission-001', code: 'AC-CL-2026-00421', serviceType: 'GARDE D’ENFANT À DOMICILE', clientLabel: 'Famille B.', beneficiaryContext: 'Enfant de 4 ans · routine calme · repas déjà préparé', city: 'Rabat', zone: 'Agdal', addressHint: 'Adresse complète visible après validation du dispatch', scheduledStart: '2026-06-09T09:00:00', scheduledEnd: '2026-06-09T13:00:00', durationHours: 4, status: 'dispatch_confirmed', agentId: 'agent-001', riskLevel: 'medium', readinessScore: 92, readinessStatus: 'ready', priority: 'high', dispatchThreadId: 'thread-001',
    instructions: ['Relire les consignes parentales avant l’arrivée.', 'Confirmer un environnement sécurisé.', 'Ne jamais administrer de médicament sans validation du dispatch.', 'Soumettre le compte rendu final avant 14:00.'],
    checklist: [
      { id: 'c1', phase: 'pre_arrival', title: 'Consignes parentales relues', required: true, completed: true },
      { id: 'c2', phase: 'start', title: 'Identité du client confirmée', required: true, completed: false },
      { id: 'c3', phase: 'during', title: 'Hydratation et repas suivis', required: true, completed: false },
      { id: 'c4', phase: 'completion', title: 'Compte rendu final complété', required: true, completed: false },
    ],
    lifecycle: [
      { id: 'e1', status: 'assigned', label: 'Mission assignée', timestamp: '2026-06-08T17:10:00', actor: 'Centre dispatch' },
      { id: 'e2', status: 'agent_accepted', label: 'Acceptée par l’agente', timestamp: '2026-06-08T17:18:00', actor: 'Imane' },
      { id: 'e3', status: 'dispatch_confirmed', label: 'Confirmée par le dispatch', timestamp: '2026-06-08T17:30:00', actor: 'Opérations' },
    ],
  },
  {
    id: 'mission-002', code: 'AC-CL-2026-00422', serviceType: 'ACCOMPAGNEMENT D’AIDANCE', clientLabel: 'Bénéficiaire R.', beneficiaryContext: 'Personne âgée · mobilité assistée · présence familiale partielle', city: 'Casablanca', zone: 'Racine', addressHint: 'Adresse sécurisée après acceptation', scheduledStart: '2026-06-09T15:00:00', scheduledEnd: '2026-06-09T19:00:00', durationHours: 4, status: 'assigned', agentId: 'agent-002', riskLevel: 'low', readinessScore: 74, readinessStatus: 'warning', priority: 'normal', dispatchThreadId: 'thread-002',
    instructions: ['Confirmer la disponibilité avant 11:00.', 'Prévoir 30 minutes de marge de déplacement.', 'Observer l’état général et signaler tout changement.'],
    checklist: [
      { id: 'c5', phase: 'pre_arrival', title: 'Disponibilité confirmée', required: true, completed: false },
      { id: 'c6', phase: 'start', title: 'Identité du bénéficiaire confirmée', required: true, completed: false },
      { id: 'c7', phase: 'during', title: 'Aide à la mobilité réalisée avec prudence', required: true, completed: false },
      { id: 'c8', phase: 'completion', title: 'Notes de confort soumises', required: true, completed: false },
    ],
    lifecycle: [{ id: 'e4', status: 'assigned', label: 'Mission assignée', timestamp: '2026-06-08T18:00:00', actor: 'Centre dispatch' }],
  },
  {
    id: 'mission-003', code: 'AC-CL-2026-00423', serviceType: 'VISITE DE CONFORT À DOMICILE', clientLabel: 'Famille H.', beneficiaryContext: 'Adulte dépendant · visite courte · vérification de l’environnement', city: 'Rabat', zone: 'Hay Riad', addressHint: 'Coordonnées disponibles dans le dossier sécurisé', scheduledStart: '2026-06-10T10:00:00', scheduledEnd: '2026-06-10T12:00:00', durationHours: 2, status: 'in_progress', agentId: 'agent-003', riskLevel: 'high', readinessScore: 81, readinessStatus: 'warning', priority: 'urgent', dispatchThreadId: 'thread-003',
    instructions: ['Vérifier les accès au domicile.', 'Signaler immédiatement toute anomalie de sécurité.', 'Compte rendu renforcé requis.'],
    checklist: [
      { id: 'c9', phase: 'pre_arrival', title: 'Brief du dispatch lu', required: true, completed: true },
      { id: 'c10', phase: 'start', title: 'Arrivée confirmée', required: true, completed: true },
      { id: 'c11', phase: 'during', title: 'Environnement observé', required: true, completed: false },
      { id: 'c12', phase: 'completion', title: 'Rapport renforcé envoyé', required: true, completed: false },
    ],
    lifecycle: [
      { id: 'e5', status: 'assigned', label: 'Mission assignée', timestamp: '2026-06-08T16:00:00', actor: 'Centre dispatch' },
      { id: 'e6', status: 'agent_accepted', label: 'Acceptée', timestamp: '2026-06-08T16:05:00', actor: 'Nadia' },
      { id: 'e7', status: 'en_route', label: 'En route', timestamp: '2026-06-10T09:25:00', actor: 'Nadia' },
      { id: 'e8', status: 'mission_started', label: 'Mission démarrée', timestamp: '2026-06-10T10:03:00', actor: 'Nadia' },
    ],
  },
]

export const dispatchThreads: DispatchThread[] = [
  { id: 'thread-001', missionId: 'mission-001', title: 'Mission AC-CL-2026-00421', priority: 'urgent', status: 'waiting_agent', lastMessage: 'Merci de confirmer la lecture des consignes sensibles.', updatedAt: '2026-06-09T07:45:00' },
  { id: 'thread-002', missionId: 'mission-002', title: 'Disponibilité de la mission aidance', priority: 'normal', status: 'open', lastMessage: 'Mission proposée, en attente d’acceptation.', updatedAt: '2026-06-08T18:02:00' },
  { id: 'thread-003', missionId: 'mission-003', title: 'Incident potentiel à l’adresse', priority: 'critical', status: 'waiting_dispatch', lastMessage: 'L’agente demande confirmation de l’accès à l’immeuble.', updatedAt: '2026-06-10T09:52:00' },
]

export const opsKpis: OpsKpi[] = [
  { label: 'Missions aujourd’hui', value: '38', delta: '+12% vs hier', tone: 'blue' },
  { label: 'En cours terrain', value: '11', delta: '4 à risque', tone: 'amber' },
  { label: 'Agents disponibles', value: '24', delta: '7 zones couvertes', tone: 'green' },
  { label: 'Rapports à valider', value: '16', delta: '6 renforcés', tone: 'slate' },
  { label: 'Incidents ouverts', value: '3', delta: '1 critique', tone: 'red' },
]
