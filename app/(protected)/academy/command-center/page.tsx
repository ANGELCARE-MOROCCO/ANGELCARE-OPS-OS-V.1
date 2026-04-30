import AppShell, { PageAction } from '@/app/components/erp/AppShell';
import { requireAccess } from '@/lib/auth/requireAccess';
import { createClient } from '@/lib/supabase/server';
import { buildAcademyExceptions } from '../_lib/exceptionEngine';
import { buildManagerCommands } from '../_lib/commandEngine';
import { ExceptionPanel, CommandPanel, ControlKpi } from '../_components/ControlPanels';

export default async function AcademyCommandCenterPage() {
  await requireAccess('academy.view');
  const supabase = await createClient();

  const [traineesRes, paymentsRes, attendanceRes, groupsRes, certificatesRes, enrollmentsRes] = await Promise.all([
    supabase.from('academy_trainees').select('*').order('created_at', { ascending: false }),
    supabase.from('academy_payments').select('*').order('created_at', { ascending: false }),
    supabase.from('academy_attendance').select('*').order('created_at', { ascending: false }),
    supabase.from('academy_groups').select('*').order('created_at', { ascending: false }),
    supabase.from('academy_certificates').select('*').order('created_at', { ascending: false }),
    supabase.from('academy_enrollments').select('*').order('created_at', { ascending: false }),
  ]);

  const trainees = traineesRes.data || [];
  const payments = paymentsRes.data || [];
  const attendance = attendanceRes.data || [];
  const groups = groupsRes.data || [];
  const certificates = certificatesRes.data || [];
  const enrollments = enrollmentsRes.data || [];
  const exceptions = buildAcademyExceptions({ trainees, payments, attendance, groups, certificates, enrollments });
  const commands = buildManagerCommands(exceptions, { trainees, payments, groups });
  const unpaid = payments.filter((p: any) => p.status !== 'paid').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <AppShell
      title="Academy Command Center"
      subtitle="Phase 2 control layer: exceptions, priorities, transitions and manager execution guidance."
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Command Center' }]}
      actions={<><PageAction href="/academy">Academy Home</PageAction><PageAction href="/academy/trainees" variant="light">Trainees</PageAction></>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          <ControlKpi label="Active Trainees" value={trainees.length} href="/academy/trainees" />
          <ControlKpi label="Exceptions" value={exceptions.length} tone="#ef4444" />
          <ControlKpi label="Unpaid Value" value={`${unpaid.toLocaleString('fr-FR')} MAD`} tone="#f97316" href="/academy/payments" />
          <ControlKpi label="Certificates" value={certificates.length} tone="#22c55e" href="/academy/certificates" />
        </section>
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          <CommandPanel commands={commands} />
          <ExceptionPanel exceptions={exceptions} />
        </section>
      </div>
    </AppShell>
  );
}
