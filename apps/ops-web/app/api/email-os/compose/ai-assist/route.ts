import { NextResponse } from "next/server"

function improveFrenchMessage(body: string) {
  const clean = String(body || "").trim()

  if (!clean) {
    return `Bonjour,

Merci d’indiquer ici le contexte précis de votre message.

Nous vous invitons à remplacer les éléments entre crochets afin de finaliser l’envoi.

Cordialement,
AngelCare`
  }

  return `Bonjour,

${clean}

Afin d’assurer un traitement rapide et structuré, merci de confirmer les éléments nécessaires et les prochaines étapes attendues.

Cordialement,
AngelCare`
}

function makeSummary(body: string) {
  const clean = String(body || "").trim()

  if (!clean) return "Aucun contenu à résumer."

  return clean.length > 220
    ? `${clean.slice(0, 220)}...`
    : clean
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action || "improve"

    if (action === "subject") {
      return NextResponse.json({
        ok: true,
        data: {
          subject: body.subject || "Suivi opérationnel — action requise"
        }
      })
    }

    if (action === "summary") {
      return NextResponse.json({
        ok: true,
        data: {
          summary: makeSummary(body.body)
        }
      })
    }

    return NextResponse.json({
      ok: true,
      data: {
        body: improveFrenchMessage(body.body)
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "AI assist failed"
      },
      { status: 500 }
    )
  }
}
