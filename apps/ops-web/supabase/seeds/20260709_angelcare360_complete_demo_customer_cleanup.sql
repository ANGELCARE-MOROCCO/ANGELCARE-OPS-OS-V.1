-- AngelCare 360 complete demo customer cleanup
-- Destructive. Run only when you intentionally want to remove the demo tenant and its school data from this Supabase project.
-- This file deletes only rows that are clearly tied to AC360-DEMO-PE-CASA / petits-explorateurs-casa-demo.

begin;

create extension if not exists pgcrypto;

create temporary table angelcare360_demo_cleanup_keys on commit drop as
select
  (select id from public.angelcare360_schools where school_code = 'AC360-DEMO-PE-CASA-SCHOOL') as school_id,
  (select id from public.angelcare360_operator_clients where client_code = 'AC360-DEMO-PE-CASA') as client_id,
  (select id from public.angelcare360_operator_tenants where tenant_slug = 'petits-explorateurs-casa-demo') as tenant_id;

-- ---------------------------------------------------------------------------
-- Operator cleanup
-- ---------------------------------------------------------------------------

delete from public.angelcare360_operator_audit_logs l
using angelcare360_demo_cleanup_keys k
where l.client_id = k.client_id
  or l.tenant_id = k.tenant_id;

delete from public.angelcare360_operator_payment_gates g
using angelcare360_demo_cleanup_keys k
where g.client_id = k.client_id
  and g.gate_code = 'AC360-GATE-DEMO-PE-CASA-0001';

delete from public.angelcare360_operator_feature_flags f
using angelcare360_demo_cleanup_keys k
where f.client_id = k.client_id
  and f.tenant_id = k.tenant_id;

delete from public.angelcare360_operator_usage_limits u
using angelcare360_demo_cleanup_keys k
where u.client_id = k.client_id
  and u.tenant_id = k.tenant_id;

delete from public.angelcare360_operator_dunning_actions d
using angelcare360_demo_cleanup_keys k
where d.client_id = k.client_id;

delete from public.angelcare360_operator_payments p
using angelcare360_demo_cleanup_keys k
where p.client_id = k.client_id
  and p.payment_reference in ('PAY-AC360-DEMO-0001', 'PAY-AC360-DEMO-0002');

delete from public.angelcare360_operator_invoices i
using angelcare360_demo_cleanup_keys k
where i.client_id = k.client_id
  and i.invoice_number in ('AC360-INV-DEMO-0001', 'AC360-INV-DEMO-0002', 'AC360-INV-DEMO-0003');

delete from public.angelcare360_operator_billing_accounts b
using angelcare360_demo_cleanup_keys k
where b.client_id = k.client_id;

delete from public.angelcare360_operator_onboarding_tasks o
using angelcare360_demo_cleanup_keys k
where o.client_id = k.client_id;

delete from public.angelcare360_operator_support_tickets t
using angelcare360_demo_cleanup_keys k
where t.client_id = k.client_id;

delete from public.angelcare360_operator_contracts c
using angelcare360_demo_cleanup_keys k
where c.client_id = k.client_id
  and c.contract_code = 'CTR-AC360-DEMO-PE-CASA-001';

delete from public.angelcare360_operator_renewals r
using angelcare360_demo_cleanup_keys k
where r.client_id = k.client_id;

delete from public.angelcare360_operator_service_requests s
using angelcare360_demo_cleanup_keys k
where s.client_id = k.client_id;

delete from public.angelcare360_operator_incidents i
using angelcare360_demo_cleanup_keys k
where i.client_id = k.client_id;

delete from public.angelcare360_operator_tasks t
using angelcare360_demo_cleanup_keys k
where t.client_id = k.client_id;

delete from public.angelcare360_operator_notes n
using angelcare360_demo_cleanup_keys k
where n.client_id = k.client_id;

delete from public.angelcare360_operator_service_events e
using angelcare360_demo_cleanup_keys k
where e.client_id = k.client_id;

delete from public.angelcare360_operator_subscriptions s
using angelcare360_demo_cleanup_keys k
where s.client_id = k.client_id
  and s.subscription_code = 'SUB-AC360-DEMO-PE-CASA-001';

delete from public.angelcare360_operator_tenants t
using angelcare360_demo_cleanup_keys k
where t.client_id = k.client_id
  and t.tenant_slug = 'petits-explorateurs-casa-demo';

delete from public.angelcare360_operator_clients c
using angelcare360_demo_cleanup_keys k
where c.client_code = 'AC360-DEMO-PE-CASA';

-- Retain public.angelcare360_operator_plans and public.angelcare360_operator_packages.
-- They are generic AC360 catalog rows (AC360-START / AC360-GROWTH / AC360-SIGNATURE, PACK-*) and are not demo-specific.

