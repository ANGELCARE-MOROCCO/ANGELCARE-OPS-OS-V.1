export type AnyRow = Record<string, any>

export type PaymentWorkspaceMode = 'home' | 'payments' | 'refunds' | 'invoices'

export type MetricPoint = { label: string; value: number }
export type MetricSlice = { label: string; value: number; amount: number; percent: number }
export type PaymentMetricRow = {
  id: string
  reference: string
  traineeId: string
  traineeName: string
  traineeEmail: string
  courseName: string
  groupName: string
  locationName: string
  amount: number
  method: string
  status: string
  date: string
  raw: AnyRow
}
export type RefundMetricRow = PaymentMetricRow & {
  refundId: string
  refundReason: string
  requestedAt: string
  processedAt: string
  processingDays: number
}
export type InvoiceMetricRow = {
  id: string
  invoiceNumber: string
  traineeName: string
  courseName: string
  amount: number
  status: string
  dueDate: string
  issuedAt: string
  raw: AnyRow
}

export type AcademyPaymentsMetrics = {
  kpis: {
    totalPayments: number
    totalRevenue: number
    successfulPayments: number
    pendingPayments: number
    refundedPayments: number
    refundedAmount: number
    failedPayments: number
    successRate: number
    averageOrderValue: number
    pendingAmount: number
    invoiceTotal: number
    invoicePaid: number
    invoicePending: number
  }
  paymentRows: PaymentMetricRow[]
  refundRows: RefundMetricRow[]
  invoiceRows: InvoiceMetricRow[]
  paymentTrend: MetricPoint[]
  refundTrend: MetricPoint[]
  statusDistribution: MetricSlice[]
  methodDistribution: MetricSlice[]
  courseRevenue: MetricSlice[]
  locationRevenue: MetricSlice[]
  groupRevenue: MetricSlice[]
  revenueByCountry: MetricSlice[]
  refundsByReason: MetricSlice[]
  refundsByCourse: MetricSlice[]
  invoiceStatus: MetricSlice[]
  generatedAt: string
}

