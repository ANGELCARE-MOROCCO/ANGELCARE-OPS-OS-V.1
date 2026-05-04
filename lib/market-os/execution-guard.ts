export type MarketOsSuspectButton = {
  text: string
  selector: string
  reason: string
}

export type MarketOsRuntimeAudit = {
  ok: boolean
  path: string
  checkedAt: string
  totalButtons: number
  suspectButtons: MarketOsSuspectButton[]
}

function selectorFor(element: Element) {
  const parts: string[] = []
  let current: Element | null = element
  while (current && parts.length < 4) {
    const tag = current.tagName.toLowerCase()
    const id = current.getAttribute("id")
    const action = current.getAttribute("data-market-action")
    if (id) {
      parts.unshift(`${tag}#${id}`)
      break
    }
    if (action) {
      parts.unshift(`${tag}[data-market-action=\"${action}\"]`)
      break
    }
    const cls = Array.from(current.classList || []).slice(0, 2).join(".")
    parts.unshift(cls ? `${tag}.${cls}` : tag)
    current = current.parentElement
  }
  return parts.join(" > ")
}

export function runMarketOsRuntimeAudit(doc: Document): MarketOsRuntimeAudit {
  const buttons = Array.from(doc.querySelectorAll("button, a, [role='button']"))
  const suspectButtons = buttons
    .filter((element) => {
      const hasAction = Boolean(element.getAttribute("data-market-action"))
      const hasHref = Boolean((element as HTMLAnchorElement).href || element.getAttribute("href"))
      const hasClickAttr = Boolean(element.getAttribute("onclick"))
      const disabled = Boolean((element as HTMLButtonElement).disabled || element.getAttribute("aria-disabled") === "true")
      const type = element.tagName.toLowerCase()
      const likelyStaticButton = type === "button" && !hasAction && !hasClickAttr && !disabled
      const brokenAnchor = type === "a" && !hasHref
      return likelyStaticButton || brokenAnchor
    })
    .map((element) => ({
      text: (element.textContent || "Untitled action").trim().slice(0, 90),
      selector: selectorFor(element),
      reason: element.tagName.toLowerCase() === "a" ? "Anchor has no href" : "Button has no data-market-action marker",
    }))

  return {
    ok: suspectButtons.length === 0,
    path: doc.defaultView?.location?.pathname || "unknown",
    checkedAt: new Date().toISOString(),
    totalButtons: buttons.length,
    suspectButtons,
  }
}

export async function reportMarketOsRuntimeAudit(audit: MarketOsRuntimeAudit) {
  const res = await fetch("/api/market-os/final-execution-audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(audit),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error || "Market-OS audit report failed")
  return json
}