-- ---------------------------------------------------------------------------
-- School core cleanup
-- ---------------------------------------------------------------------------

delete from public.angelcare360_report_exports re
using angelcare360_demo_cleanup_keys k
where re.school_id = k.school_id;

delete from public.angelcare360_export_files ef
using angelcare360_demo_cleanup_keys k
where ef.school_id = k.school_id;

delete from public.angelcare360_report_requests rr
using angelcare360_demo_cleanup_keys k
where rr.school_id = k.school_id;

delete from public.angelcare360_report_templates rt
using angelcare360_demo_cleanup_keys k
where rt.school_id = k.school_id;

delete from public.angelcare360_reports rp
using angelcare360_demo_cleanup_keys k
where rp.school_id = k.school_id;

delete from public.angelcare360_document_templates dt
using angelcare360_demo_cleanup_keys k
where dt.school_id = k.school_id;

delete from public.angelcare360_announcements an
using angelcare360_demo_cleanup_keys k
where an.school_id = k.school_id;

delete from public.angelcare360_notifications nt
using angelcare360_demo_cleanup_keys k
where nt.school_id = k.school_id;

delete from public.angelcare360_message_recipients mr
using angelcare360_demo_cleanup_keys k
where mr.school_id = k.school_id;

delete from public.angelcare360_messages msg
using angelcare360_demo_cleanup_keys k
where msg.school_id = k.school_id;

delete from public.angelcare360_conversation_participants cp
using angelcare360_demo_cleanup_keys k
where cp.school_id = k.school_id;

delete from public.angelcare360_conversations cv
using angelcare360_demo_cleanup_keys k
where cv.school_id = k.school_id;

delete from public.angelcare360_reclamations rec
using angelcare360_demo_cleanup_keys k
where rec.school_id = k.school_id;

delete from public.angelcare360_payment_reminders pr
using angelcare360_demo_cleanup_keys k
where pr.school_id = k.school_id;

delete from public.angelcare360_receipts rc
using angelcare360_demo_cleanup_keys k
where rc.school_id = k.school_id;

delete from public.angelcare360_payments pay
using angelcare360_demo_cleanup_keys k
where pay.school_id = k.school_id;

delete from public.angelcare360_invoice_lines il
using angelcare360_demo_cleanup_keys k
where il.school_id = k.school_id;

delete from public.angelcare360_invoices inv
using angelcare360_demo_cleanup_keys k
where inv.school_id = k.school_id;

delete from public.angelcare360_student_fee_assignments sfa
using angelcare360_demo_cleanup_keys k
where sfa.school_id = k.school_id;

delete from public.angelcare360_fee_items fi
using angelcare360_demo_cleanup_keys k
where fi.school_id = k.school_id;

delete from public.angelcare360_fee_structures fs
using angelcare360_demo_cleanup_keys k
where fs.school_id = k.school_id;

delete from public.angelcare360_report_card_lines rcl
using angelcare360_demo_cleanup_keys k
where rcl.school_id = k.school_id;

delete from public.angelcare360_teacher_comments tc
using angelcare360_demo_cleanup_keys k
where tc.school_id = k.school_id;

delete from public.angelcare360_report_cards rcards
using angelcare360_demo_cleanup_keys k
where rcards.school_id = k.school_id;

delete from public.angelcare360_marks mk
using angelcare360_demo_cleanup_keys k
where mk.school_id = k.school_id;

delete from public.angelcare360_exam_sessions exs
using angelcare360_demo_cleanup_keys k
where exs.school_id = k.school_id;

delete from public.angelcare360_exams ex
using angelcare360_demo_cleanup_keys k
where ex.school_id = k.school_id;

delete from public.angelcare360_assignments asg
using angelcare360_demo_cleanup_keys k
where asg.school_id = k.school_id;

delete from public.angelcare360_lessons les
using angelcare360_demo_cleanup_keys k
where les.school_id = k.school_id;

delete from public.angelcare360_timetable_slots ts
using angelcare360_demo_cleanup_keys k
where ts.school_id = k.school_id;

delete from public.angelcare360_attendance_justifications aj
using angelcare360_demo_cleanup_keys k
where aj.school_id = k.school_id;

delete from public.angelcare360_attendance_records ar
using angelcare360_demo_cleanup_keys k
where ar.school_id = k.school_id;

delete from public.angelcare360_attendance_sessions ats
using angelcare360_demo_cleanup_keys k
where ats.school_id = k.school_id;

delete from public.angelcare360_admission_document_submissions ads
using angelcare360_demo_cleanup_keys k
where ads.school_id = k.school_id;

delete from public.angelcare360_admission_applications aa
using angelcare360_demo_cleanup_keys k
where aa.school_id = k.school_id;