function s(v: unknown, fallback = ''): string {
  const out = String(v ?? '').trim()
  return out || fallback
}
function n(v: unknown): number {
  const out = Number(v ?? 0)
  return Number.isFinite(out) ? out : 0
}
function id(v: unknown): string { return String(v ?? '') }
function lower(v: unknown): string { return s(v).toLowerCase() }
function amount(row: AnyRow): number { return n(row.amount ?? row.amount_mad ?? row.paid_amount ?? row.total_amount ?? row.refund_amount) }
function firstDate(row: AnyRow): string { return s(row.paid_at ?? row.processed_at ?? row.created_at ?? row.requested_at ?? row.issued_at ?? row.date, new Date().toISOString()) }
function dateKey(v: unknown): string {
  const d = new Date(s(v, new Date().toISOString()))
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}
function dayLabel(key: string): string {
  const d = new Date(`${key}T00:00:00`)
  if (Number.isNaN(d.getTime())) return key
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function byId(rows: AnyRow[], rowId: unknown): AnyRow | undefined {
  return rows.find((r) => id(r.id) === id(rowId))
}
function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0
}
function canonicalStatus(row: AnyRow): string {
  const x = lower(row.status ?? row.payment_status ?? row.state)
  if (x.includes('refund')) return 'refunded'
  if (x.includes('fail') || x.includes('denied') || x.includes('cancel')) return 'failed'
  if (x.includes('pend') || x.includes('due') || x.includes('partial')) return 'pending'
  if (x.includes('paid') || x.includes('success') || x.includes('complete') || x.includes('valid')) return 'completed'
  return x || 'pending'
}
function method(row: AnyRow): string {
  const x = s(row.method ?? row.payment_method ?? row.channel, 'Cash')
  if (x.toLowerCase().includes('bank')) return 'Bank Transfer'
  if (x.toLowerCase().includes('card') || x.toLowerCase().includes('visa') || x.toLowerCase().includes('master')) return 'Credit / Debit Card'
  if (x.toLowerCase().includes('cmi')) return 'CMI'
  if (x.toLowerCase().includes('wafa')) return 'Wafacash'
  if (x.toLowerCase().includes('cash')) return 'Cash'
  return x
}
function courseFor(payment: AnyRow, enrollments: AnyRow[], courses: AnyRow[]): AnyRow | undefined {
  const enrollment = byId(enrollments, payment.enrollment_id)
  return byId(courses, payment.course_id ?? enrollment?.course_id)
}
function groupFor(payment: AnyRow, enrollments: AnyRow[], groups: AnyRow[]): AnyRow | undefined {
  const enrollment = byId(enrollments, payment.enrollment_id)
  return byId(groups, payment.group_id ?? enrollment?.group_id)
}
function locationFor(payment: AnyRow, enrollments: AnyRow[], groups: AnyRow[], locations: AnyRow[]): AnyRow | undefined {
  const group = groupFor(payment, enrollments, groups)
  const enrollment = byId(enrollments, payment.enrollment_id)
  return byId(locations, payment.location_id ?? enrollment?.location_id ?? group?.location_id)
}
function traineeFor(payment: AnyRow, trainees: AnyRow[]): AnyRow | undefined {
  return byId(trainees, payment.trainee_id)
}
function nameOf(row: AnyRow | undefined, fallback: string): string {
  return s(row?.full_name ?? row?.name ?? row?.title ?? row?.label, fallback)
}
function emailOf(row: AnyRow | undefined): string {
  return s(row?.email ?? row?.contact_email ?? row?.trainee_email, '')
}
function groupTotals<T extends PaymentMetricRow>(rows: T[], getLabel: (row: T) => string): MetricSlice[] {
  const map = new Map<string, { value: number; amount: number }>()
  rows.forEach((row) => {
    const label = getLabel(row) || 'Unassigned'
    const current = map.get(label) || { value: 0, amount: 0 }
    current.value += 1
    current.amount += row.amount
    map.set(label, current)
  })
  const total = Array.from(map.values()).reduce((sum, item) => sum + item.amount, 0)
  return Array.from(map.entries()).map(([label, item]) => ({ label, value: item.value, amount: item.amount, percent: pct(item.amount, total) })).sort((a, b) => b.amount - a.amount)
}
function statusTotals(rows: PaymentMetricRow[]): MetricSlice[] {
  const map = new Map<string, { value: number; amount: number }>()
  rows.forEach((row) => {
    const label = row.status
    const current = map.get(label) || { value: 0, amount: 0 }
    current.value += 1
    current.amount += row.amount
    map.set(label, current)
  })
  const total = rows.length
  return Array.from(map.entries()).map(([label, item]) => ({ label, value: item.value, amount: item.amount, percent: pct(item.value, total) })).sort((a, b) => b.value - a.value)
}
function timeSeries(rows: { date: string; amount: number }[], days = 14): MetricPoint[] {
  const today = new Date()
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  const map = new Map(keys.map((key) => [key, 0]))
  rows.forEach((row) => {
    const key = dateKey(row.date)
    if (map.has(key)) map.set(key, (map.get(key) || 0) + row.amount)
  })
  return keys.map((key) => ({ label: dayLabel(key), value: Math.round((map.get(key) || 0) * 100) / 100 }))
}
function refundRowsFromPayments(payments: PaymentMetricRow[], refunds: AnyRow[], trainees: AnyRow[], enrollments: AnyRow[], courses: AnyRow[], groups: AnyRow[], locations: AnyRow[]): RefundMetricRow[] {
  const explicit = refunds.map((r) => {
    const payment = payments.find((p) => id(p.raw.id) === id(r.payment_id))
    const fake: AnyRow = payment?.raw || r
    const trainee = traineeFor(fake, trainees)
    const course = courseFor(fake, enrollments, courses)
    const group = groupFor(fake, enrollments, groups)
    const location = locationFor(fake, enrollments, groups, locations)
    const requestedAt = s(r.requested_at ?? r.created_at ?? fake.created_at, firstDate(fake))
    const processedAt = s(r.processed_at ?? r.updated_at ?? requestedAt)
    const days = Math.max(0, Math.round((new Date(processedAt).getTime() - new Date(requestedAt).getTime()) / 86400000))
    return {
      id: id(fake.id ?? r.id),
      refundId: id(r.id),
      reference: s(r.reference ?? payment?.reference ?? `REF-${id(r.id).slice(0, 8)}`),
      traineeId: id(fake.trainee_id),
      traineeName: payment?.traineeName || nameOf(trainee, s(r.trainee_name, 'Academy Trainee')),
      traineeEmail: payment?.traineeEmail || emailOf(trainee),
      courseName: payment?.courseName || nameOf(course, s(r.course_title, 'Course Enrollment')),
      groupName: payment?.groupName || nameOf(group, 'No group'),
      locationName: payment?.locationName || nameOf(location, 'Morocco'),
      amount: amount(r) || payment?.amount || 0,
      method: s(r.method ?? r.payment_method ?? payment?.method, 'Cash'),
      status: canonicalStatus(r) === 'pending' ? 'pending' : s(r.status, 'approved').toLowerCase(),
      date: requestedAt,
      raw: r,
      refundReason: s(r.reason ?? r.refund_reason, 'Manager refund'),
      requestedAt,
      processedAt,
      processingDays: days,
    }
  })
  const paymentRefunds = payments.filter((p) => p.status === 'refunded' && !explicit.some((r) => id(r.id) === id(p.id))).map((p) => ({ ...p, refundId: p.id, refundReason: s(p.raw.refund_reason, 'Payment refunded'), requestedAt: p.date, processedAt: s(p.raw.updated_at ?? p.raw.paid_at ?? p.date), processingDays: 0 }))
  return [...explicit, ...paymentRefunds].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
}
function invoiceRows(invoices: AnyRow[], payments: PaymentMetricRow[], trainees: AnyRow[], enrollments: AnyRow[], courses: AnyRow[]): InvoiceMetricRow[] {
  if (invoices.length) {
    return invoices.map((inv) => {
      const t = byId(trainees, inv.trainee_id)
      const e = byId(enrollments, inv.enrollment_id)
      const c = byId(courses, inv.course_id ?? e?.course_id)
      return {
        id: id(inv.id),
        invoiceNumber: s(inv.invoice_number ?? inv.reference, `INV-${id(inv.id).slice(0, 8)}`),
        traineeName: nameOf(t, s(inv.trainee_name, 'Academy Trainee')),
        courseName: nameOf(c, s(inv.course_title, 'Course Enrollment')),
        amount: amount(inv),
        status: s(inv.status, 'pending').toLowerCase(),
        dueDate: s(inv.due_date ?? inv.created_at, ''),
        issuedAt: s(inv.issued_at ?? inv.created_at, ''),
        raw: inv,
      }
    }).sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
  }
  return payments.map((p) => ({ id: p.id, invoiceNumber: `INV-${p.reference.replace(/[^0-9A-Za-z]/g, '').slice(-8) || p.id.slice(0, 8)}`, traineeName: p.traineeName, courseName: p.courseName, amount: p.amount, status: p.status === 'completed' ? 'paid' : p.status, dueDate: p.date, issuedAt: p.date, raw: p.raw }))
}

