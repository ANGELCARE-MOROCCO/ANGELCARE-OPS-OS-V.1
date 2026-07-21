import type { RevenueCommandApprovalClass, RevenueCommandFamily, RevenueCommandRunMode } from './types'
export const REVENUE_COMMAND_KERNEL_RELEASE_CODE='AC-REVENUE-OS-MZ09-COMMANDS-3000'
export const REVENUE_COMMAND_KERNEL_MODULE_VERSION='9.0.0-phase9'
export const REVENUE_COMMAND_KERNEL_EXECUTION_POSTURE='shadow' as const
export const REVENUE_COMMAND_KERNEL_EXTERNAL_ACTIONS=false as const
export const REVENUE_COMMAND_KERNEL_ROUTE='/revenue-command-os/command-kernel'
export const REVENUE_COMMAND_KERNEL_PERMISSIONS={view:'revenue_os.commands.view',manage:'revenue_os.commands.manage',simulate:'revenue_os.commands.simulate',execute:'revenue_os.commands.execute',approve:'revenue_os.commands.approve',rollback:'revenue_os.commands.rollback',audit:'revenue_os.commands.audit'} as const
export const REVENUE_COMMAND_FAMILIES:RevenueCommandFamily[]=[
{id:'fam-market',code:'market-sensing',name:'Veille marché & opportunités',description:'Détecter les signaux, fenêtres et opportunités de revenu.',targetCount:250,order:10,ownerRole:'Chief Revenue Intelligence',active:true},
{id:'fam-segment',code:'segmentation-account-discovery',name:'Segmentation & découverte comptes',description:'Prioriser ICP, comptes et décideurs pertinents.',targetCount:300,order:20,ownerRole:'Market Intelligence Strategist',active:true},
{id:'fam-offer',code:'offer-pricing',name:'Offres, packaging & prix',description:'Architecturer valeur, offre, bundle et marge.',targetCount:250,order:30,ownerRole:'Offer & Monetization Architect',active:true},
{id:'fam-gtm',code:'campaign-go-to-market',name:'Campagnes & go-to-market',description:'Assembler attaques marché, vagues et canaux.',targetCount:300,order:40,ownerRole:'Revenue Strategy Lead',active:true},
{id:'fam-outreach',code:'outreach-channel',name:'Outreach & orchestration canaux',description:'Choisir messages, séquences et canaux sous contrôle.',targetCount:400,order:50,ownerRole:'Sales Conversion Strategist',active:true},
{id:'fam-qualification',code:'qualification-progression',name:'Qualification & progression',description:'Faire progresser les opportunités avec preuves.',targetCount:250,order:60,ownerRole:'Commercial Excellence Lead',active:true},
{id:'fam-meeting',code:'meetings-diagnostics',name:'Réunions, diagnostics & démonstrations',description:'Préparer et exploiter les interactions décisives.',targetCount:200,order:70,ownerRole:'Meeting Conversion Strategist',active:true},
{id:'fam-closing',code:'proposal-negotiation-closing',name:'Propositions, négociation & closing',description:'Protéger valeur, marge, autorité et conversion.',targetCount:250,order:80,ownerRole:'Closing Architect',active:true},
{id:'fam-rescue',code:'pipeline-rescue',name:'Accélération pipeline & rescue',description:'Débloquer, récupérer et accélérer les revenus.',targetCount:250,order:90,ownerRole:'Revenue Rescue Lead',active:true},
{id:'fam-expand',code:'renewal-expansion-referral',name:'Renouvellement & expansion',description:'Renouveler, upsell, cross-sell et referral.',targetCount:200,order:100,ownerRole:'Customer Revenue Lead',active:true},
{id:'fam-exec',code:'executive-forecasting',name:'Scénarios exécutifs & prévisions',description:'Simuler scénarios, risques et résultats.',targetCount:150,order:110,ownerRole:'Executive Revenue Office',active:true},
{id:'fam-audit',code:'audit-optimization',name:'Audit & optimisation continue',description:'Valider, mesurer et supprimer les comportements faibles.',targetCount:200,order:120,ownerRole:'Independent Revenue Auditor',active:true},
]
export const REVENUE_COMMAND_APPROVAL_RANK:Record<RevenueCommandApprovalClass,number>={none:0,recommendation:1,'internal-generation':2,supervisor:3,department:4,director:5,executive:6,prohibited:99}
export const REVENUE_COMMAND_SAFE_MODES:RevenueCommandRunMode[]=['shadow','simulation','recommend','approval-gated']
export const REVENUE_COMMAND_FORBIDDEN_EXTERNAL_TOOLS=['send_email','send_whatsapp','apply_discount','sign_contract','release_payment','confirm_capacity','commit_price']
export const REVENUE_COMMAND_KERNEL_SECTIONS=[
{key:'overview',label:'Vue du noyau',href:'/revenue-command-os/command-kernel'},
{key:'catalogue',label:'Catalogue des commandes',href:'/revenue-command-os/command-kernel/catalogue'},
{key:'taxonomy',label:'Familles & taxonomie',href:'/revenue-command-os/command-kernel/taxonomy'},
{key:'routing',label:'Routage & éligibilité',href:'/revenue-command-os/command-kernel/routing'},
{key:'triggers',label:'Déclencheurs',href:'/revenue-command-os/command-kernel/triggers'},
{key:'schedules',label:'Planification',href:'/revenue-command-os/command-kernel/schedules'},
{key:'graphs',label:'Graphes de commandes',href:'/revenue-command-os/command-kernel/graphs'},
{key:'simulation',label:'Simulation',href:'/revenue-command-os/command-kernel/simulation'},
{key:'runs',label:'Exécutions',href:'/revenue-command-os/command-kernel/runs'},
{key:'versions',label:'Versions & rollback',href:'/revenue-command-os/command-kernel/versions'},
{key:'guardrails',label:'Permissions & garde-fous',href:'/revenue-command-os/command-kernel/guardrails'},
{key:'validation',label:'Validation du noyau',href:'/revenue-command-os/command-kernel/validation'},
] as const
