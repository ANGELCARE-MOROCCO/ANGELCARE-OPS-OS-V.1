import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { loadDestructionCertificate } from "@/lib/opsos/storage-destruction"

export const dynamic = "force-dynamic"
function csv(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"` }
function bytes(value: number) { const units = ["B", "KB", "MB", "GB", "TB"]; let n = Number(value || 0); let i = 0; while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1 } return `${n.toFixed(i >= 3 ? 1 : 0)} ${units[i]}` }

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { requestId } = await params
  const certificate = await loadDestructionCertificate(requestId).catch(() => null)
  if (!certificate) return NextResponse.json({ ok: false, error: "Destruction certificate not found" }, { status: 404 })
  const url = new URL(request.url)
  const format = url.searchParams.get("format") || "json"
  if (format === "csv") {
    const headers = ["certificate_number","request_number","quarantine_case_id","original_name","original_size_bytes","original_sha256","source_id","mailbox_id","scope","requester","approvers","executed_by","executed_at","verification_result","actual_recovered_bytes"]
    const values = [certificate.certificateNumber, certificate.requestNumber, certificate.quarantineCaseId, certificate.originalName, certificate.originalSizeBytes, certificate.originalSha256, certificate.sourceId, certificate.mailboxId, certificate.scope, certificate.requester, certificate.approvers.join(" | "), certificate.executedBy, certificate.executedAt, certificate.verificationResult, certificate.actualRecoveredBytes]
    return new Response(`${headers.join(",")}\n${values.map(csv).join(",")}\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${certificate.certificateNumber}.csv"` } })
  }
  if (format === "pdf") {
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89])
    const regular = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(0.97, 0.985, 1) })
    page.drawText("ANGELCARE OPSOS", { x: 46, y: 782, size: 12, font: bold, color: rgb(0.1, 0.25, 0.5) })
    page.drawText("CERTIFICAT DE DESTRUCTION CONTROLEE", { x: 46, y: 744, size: 20, font: bold, color: rgb(0.05, 0.09, 0.16) })
    page.drawText(certificate.certificateNumber, { x: 46, y: 720, size: 11, font: regular, color: rgb(0.35, 0.42, 0.52) })
    const rows: Array<[string,string]> = [
      ["Demande", certificate.requestNumber], ["Dossier de quarantaine", certificate.quarantineCaseId], ["Objet original", certificate.originalName],
      ["Taille originale", bytes(certificate.originalSizeBytes)], ["SHA-256 original", certificate.originalSha256 || "Non disponible"],
      ["Source", certificate.sourceId], ["Mailbox", certificate.mailboxId || "Non applicable"], ["Périmètre", certificate.scope],
      ["Demandeur", certificate.requester], ["Approbateurs", certificate.approvers.join(", ") || "Aucun"], ["Exécuté par", certificate.executedBy],
      ["Date d’exécution", new Date(certificate.executedAt).toLocaleString("fr-FR")], ["Vérification", certificate.verificationResult],
      ["Espace récupéré", bytes(certificate.actualRecoveredBytes)],
    ]
    let y = 670
    for (const [label, value] of rows) {
      page.drawText(label, { x: 46, y, size: 9, font: bold, color: rgb(0.32, 0.38, 0.47) })
      const printable = value.length > 85 ? `${value.slice(0, 82)}...` : value
      page.drawText(printable, { x: 190, y, size: 9, font: regular, color: rgb(0.08, 0.12, 0.18) })
      y -= 32
    }
    page.drawText("Ce certificat conserve uniquement la preuve de destruction. Le contenu détruit n’est pas intégré au certificat.", { x: 46, y: 110, size: 9, font: regular, color: rgb(0.35, 0.42, 0.52), maxWidth: 500 })
    page.drawText("ANGELCARE · OPSOS STORAGE GOVERNANCE", { x: 46, y: 60, size: 9, font: bold, color: rgb(0.1, 0.25, 0.5) })
    const bytesOut = await pdf.save()
    return new Response(Buffer.from(bytesOut), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`, "cache-control": "no-store" } })
  }
  return NextResponse.json({ ok: true, data: certificate }, { headers: { "cache-control": "no-store" } })
}