export function buildAcademyPaymentsMetrics(input: {
  payments: AnyRow[]
  refunds?: AnyRow[]
  invoices?: AnyRow[]
  enrollments?: AnyRow[]
  trainees?: AnyRow[]
  courses?: AnyRow[]
  groups?: AnyRow[]
  locations?: AnyRow[]
}): AcademyPaymentsMetrics {
  const paymentsRaw = input.payments || []
  const trainees = input.trainees || []
  const enrollments = input.enrollments || []
  const courses = input.courses || []
  const groups = input.groups || []
  const locations = input.locations || []

  const paymentRows: PaymentMetricRow[] = paymentsRaw.map((p) => {
    const trainee = traineeFor(p, trainees)
    const course = courseFor(p, enrollments, courses)
    const group = groupFor(p, enrollments, groups)
    const location = locationFor(p, enrollments, groups, locations)
    return {
      id: id(p.id),
      reference: s(p.reference ?? p.transaction_id, `TRX-${id(p.id).slice(0, 8)}`),
      traineeId: id(p.trainee_id),
      traineeName: nameOf(trainee, s(p.trainee_name, 'Academy Trainee')),
      traineeEmail: emailOf(trainee),
      courseName: nameOf(course, s(p.course_title, 'Course Enrollment')),
      groupName: nameOf(group, s(p.group_name, 'No group')),
      locationName: nameOf(location, s(p.location_name, 'Morocco')),
      amount: amount(p),
      method: method(p),
      status: canonicalStatus(p),
      date: firstDate(p),
      raw: p,
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const completed = paymentRows.filter((p) => p.status === 'completed')
  const pending = paymentRows.filter((p) => p.status === 'pending')
  const refunded = paymentRows.filter((p) => p.status === 'refunded')
  const failed = paymentRows.filter((p) => p.status === 'failed')
  const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0)

  const refunds = refundRowsFromPayments(paymentRows, input.refunds || [], trainees, enrollments, courses, groups, locations)
  const invoices = invoiceRows(input.invoices || [], paymentRows, trainees, enrollments, courses)
  const invoiceTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const invoicePaid = invoices.filter((inv) => ['paid', 'completed', 'validated'].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0)

  return {
    kpis: {
      totalPayments: paymentRows.length,
      totalRevenue,
      successfulPayments: completed.length,
      pendingPayments: pending.length,
      refundedPayments: refunds.length || refunded.length,
      refundedAmount: refunds.reduce((sum, r) => sum + r.amount, 0) || refunded.reduce((sum, p) => sum + p.amount, 0),
      failedPayments: failed.length,
      successRate: pct(completed.length, paymentRows.length),
      averageOrderValue: completed.length ? totalRevenue / completed.length : 0,
      pendingAmount,
      invoiceTotal,
      invoicePaid,
      invoicePending: invoices.filter((inv) => !['paid', 'completed', 'validated'].includes(inv.status)).length,
    },
    paymentRows,
    refundRows: refunds,
    invoiceRows: invoices,
    paymentTrend: timeSeries(completed.map((p) => ({ date: p.date, amount: p.amount })), 14),
    refundTrend: timeSeries(refunds.map((r) => ({ date: r.requestedAt, amount: r.amount })), 14),
    statusDistribution: statusTotals(paymentRows),
    methodDistribution: groupTotals(paymentRows, (row) => row.method),
    courseRevenue: groupTotals(paymentRows, (row) => row.courseName),
    locationRevenue: groupTotals(paymentRows, (row) => row.locationName),
    groupRevenue: groupTotals(paymentRows, (row) => row.groupName),
    revenueByCountry: [{ label: 'Morocco', value: completed.length, amount: totalRevenue, percent: totalRevenue ? 100 : 0 }],
    refundsByReason: groupTotals(refunds, (row) => row.refundReason),
    refundsByCourse: groupTotals(refunds, (row) => row.courseName),
    invoiceStatus: (() => {
      const total = invoices.length
      const map = new Map<string, { value: number; amount: number }>()
      invoices.forEach((inv) => {
        const cur = map.get(inv.status) || { value: 0, amount: 0 }
        cur.value += 1
        cur.amount += inv.amount
        map.set(inv.status, cur)
      })
      return Array.from(map.entries()).map(([label, item]) => ({ label, value: item.value, amount: item.amount, percent: pct(item.value, total) }))
    })(),
    generatedAt: new Date().toISOString(),
  }
}
