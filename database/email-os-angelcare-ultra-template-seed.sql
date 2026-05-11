create table if not exists email_os_core_templates (
  id text primary key,
  name text,
  subject text,
  category text,
  body text,
  language text default 'fr',
  priority text default 'normal',
  department text,
  tone text,
  status text default 'active',
  instructions text,
  variables jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0001_validation-strategique','Validation stratégique','Validation stratégique — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Validation stratégique », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0002_escalade-critique','Escalade critique','Escalade critique — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Escalade critique », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0003_decision-direction','Décision direction','Décision direction — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Décision direction », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0004_compte-rendu-executif','Compte rendu exécutif','Compte rendu exécutif — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Compte rendu exécutif », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0005_priorite-immediate','Priorité immédiate','Priorité immédiate — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Priorité immédiate », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0006_reunion-strategique','Réunion stratégique','Réunion stratégique — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Réunion stratégique », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0007_transmission-confidentielle','Transmission confidentielle','Transmission confidentielle — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Transmission confidentielle », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0008_validation-budgetaire','Validation budgétaire','Validation budgétaire — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Validation budgétaire », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0009_activation-operationnelle','Activation opérationnelle','Activation opérationnelle — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Activation opérationnelle », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0010_gestion-crise','Gestion crise','Gestion crise — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Gestion crise », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0011_arbitrage-direction','Arbitrage direction','Arbitrage direction — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Arbitrage direction », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0012_synthese-hebdomadaire','Synthèse hebdomadaire','Synthèse hebdomadaire — action requise','Direction Exécutive','Bonjour,

Dans le cadre de « Synthèse hebdomadaire », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Direction Exécutive','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0013_prise-de-contact-entreprise','Prise de contact entreprise','Prise de contact entreprise — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Prise de contact entreprise », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0014_relance-proposition','Relance proposition','Relance proposition — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Relance proposition », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0015_transmission-devis','Transmission devis','Transmission devis — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Transmission devis », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0016_proposition-partenariat','Proposition partenariat','Proposition partenariat — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Proposition partenariat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0017_planification-reunion','Planification réunion','Planification réunion — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Planification réunion », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0018_offre-corporate','Offre corporate','Offre corporate — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Offre corporate », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0019_activation-pilote','Activation pilote','Activation pilote — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Activation pilote », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0020_negociation-commerciale','Négociation commerciale','Négociation commerciale — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Négociation commerciale », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0021_validation-collaboration','Validation collaboration','Validation collaboration — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Validation collaboration », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0022_renouvellement-contrat','Renouvellement contrat','Renouvellement contrat — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Renouvellement contrat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0023_relance-decideur','Relance décideur','Relance décideur — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Relance décideur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0024_deploiement-service','Déploiement service','Déploiement service — action requise','Commercial B2B','Bonjour,

Dans le cadre de « Déploiement service », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2B','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0025_bienvenue-client','Bienvenue client','Bienvenue client — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Bienvenue client », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0026_confirmation-rendez-vous','Confirmation rendez-vous','Confirmation rendez-vous — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Confirmation rendez-vous », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0027_suivi-dossier','Suivi dossier','Suivi dossier — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Suivi dossier », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0028_relance-client','Relance client','Relance client — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Relance client », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0029_transmission-offre','Transmission offre','Transmission offre — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Transmission offre », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0030_rappel-paiement','Rappel paiement','Rappel paiement — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Rappel paiement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0031_activation-service','Activation service','Activation service — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Activation service », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0032_demande-documents','Demande documents','Demande documents — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Demande documents », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0033_reponse-demande','Réponse demande','Réponse demande — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Réponse demande », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0034_fidelisation-client','Fidélisation client','Fidélisation client — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Fidélisation client », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0035_reactivation-client','Réactivation client','Réactivation client — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Réactivation client », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0036_confirmation-prise-en-charge','Confirmation prise en charge','Confirmation prise en charge — action requise','Commercial B2C','Bonjour,

Dans le cadre de « Confirmation prise en charge », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Commercial B2C','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0037_reception-candidature','Réception candidature','Réception candidature — action requise','RH','Bonjour,

Dans le cadre de « Réception candidature », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0038_prequalification','Préqualification','Préqualification — action requise','RH','Bonjour,

Dans le cadre de « Préqualification », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0039_convocation-entretien','Convocation entretien','Convocation entretien — action requise','RH','Bonjour,

Dans le cadre de « Convocation entretien », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0040_validation-entretien','Validation entretien','Validation entretien — action requise','RH','Bonjour,

Dans le cadre de « Validation entretien », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0041_refus-candidature','Refus candidature','Refus candidature — action requise','RH','Bonjour,

Dans le cadre de « Refus candidature », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0042_proposition-recrutement','Proposition recrutement','Proposition recrutement — action requise','RH','Bonjour,

Dans le cadre de « Proposition recrutement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0043_validation-integration','Validation intégration','Validation intégration — action requise','RH','Bonjour,

Dans le cadre de « Validation intégration », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0044_objectifs-hebdomadaires','Objectifs hebdomadaires','Objectifs hebdomadaires — action requise','RH','Bonjour,

Dans le cadre de « Objectifs hebdomadaires », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0045_rappel-discipline','Rappel discipline','Rappel discipline — action requise','RH','Bonjour,

Dans le cadre de « Rappel discipline », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0046_suivi-presence','Suivi présence','Suivi présence — action requise','RH','Bonjour,

Dans le cadre de « Suivi présence », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0047_validation-conge','Validation congé','Validation congé — action requise','RH','Bonjour,

Dans le cadre de « Validation congé », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0048_evaluation-performance','Évaluation performance','Évaluation performance — action requise','RH','Bonjour,

Dans le cadre de « Évaluation performance », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0049_alerte-retard','Alerte retard','Alerte retard — action requise','RH','Bonjour,

Dans le cadre de « Alerte retard », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0050_demande-documents-rh','Demande documents RH','Demande documents RH — action requise','RH','Bonjour,

Dans le cadre de « Demande documents RH », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0051_validation-periode-essai','Validation période essai','Validation période essai — action requise','RH','Bonjour,

Dans le cadre de « Validation période essai », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0052_mobilisation-equipe','Mobilisation équipe','Mobilisation équipe — action requise','RH','Bonjour,

Dans le cadre de « Mobilisation équipe », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','RH','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0053_bienvenue-ambassadeur','Bienvenue ambassadeur','Bienvenue ambassadeur — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Bienvenue ambassadeur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0054_activation-programme','Activation programme','Activation programme — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Activation programme », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0055_objectifs-semaine','Objectifs semaine','Objectifs semaine — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Objectifs semaine », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0056_mission-terrain','Mission terrain','Mission terrain — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Mission terrain », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0057_validation-leads','Validation leads','Validation leads — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Validation leads », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0058_validation-prime','Validation prime','Validation prime — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Validation prime », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0059_classement-performance','Classement performance','Classement performance — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Classement performance », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0060_relance-activite','Relance activité','Relance activité — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Relance activité », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0061_deploiement-zone','Déploiement zone','Déploiement zone — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Déploiement zone », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0062_brief-operationnel','Brief opérationnel','Brief opérationnel — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Brief opérationnel », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0063_challenge-ambassadeur','Challenge ambassadeur','Challenge ambassadeur — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Challenge ambassadeur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0064_rapport-hebdomadaire','Rapport hebdomadaire','Rapport hebdomadaire — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Rapport hebdomadaire », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0065_suspension-programme','Suspension programme','Suspension programme — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Suspension programme », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0066_reactivation-ambassadeur','Réactivation ambassadeur','Réactivation ambassadeur — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Réactivation ambassadeur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0067_annonce-bonus','Annonce bonus','Annonce bonus — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Annonce bonus », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0068_validation-territoire','Validation territoire','Validation territoire — action requise','Ambassadeurs','Bonjour,

Dans le cadre de « Validation territoire », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Ambassadeurs','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0069_confirmation-inscription','Confirmation inscription','Confirmation inscription — action requise','Academy','Bonjour,

Dans le cadre de « Confirmation inscription », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0070_planning-formation','Planning formation','Planning formation — action requise','Academy','Bonjour,

Dans le cadre de « Planning formation », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0071_transmission-support','Transmission support','Transmission support — action requise','Academy','Bonjour,

Dans le cadre de « Transmission support », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0072_validation-paiement','Validation paiement','Validation paiement — action requise','Academy','Bonjour,

Dans le cadre de « Validation paiement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0073_relance-presence','Relance présence','Relance présence — action requise','Academy','Bonjour,

Dans le cadre de « Relance présence », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0074_certification','Certification','Certification — action requise','Academy','Bonjour,

Dans le cadre de « Certification », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0075_suivi-progression','Suivi progression','Suivi progression — action requise','Academy','Bonjour,

Dans le cadre de « Suivi progression », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0076_activation-groupe','Activation groupe','Activation groupe — action requise','Academy','Bonjour,

Dans le cadre de « Activation groupe », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0077_coordination-formateur','Coordination formateur','Coordination formateur — action requise','Academy','Bonjour,

Dans le cadre de « Coordination formateur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0078_feedback-formation','Feedback formation','Feedback formation — action requise','Academy','Bonjour,

Dans le cadre de « Feedback formation », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0079_rappel-session','Rappel session','Rappel session — action requise','Academy','Bonjour,

Dans le cadre de « Rappel session », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0080_convocation-evaluation','Convocation évaluation','Convocation évaluation — action requise','Academy','Bonjour,

Dans le cadre de « Convocation évaluation », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Academy','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0081_reponse-support','Réponse support','Réponse support — action requise','Support Client','Bonjour,

Dans le cadre de « Réponse support », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0082_confirmation-reception','Confirmation réception','Confirmation réception — action requise','Support Client','Bonjour,

Dans le cadre de « Confirmation réception », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0083_escalade-technique','Escalade technique','Escalade technique — action requise','Support Client','Bonjour,

Dans le cadre de « Escalade technique », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0084_mise-a-jour-dossier','Mise à jour dossier','Mise à jour dossier — action requise','Support Client','Bonjour,

Dans le cadre de « Mise à jour dossier », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0085_resolution-probleme','Résolution problème','Résolution problème — action requise','Support Client','Bonjour,

Dans le cadre de « Résolution problème », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0086_demande-complement','Demande complément','Demande complément — action requise','Support Client','Bonjour,

Dans le cadre de « Demande complément », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0087_suivi-satisfaction','Suivi satisfaction','Suivi satisfaction — action requise','Support Client','Bonjour,

Dans le cadre de « Suivi satisfaction », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0088_reclamation-client','Réclamation client','Réclamation client — action requise','Support Client','Bonjour,

Dans le cadre de « Réclamation client », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0089_retard-traitement','Retard traitement','Retard traitement — action requise','Support Client','Bonjour,

Dans le cadre de « Retard traitement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0090_incident-service','Incident service','Incident service — action requise','Support Client','Bonjour,

Dans le cadre de « Incident service », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0091_cloture-ticket','Clôture ticket','Clôture ticket — action requise','Support Client','Bonjour,

Dans le cadre de « Clôture ticket », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0092_priorite-client','Priorité client','Priorité client — action requise','Support Client','Bonjour,

Dans le cadre de « Priorité client », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Support Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0093_transmission-t-che','Transmission tâche','Transmission tâche — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Transmission tâche », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0094_urgence-operationnelle','Urgence opérationnelle','Urgence opérationnelle — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Urgence opérationnelle », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0095_coordination-departement','Coordination département','Coordination département — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Coordination département », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0096_validation-action','Validation action','Validation action — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Validation action », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0097_compte-rendu-journalier','Compte rendu journalier','Compte rendu journalier — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Compte rendu journalier », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0098_priorite-immediate','Priorité immédiate','Priorité immédiate — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Priorité immédiate », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0099_blocage-operationnel','Blocage opérationnel','Blocage opérationnel — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Blocage opérationnel », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0100_escalade-interne','Escalade interne','Escalade interne — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Escalade interne », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0101_demande-arbitrage','Demande arbitrage','Demande arbitrage — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Demande arbitrage », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0102_suivi-execution','Suivi exécution','Suivi exécution — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Suivi exécution », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0103_relance-responsable','Relance responsable','Relance responsable — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Relance responsable », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0104_alignement-equipe','Alignement équipe','Alignement équipe — action requise','Coordination Interne','Bonjour,

Dans le cadre de « Alignement équipe », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Coordination Interne','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0105_prise-de-contact-partenaire','Prise de contact partenaire','Prise de contact partenaire — action requise','Partenariats','Bonjour,

Dans le cadre de « Prise de contact partenaire », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0106_activation-collaboration','Activation collaboration','Activation collaboration — action requise','Partenariats','Bonjour,

Dans le cadre de « Activation collaboration », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0107_presentation-partenariat','Présentation partenariat','Présentation partenariat — action requise','Partenariats','Bonjour,

Dans le cadre de « Présentation partenariat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0108_reunion-strategique','Réunion stratégique','Réunion stratégique — action requise','Partenariats','Bonjour,

Dans le cadre de « Réunion stratégique », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0109_validation-partenariat','Validation partenariat','Validation partenariat — action requise','Partenariats','Bonjour,

Dans le cadre de « Validation partenariat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0110_extension-collaboration','Extension collaboration','Extension collaboration — action requise','Partenariats','Bonjour,

Dans le cadre de « Extension collaboration », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0111_suivi-partenariat','Suivi partenariat','Suivi partenariat — action requise','Partenariats','Bonjour,

Dans le cadre de « Suivi partenariat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0112_convention-partenariat','Convention partenariat','Convention partenariat — action requise','Partenariats','Bonjour,

Dans le cadre de « Convention partenariat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0113_relance-institutionnelle','Relance institutionnelle','Relance institutionnelle — action requise','Partenariats','Bonjour,

Dans le cadre de « Relance institutionnelle », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0114_cooperation-locale','Coopération locale','Coopération locale — action requise','Partenariats','Bonjour,

Dans le cadre de « Coopération locale », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0115_accord-de-principe','Accord de principe','Accord de principe — action requise','Partenariats','Bonjour,

Dans le cadre de « Accord de principe », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0116_renouvellement-partenariat','Renouvellement partenariat','Renouvellement partenariat — action requise','Partenariats','Bonjour,

Dans le cadre de « Renouvellement partenariat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Partenariats','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0117_transmission-facture','Transmission facture','Transmission facture — action requise','Finance','Bonjour,

Dans le cadre de « Transmission facture », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0118_rappel-paiement','Rappel paiement','Rappel paiement — action requise','Finance','Bonjour,

Dans le cadre de « Rappel paiement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0119_validation-paiement','Validation paiement','Validation paiement — action requise','Finance','Bonjour,

Dans le cadre de « Validation paiement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0120_confirmation-reception','Confirmation réception','Confirmation réception — action requise','Finance','Bonjour,

Dans le cadre de « Confirmation réception », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0121_escalade-financiere','Escalade financière','Escalade financière — action requise','Finance','Bonjour,

Dans le cadre de « Escalade financière », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0122_validation-budget','Validation budget','Validation budget — action requise','Finance','Bonjour,

Dans le cadre de « Validation budget », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0123_suivi-encaissement','Suivi encaissement','Suivi encaissement — action requise','Finance','Bonjour,

Dans le cadre de « Suivi encaissement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0124_demande-justificatif','Demande justificatif','Demande justificatif — action requise','Finance','Bonjour,

Dans le cadre de « Demande justificatif », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0125_retard-paiement','Retard paiement','Retard paiement — action requise','Finance','Bonjour,

Dans le cadre de « Retard paiement », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0126_paiement-recu','Paiement reçu','Paiement reçu — action requise','Finance','Bonjour,

Dans le cadre de « Paiement reçu », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0127_correction-facture','Correction facture','Correction facture — action requise','Finance','Bonjour,

Dans le cadre de « Correction facture », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0128_cloture-financiere','Clôture financière','Clôture financière — action requise','Finance','Bonjour,

Dans le cadre de « Clôture financière », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Finance','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0129_transmission-contrat','Transmission contrat','Transmission contrat — action requise','Juridique','Bonjour,

Dans le cadre de « Transmission contrat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0130_validation-juridique','Validation juridique','Validation juridique — action requise','Juridique','Bonjour,

Dans le cadre de « Validation juridique », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0131_modification-clauses','Modification clauses','Modification clauses — action requise','Juridique','Bonjour,

Dans le cadre de « Modification clauses », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0132_confirmation-conformite','Confirmation conformité','Confirmation conformité — action requise','Juridique','Bonjour,

Dans le cadre de « Confirmation conformité », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0133_gestion-litige','Gestion litige','Gestion litige — action requise','Juridique','Bonjour,

Dans le cadre de « Gestion litige », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0134_transmission-nda','Transmission NDA','Transmission NDA — action requise','Juridique','Bonjour,

Dans le cadre de « Transmission NDA », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0135_demande-validation-document','Demande validation document','Demande validation document — action requise','Juridique','Bonjour,

Dans le cadre de « Demande validation document », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0136_alerte-conformite','Alerte conformité','Alerte conformité — action requise','Juridique','Bonjour,

Dans le cadre de « Alerte conformité », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Juridique','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0137_activation-campagne','Activation campagne','Activation campagne — action requise','Marketing','Bonjour,

Dans le cadre de « Activation campagne », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0138_coordination-contenu','Coordination contenu','Coordination contenu — action requise','Marketing','Bonjour,

Dans le cadre de « Coordination contenu », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0139_validation-publication','Validation publication','Validation publication — action requise','Marketing','Bonjour,

Dans le cadre de « Validation publication », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0140_transmission-visuels','Transmission visuels','Transmission visuels — action requise','Marketing','Bonjour,

Dans le cadre de « Transmission visuels », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0141_rapport-performance','Rapport performance','Rapport performance — action requise','Marketing','Bonjour,

Dans le cadre de « Rapport performance », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0142_escalade-branding','Escalade branding','Escalade branding — action requise','Marketing','Bonjour,

Dans le cadre de « Escalade branding », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0143_brief-campagne','Brief campagne','Brief campagne — action requise','Marketing','Bonjour,

Dans le cadre de « Brief campagne », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0144_relance-contenu','Relance contenu','Relance contenu — action requise','Marketing','Bonjour,

Dans le cadre de « Relance contenu », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0145_validation-message','Validation message','Validation message — action requise','Marketing','Bonjour,

Dans le cadre de « Validation message », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0146_coordination-influence','Coordination influence','Coordination influence — action requise','Marketing','Bonjour,

Dans le cadre de « Coordination influence », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0147_annonce-activation','Annonce activation','Annonce activation — action requise','Marketing','Bonjour,

Dans le cadre de « Annonce activation », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0148_bilan-campagne','Bilan campagne','Bilan campagne — action requise','Marketing','Bonjour,

Dans le cadre de « Bilan campagne », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Marketing','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0149_alerte-critique','Alerte critique','Alerte critique — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Alerte critique », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0150_escalade-immediate','Escalade immédiate','Escalade immédiate — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Escalade immédiate », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0151_incident-majeur','Incident majeur','Incident majeur — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Incident majeur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0152_blocage-operationnel','Blocage opérationnel','Blocage opérationnel — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Blocage opérationnel », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0153_interruption-service','Interruption service','Interruption service — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Interruption service », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0154_priorite-absolue','Priorité absolue','Priorité absolue — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Priorité absolue », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0155_plan-correction','Plan correction','Plan correction — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Plan correction », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0156_communication-urgence','Communication urgence','Communication urgence — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Communication urgence », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0157_rapport-incident','Rapport incident','Rapport incident — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Rapport incident », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0158_cloture-crise','Clôture crise','Clôture crise — action requise','Crise & Escalade','Bonjour,

Dans le cadre de « Clôture crise », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','high','Crise & Escalade','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0159_deploiement-terrain','Déploiement terrain','Déploiement terrain — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Déploiement terrain », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0160_brief-mission','Brief mission','Brief mission — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Brief mission », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0161_confirmation-presence','Confirmation présence','Confirmation présence — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Confirmation présence », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0162_validation-rapport-terrain','Validation rapport terrain','Validation rapport terrain — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Validation rapport terrain », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0163_incident-terrain','Incident terrain','Incident terrain — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Incident terrain », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0164_affectation-zone','Affectation zone','Affectation zone — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Affectation zone », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0165_relance-equipe-terrain','Relance équipe terrain','Relance équipe terrain — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Relance équipe terrain », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0166_controle-qualite-terrain','Contrôle qualité terrain','Contrôle qualité terrain — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Contrôle qualité terrain », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0167_planning-intervention','Planning intervention','Planning intervention — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Planning intervention », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0168_cloture-mission','Clôture mission','Clôture mission — action requise','Terrain & Opérations','Bonjour,

Dans le cadre de « Clôture mission », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Terrain & Opérations','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0169_controle-qualite','Contrôle qualité','Contrôle qualité — action requise','Qualité','Bonjour,

Dans le cadre de « Contrôle qualité », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0170_non-conformite','Non-conformité','Non-conformité — action requise','Qualité','Bonjour,

Dans le cadre de « Non-conformité », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0171_plan-amelioration','Plan amélioration','Plan amélioration — action requise','Qualité','Bonjour,

Dans le cadre de « Plan amélioration », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0172_validation-correction','Validation correction','Validation correction — action requise','Qualité','Bonjour,

Dans le cadre de « Validation correction », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0173_audit-interne','Audit interne','Audit interne — action requise','Qualité','Bonjour,

Dans le cadre de « Audit interne », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0174_feedback-qualite','Feedback qualité','Feedback qualité — action requise','Qualité','Bonjour,

Dans le cadre de « Feedback qualité », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0175_suivi-standard','Suivi standard','Suivi standard — action requise','Qualité','Bonjour,

Dans le cadre de « Suivi standard », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0176_rapport-qualite','Rapport qualité','Rapport qualité — action requise','Qualité','Bonjour,

Dans le cadre de « Rapport qualité », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','Qualité','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0177_client-interesse-sans-reponse','Client intéressé sans réponse','Client intéressé sans réponse — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client intéressé sans réponse », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0178_client-hesitant-sur-le-prix','Client hésitant sur le prix','Client hésitant sur le prix — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client hésitant sur le prix », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0179_client-demande-rappel-whatsapp','Client demande rappel WhatsApp','Client demande rappel WhatsApp — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client demande rappel WhatsApp », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0180_client-a-forte-valeur','Client à forte valeur','Client à forte valeur — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client à forte valeur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0181_client-insatisfait','Client insatisfait','Client insatisfait — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client insatisfait », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0182_client-a-reactiver','Client à réactiver','Client à réactiver — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client à réactiver », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0183_client-demande-urgence','Client demande urgence','Client demande urgence — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client demande urgence », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0184_client-demande-documentation','Client demande documentation','Client demande documentation — action requise','B2C Cycle Client','Bonjour,

Dans le cadre de « Client demande documentation », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2C Cycle Client','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0185_direction-demande-proposition','Direction demande proposition','Direction demande proposition — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Direction demande proposition », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0186_acheteur-demande-details','Acheteur demande détails','Acheteur demande détails — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Acheteur demande détails », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0187_relance-apres-presentation','Relance après présentation','Relance après présentation — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Relance après présentation », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0188_relance-apres-silence','Relance après silence','Relance après silence — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Relance après silence », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0189_transmission-offre-finale','Transmission offre finale','Transmission offre finale — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Transmission offre finale », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0190_demarrage-pilote','Démarrage pilote','Démarrage pilote — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Démarrage pilote », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0191_validation-decideur','Validation décideur','Validation décideur — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Validation décideur », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();

insert into email_os_core_templates (id,name,subject,category,body,language,priority,department,tone,status,instructions,variables) values (
'tpl_0192_preparation-contrat','Préparation contrat','Préparation contrat — action requise','B2B Cycle Entreprise','Bonjour,

Dans le cadre de « Préparation contrat », merci de traiter le sujet suivant : [SUJET À MODIFIER].

Contexte opérationnel :
- Client / entreprise / personne concernée : [NOM À MODIFIER]
- Service ou projet : [SERVICE / PROJET À MODIFIER]
- Responsable : [RESPONSABLE À MODIFIER]
- Priorité : [PRIORITÉ À MODIFIER]
- Date limite : [DATE LIMITE À MODIFIER]

Points importants :
- [POINT 1 À MODIFIER]
- [POINT 2 À MODIFIER]
- [POINT 3 À MODIFIER]

Action demandée :
Merci de confirmer la prise en charge et de transmettre un retour clair avant [DATE / HEURE À MODIFIER].

Prochaine étape :
Après validation, l’équipe AngelCare procédera à [PROCHAINE ACTION À MODIFIER].

Cordialement,
AngelCare
','fr','normal','B2B Cycle Entreprise','professionnel_operationnel','active','Remplacer tous les champs entre crochets avant envoi. Vérifier destinataire, priorité et contexte.','["[SUJET À MODIFIER]", "[NOM À MODIFIER]", "[SERVICE / PROJET À MODIFIER]", "[RESPONSABLE À MODIFIER]", "[PRIORITÉ À MODIFIER]", "[DATE LIMITE À MODIFIER]", "[POINT 1 À MODIFIER]", "[POINT 2 À MODIFIER]", "[POINT 3 À MODIFIER]", "[PROCHAINE ACTION À MODIFIER]"]'::jsonb
) on conflict (id) do update set name=excluded.name, subject=excluded.subject, category=excluded.category, body=excluded.body, updated_at=now();