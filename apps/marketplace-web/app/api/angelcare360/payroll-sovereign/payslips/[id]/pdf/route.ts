import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { Buffer } from 'node:buffer'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { NextRequest, NextResponse } from 'next/server'
import {
  Angelcare360AccessError,
  getAngelcare360AccessContext,
  requireAngelcare360Permission,
} from '@/lib/angelcare360/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Row = Record<string, any>

function text(value: unknown, fallback = '') {
  const result = String(value ?? '').trim()
  return result || fallback
}

function amount(minor: unknown) {
  const value = Number(minor || 0)
  const major = Number.isFinite(value) ? value / 100 : 0
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major)} Dh`
}

function safeFilePart(value: unknown) {
  return text(value, 'bulletin').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
}

function drawLine(
  page: any,
  font: any,
  label: string,
  value: string,
  y: number,
  boldFont: any,
) {
  page.drawText(label, { x: 54, y, size: 10, font, color: rgb(0.25, 0.3, 0.38) })
  page.drawText(value, { x: 250, y, size: 10, font: boldFont, color: rgb(0.05, 0.12, 0.24) })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const context = await getAngelcare360AccessContext()

    if (!context?.school) {
      return NextResponse.json({ ok: false, error: 'Aucun établissement actif.' }, { status: 403 })
    }

    await requireAngelcare360Permission('paie.view', { context })

    const db = await createClient()
    const requestedVersion = Number(request.nextUrl.searchParams.get('version') || 0)

    const { data: result, error: resultError } = await db
      .from('angelcare360_payroll_employee_results')
      .select('*')
      .eq('school_id', context.school.id)
      .eq('id', id)
      .single()

    if (resultError || !result) {
      return NextResponse.json({ ok: false, error: 'Résultat de paie introuvable.' }, { status: 404 })
    }

    let payslipQuery = db
      .from('angelcare360_payroll_payslip_versions')
      .select('*')
      .eq('school_id', context.school.id)
      .eq('payroll_employee_result_id', id)

    if (requestedVersion > 0) {
      payslipQuery = payslipQuery.eq('version_number', requestedVersion)
    }

    const { data: payslips, error: payslipError } = await payslipQuery
      .order('version_number', { ascending: false })
      .limit(1)

    if (payslipError || !payslips?.length) {
      return NextResponse.json({ ok: false, error: 'Version du bulletin introuvable.' }, { status: 404 })
    }

    const payslip = payslips[0] as Row
    const payroll = result as Row

    const [{ data: staff }, { data: period }] = await Promise.all([
      db
        .from('angelcare360_staff')
        .select('id,full_name,staff_code,email,position')
        .eq('school_id', context.school.id)
        .eq('id', payroll.staff_id)
        .maybeSingle(),
      db
        .from('angelcare360_payroll_periods')
        .select('id,label,period_code,start_date,end_date,payment_date')
        .eq('school_id', context.school.id)
        .eq('id', payroll.payroll_period_id)
        .maybeSingle(),
    ])

    const pdf = await PDFDocument.create()
    const regular = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const page = pdf.addPage([595.28, 841.89])

    page.drawText('ANGELCARE 360 · BULLETIN DE PAIE', {
      x: 54,
      y: 780,
      size: 16,
      font: bold,
      color: rgb(0.04, 0.19, 0.42),
    })

    page.drawText(text(context.school.name, 'Établissement'), {
      x: 54,
      y: 753,
      size: 11,
      font: regular,
      color: rgb(0.2, 0.25, 0.32),
    })

    page.drawText(text(payslip.version_code, `PAYSLIP-${id.slice(0, 8)}`), {
      x: 380,
      y: 780,
      size: 9,
      font: bold,
      color: rgb(0.36, 0.4, 0.46),
    })

    page.drawLine({
      start: { x: 54, y: 730 },
      end: { x: 541, y: 730 },
      thickness: 1,
      color: rgb(0.84, 0.87, 0.91),
    })

    drawLine(page, regular, 'Employé', text((staff as Row | null)?.full_name, text(payroll.staff_id)), 690, bold)
    drawLine(page, regular, 'Matricule', text((staff as Row | null)?.staff_code, '—'), 670, bold)
    drawLine(page, regular, 'Période', text((period as Row | null)?.label, text((period as Row | null)?.period_code, '—')), 650, bold)
    drawLine(page, regular, 'Version', String(payslip.version_number || 1), 630, bold)
    drawLine(page, regular, 'Statut', text(payslip.status, 'generated'), 610, bold)

    page.drawText('Rémunération', {
      x: 54,
      y: 565,
      size: 12,
      font: bold,
      color: rgb(0.04, 0.19, 0.42),
    })

    const rows: Array<[string, string]> = [
      ['Salaire de base', amount(payroll.base_minor)],
      ['Gains / primes', amount(payroll.earnings_minor)],
      ['Brut', amount(payroll.gross_minor)],
      ['Cotisations employé', amount(payroll.employee_contributions_minor)],
      ['Retenues', amount(payroll.deductions_minor)],
      ['Remboursements', amount(payroll.reimbursements_minor)],
      ['NET À PAYER', amount(payroll.net_payable_minor)],
    ]

    let y = 530
    for (const [label, value] of rows) {
      const isNet = label === 'NET À PAYER'
      page.drawText(label, {
        x: 70,
        y,
        size: isNet ? 12 : 10,
        font: isNet ? bold : regular,
        color: isNet ? rgb(0.02, 0.38, 0.23) : rgb(0.25, 0.3, 0.38),
      })
      page.drawText(value, {
        x: 390,
        y,
        size: isNet ? 12 : 10,
        font: bold,
        color: isNet ? rgb(0.02, 0.38, 0.23) : rgb(0.05, 0.12, 0.24),
      })
      y -= isNet ? 38 : 28
    }

    page.drawLine({
      start: { x: 54, y: 265 },
      end: { x: 541, y: 265 },
      thickness: 1,
      color: rgb(0.84, 0.87, 0.91),
    })

    page.drawText(
      `Document généré depuis les résultats de paie immuables · Signature source ${text(payslip.source_signature, 'n/a').slice(0, 24)}`,
      {
        x: 54,
        y: 235,
        size: 8,
        font: regular,
        color: rgb(0.38, 0.42, 0.48),
      },
    )

    const bytes = await pdf.save()
    const filename = `${safeFilePart(payslip.version_code)}.pdf`

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${filename}"`,
        'cache-control': 'private, no-store, max-age=0',
      },
    })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        ok: false,
        error: publicAngelcare360Error(error),
      },
      { status: 500 },
    )
  }
}
