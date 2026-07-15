-- Optional examples. Adjust emails before running.

-- Add CSA permissions to an existing CSA user:
-- update app_users
-- set role = 'csa',
--     department = coalesce(nullif(department, ''), 'Customer Success'),
--     permissions = '["profile.view","staff_portal.view","families.view","leads.view","sales.view","services.view","revenue.view","voice.view","incidents.view","csa.home","csa.view","csa.leads.followup","csa.families.manage","csa.services.activate","csa.revenue.recover","csa.escalations.manage"]'::jsonb
-- where email = 'csa@example.com';

-- Verify:
-- select full_name, email, role, department, permissions
-- from app_users
-- where role = 'csa';