delete from public.angelcare360_documents doc
using angelcare360_demo_cleanup_keys k
where doc.school_id = k.school_id;

delete from public.angelcare360_admission_leads al
using angelcare360_demo_cleanup_keys k
where al.school_id = k.school_id;

delete from public.angelcare360_admission_required_documents ard
using angelcare360_demo_cleanup_keys k
where ard.school_id = k.school_id;

delete from public.angelcare360_staff_assignments sa
using angelcare360_demo_cleanup_keys k
where sa.school_id = k.school_id;

delete from public.angelcare360_class_subjects cs
using angelcare360_demo_cleanup_keys k
where cs.school_id = k.school_id;

delete from public.angelcare360_emergency_contacts ec
using angelcare360_demo_cleanup_keys k
where ec.school_id = k.school_id;

delete from public.angelcare360_student_parent_links spl
using angelcare360_demo_cleanup_keys k
where spl.school_id = k.school_id;

delete from public.angelcare360_transport_assignments ta
using angelcare360_demo_cleanup_keys k
where ta.school_id = k.school_id;

delete from public.angelcare360_transport_vehicles tv
using angelcare360_demo_cleanup_keys k
where tv.school_id = k.school_id;

delete from public.angelcare360_transport_stops ts
using angelcare360_demo_cleanup_keys k
where ts.school_id = k.school_id;

delete from public.angelcare360_transport_routes tr
using angelcare360_demo_cleanup_keys k
where tr.school_id = k.school_id;

delete from public.angelcare360_library_loans ll
using angelcare360_demo_cleanup_keys k
where ll.school_id = k.school_id;

delete from public.angelcare360_library_copies lc
using angelcare360_demo_cleanup_keys k
where lc.school_id = k.school_id;

delete from public.angelcare360_library_books lb
using angelcare360_demo_cleanup_keys k
where lb.school_id = k.school_id;

delete from public.angelcare360_inventory_movements im
using angelcare360_demo_cleanup_keys k
where im.school_id = k.school_id;

delete from public.angelcare360_inventory_items ii
using angelcare360_demo_cleanup_keys k
where ii.school_id = k.school_id;

delete from public.angelcare360_inventory_categories ic
using angelcare360_demo_cleanup_keys k
where ic.school_id = k.school_id;

delete from public.angelcare360_expenses exps
using angelcare360_demo_cleanup_keys k
where exps.school_id = k.school_id;

delete from public.angelcare360_finance_accounts fa
using angelcare360_demo_cleanup_keys k
where fa.school_id = k.school_id;

delete from public.angelcare360_students stu
using angelcare360_demo_cleanup_keys k
where stu.school_id = k.school_id;

delete from public.angelcare360_parents par
using angelcare360_demo_cleanup_keys k
where par.school_id = k.school_id;

delete from public.angelcare360_staff st
using angelcare360_demo_cleanup_keys k
where st.school_id = k.school_id;

delete from public.angelcare360_subjects sub
using angelcare360_demo_cleanup_keys k
where sub.school_id = k.school_id;

delete from public.angelcare360_sections sec
using angelcare360_demo_cleanup_keys k
where sec.school_id = k.school_id;

delete from public.angelcare360_classes cls
using angelcare360_demo_cleanup_keys k
where cls.school_id = k.school_id;

delete from public.angelcare360_terms t
using angelcare360_demo_cleanup_keys k
where t.school_id = k.school_id;

delete from public.angelcare360_academic_years ay
using angelcare360_demo_cleanup_keys k
where ay.school_id = k.school_id;

delete from public.angelcare360_school_settings ss
using angelcare360_demo_cleanup_keys k
where ss.school_id = k.school_id;

delete from public.angelcare360_schools s
using angelcare360_demo_cleanup_keys k
where s.id = k.school_id
  and s.school_code = 'AC360-DEMO-PE-CASA-SCHOOL';

-- ---------------------------------------------------------------------------
-- Final verification
-- ---------------------------------------------------------------------------

select 'operator_clients' as check_name, count(*) as remaining
from public.angelcare360_operator_clients
where client_code = 'AC360-DEMO-PE-CASA';

select 'operator_payment_gates' as check_name, count(*) as remaining
from public.angelcare360_operator_payment_gates
where gate_code = 'AC360-GATE-DEMO-PE-CASA-0001';

select 'schools' as check_name, count(*) as remaining
from public.angelcare360_schools
where school_code = 'AC360-DEMO-PE-CASA-SCHOOL';

select 'documents' as check_name, count(*) as remaining
from public.angelcare360_documents
where school_id = (select school_id from angelcare360_demo_cleanup_keys);

select 'reports' as check_name, count(*) as remaining
from public.angelcare360_reports
where school_id = (select school_id from angelcare360_demo_cleanup_keys);

commit;
