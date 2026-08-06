"use client"

const STYLE_ID = "ac-relationship-theatre-mz6-1-style"
const INSTALL_FLAG = "__acRelationshipTheatreMZ61Installed"
const QUEUE_KEY = "ac-whatsapp-live-queue-width"
const INTELLIGENCE_KEY = "ac-whatsapp-live-intelligence-width"
const LAYOUT_KEY = "ac-whatsapp-live-layout-version"
const LAYOUT_VERSION = "mz6.1"

declare global {
  interface Window {
    __acRelationshipTheatreMZ61Installed?: boolean
  }
}

type CommandDefinition = {
  title: string
  category: string
  icon: keyof typeof ICONS
}

const ICONS = {
  brief: '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="m16 16 2 2 3-3"/>',
  messages: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 8h8M8 12h6"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.6 2.1c-.9.5-1.4 1-1.4 2"/><path d="M12 17h.01"/>',
  commitment: '<path d="M9 5h6M9 3h6v4H9z"/><path d="M6 5H4v16h16V5h-2"/><path d="m8 13 2 2 5-5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  book: '<path d="M4 5a3 3 0 0 1 3-2h5v16H7a3 3 0 0 0-3 2z"/><path d="M20 5a3 3 0 0 0-3-2h-5v16h5a3 3 0 0 1 3 2z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  quality: '<path d="m12 3 2.4 4.8L20 9l-4 3.9.9 5.6L12 16l-4.9 2.5.9-5.6L4 9l5.6-1.2z"/><path d="m9.8 12 1.4 1.4 3-3"/>',
  gauge: '<path d="M4 15a8 8 0 1 1 16 0"/><path d="m12 15 4-4"/><path d="M8 19h8"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/>',
  pin: '<path d="m9 3 6 6"/><path d="m14 4 6 6-4 2-4 4-2 4-6-6 4-2 4-4z"/><path d="m5 19 4-4"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M5 3 2 6M19 3l3 3"/>',
  approve: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="m16 14 2 2 4-4"/>',
  package: '<path d="m12 3 8 4-8 4-8-4z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4z"/><path d="M12 11v10"/>',
  siren: '<path d="M7 16v-5a5 5 0 0 1 10 0v5"/><path d="M5 16h14v4H5z"/><path d="M12 2v2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4M2 12h2M20 12h2"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>',
  folder: '<path d="M3 6h7l2 2h9v11H3z"/><path d="M8 13h8M8 16h5"/>',
  evidence: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/><path d="M8 12h8M12 8v8"/>',
  alert: '<path d="M12 3 2 21h20z"/><path d="M12 9v5M12 18h.01"/>',
  task: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="m5 12 1 1 2-2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h3M8 18h6"/>',
  phone: '<path d="M5 4h4l2 5-2 2a15 15 0 0 0 4 4l2-2 5 2v4c0 1-1 2-2 2C9 20 4 15 3 6c0-1 1-2 2-2z"/>',
  users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 7 0"/>',
  note: '<path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  focus: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  presence: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><circle cx="19" cy="5" r="2"/>',
  translate: '<path d="M4 5h8M8 3v2M6 5c0 4 2 7 6 9M11 5c-1 4-3 7-7 9"/><path d="m14 21 4-10 4 10M15.5 17h5"/>',
  media: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 20"/>',
} as const

const COMMANDS: CommandDefinition[] = [
  { title: "Brief conversation live", category: "Intelligence", icon: "brief" },
  { title: "Matrice de réponses", category: "Intelligence", icon: "messages" },
  { title: "Questions sans réponse", category: "Intelligence", icon: "question" },
  { title: "Registre des engagements", category: "Intelligence", icon: "commitment" },
  { title: "Intelligence objections", category: "Intelligence", icon: "shield" },
  { title: "Garde-fou tonalité", category: "Qualité", icon: "quality" },
  { title: "Chapitres de conversation", category: "Mémoire", icon: "book" },
  { title: "Replay exécutif", category: "Mémoire", icon: "history" },
  { title: "Trajectoire sentiment & risque", category: "Intelligence", icon: "trend" },
  { title: "Contrôle qualité réponse", category: "Qualité", icon: "quality" },
  { title: "Scorecard relationnelle", category: "Intelligence", icon: "gauge" },
  { title: "Prochaine meilleure action", category: "Action", icon: "route" },
  { title: "Épingler un jalon", category: "Mémoire", icon: "pin" },
  { title: "Créer une relance", category: "Action", icon: "alarm" },
  { title: "Demander validation", category: "Gouvernance", icon: "approve" },
  { title: "Paquet de transfert", category: "Collaboration", icon: "package" },
  { title: "War room d’escalade", category: "Gouvernance", icon: "siren" },
  { title: "Créer une opportunité", category: "Conversion", icon: "briefcase" },
  { title: "Créer un dossier métier", category: "Conversion", icon: "folder" },
  { title: "Marquer comme preuve", category: "Gouvernance", icon: "evidence" },
  { title: "Signaler un défaut qualité", category: "Qualité", icon: "alert" },
  { title: "Créer une tâche", category: "Action", icon: "task" },
  { title: "Planifier une réunion", category: "Action", icon: "calendar" },
  { title: "Planifier un rappel", category: "Action", icon: "phone" },
  { title: "Attribuer ou transférer", category: "Collaboration", icon: "users" },
  { title: "Ajouter une note interne", category: "Collaboration", icon: "note" },
  { title: "Mode focus", category: "Navigation", icon: "focus" },
  { title: "Rechercher dans la conversation", category: "Navigation", icon: "search" },
  { title: "Présence opérateurs", category: "Collaboration", icon: "presence" },
  { title: "Historique relationnel", category: "Mémoire", icon: "history" },
]

function normalize(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function iconSvg(name: keyof typeof ICONS) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
}

function smallestTextElement(root: ParentNode, text: string): HTMLElement | null {
  const needle = normalize(text)
  const candidates = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span,button,div"))
    .filter((element) => normalize(element.textContent).includes(needle))
    .filter((element) => element.getBoundingClientRect().width > 0)
    .sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0))
  return candidates[0] || null
}

function modalPanelFor(title: HTMLElement): HTMLElement {
  const dialog = title.closest<HTMLElement>('[role="dialog"]')
  if (dialog) return dialog

  let current: HTMLElement | null = title.parentElement
  let best = title.parentElement || title
  while (current && current !== document.body) {
    const rect = current.getBoundingClientRect()
    const style = window.getComputedStyle(current)
    const radius = Number.parseFloat(style.borderRadius || "0")
    const background = style.backgroundColor
    const isSurface = rect.width >= 360 && rect.height >= 160 && radius >= 14 && background !== "rgba(0, 0, 0, 0)"
    if (isSurface) best = current
    if (style.position === "fixed" && rect.width > window.innerWidth * 0.8) break
    current = current.parentElement
  }
  return best
}

function markModal(titleText: string, className: string) {
  const title = smallestTextElement(document, titleText)
  if (!title) return
  const panel = modalPanelFor(title)
  panel.classList.add("ac-premium-modal", className)
  title.classList.add("ac-modal-title")
  title.setAttribute("data-ac-modal-title", "true")

  const eyebrow = title.previousElementSibling as HTMLElement | null
  if (eyebrow) eyebrow.classList.add("ac-modal-eyebrow")

  const description = title.parentElement?.querySelector<HTMLElement>("p:not(.ac-modal-eyebrow)")
  if (description && description !== title) description.classList.add("ac-modal-description")
}

function closestCard(element: HTMLElement, root: HTMLElement): HTMLElement {
  const directButton = element.closest<HTMLElement>("button")
  if (directButton && root.contains(directButton)) return directButton

  let current: HTMLElement | null = element
  while (current && current !== root) {
    const rect = current.getBoundingClientRect()
    const style = getComputedStyle(current)
    if (rect.width > 180 && rect.height > 72 && Number.parseFloat(style.borderRadius || "0") >= 12) {
      return current
    }
    current = current.parentElement
  }
  return element
}

function commonAncestor(elements: HTMLElement[], root: HTMLElement): HTMLElement | null {
  if (!elements.length) return null
  const ancestors: HTMLElement[] = []
  let cursor: HTMLElement | null = elements[0]
  while (cursor && cursor !== root) {
    ancestors.push(cursor)
    cursor = cursor.parentElement
  }
  return ancestors.find((candidate) => elements.every((element) => candidate.contains(element))) || null
}

function enhanceCommandModal() {
  const title = smallestTextElement(document, "30 commandes professionnelles")
  if (!title) return
  const panel = modalPanelFor(title)
  panel.classList.add("ac-premium-modal", "ac-command-modal")
  title.classList.add("ac-modal-title")
  title.setAttribute("data-ac-modal-title", "true")

  const cards: HTMLElement[] = []
  for (const command of COMMANDS) {
    const label = smallestTextElement(panel, command.title)
    if (!label) continue
    const card = closestCard(label, panel)
    card.classList.add("ac-command-card")
    card.dataset.commandTitle = command.title
    card.dataset.commandCategory = command.category
    label.classList.add("ac-command-card-title")

    if (!card.querySelector(".ac-command-icon")) {
      const icon = document.createElement("span")
      icon.className = "ac-command-icon"
      icon.innerHTML = iconSvg(command.icon)
      card.prepend(icon)
    }

    const category = Array.from(card.querySelectorAll<HTMLElement>("span,p"))
      .find((element) => normalize(element.textContent) === normalize(command.category))
    if (category) category.classList.add("ac-command-category")
    cards.push(card)
  }

  const grid = commonAncestor(cards, panel)
  if (grid) {
    grid.classList.add("ac-command-grid")
    if (!panel.querySelector(".ac-command-search")) {
      const search = document.createElement("label")
      search.className = "ac-command-search"
      search.innerHTML = `${iconSvg("search")}<input type="search" autocomplete="off" aria-label="Rechercher une commande professionnelle" placeholder="Rechercher une commande, une action ou un objectif…"><span>${cards.length || 30} commandes</span>`
      grid.parentElement?.insertBefore(search, grid)
      const input = search.querySelector("input")
      input?.addEventListener("input", () => {
        const query = normalize(input.value)
        for (const card of cards) {
          const visible = !query || normalize(card.textContent).includes(query)
          card.hidden = !visible
        }
      })
    }
  }

  const categoryNames = ["Toutes", "Intelligence", "Mémoire", "Qualité", "Action", "Gouvernance", "Collaboration", "Conversion", "Navigation"]
  for (const category of categoryNames) {
    const chip = smallestTextElement(panel, category)
    if (chip && chip.closest("button")) chip.closest("button")?.classList.add("ac-command-filter")
  }
}

function enhanceProvisioningModal() {
  markModal("Ouvrir une conversation", "ac-provisioning-modal")
}

function applyBadgeContrast() {
  const elements = Array.from(document.querySelectorAll<HTMLElement>("span,button,div"))
  for (const element of elements) {
    if (element.children.length > 3) continue
    const rect = element.getBoundingClientRect()
    if (!rect.width || rect.width > 260 || rect.height > 70) continue
    const text = normalize(element.textContent)
    if (text === "attente client") element.classList.add("ac-status-waiting")
    if (["livre", "lu", "resolue", "resolu"].includes(text)) element.classList.add("ac-status-success")
    if (["nouvelle", "normal", "normale"].includes(text)) element.classList.add("ac-status-neutral")
    if (["erreur", "critique", "echec"].includes(text)) element.classList.add("ac-status-critical")
  }
}

function findTheatre() {
  const queueLabel = smallestTextElement(document, "Smart Relationship Queue")
  if (!queueLabel) return null
  const queue = queueLabel.closest<HTMLElement>("aside") || queueLabel.parentElement?.parentElement || null
  if (!queue) return null

  let section = queue.closest<HTMLElement>("section")
  if (!section) {
    let cursor: HTMLElement | null = queue.parentElement
    while (cursor && cursor !== document.body) {
      if (cursor.querySelector("main") && cursor.querySelectorAll("aside").length >= 2) {
        section = cursor
        break
      }
      cursor = cursor.parentElement
    }
  }
  if (!section) return null

  const main = section.querySelector<HTMLElement>("main")
  const asides = Array.from(section.querySelectorAll<HTMLElement>(":scope > aside"))
  const intelligence = asides.find((aside) => aside !== queue) || null
  if (!main || !intelligence) return null
  return { section, queue, main, intelligence }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}

function storedWidth(key: string, fallback: number) {
  const value = Number.parseInt(localStorage.getItem(key) || "", 10)
  return Number.isFinite(value) ? value : fallback
}

function installResizableTheatre() {
  const theatre = findTheatre()
  if (!theatre || theatre.section.dataset.acResizable === "true") return

  const { section, queue, main, intelligence } = theatre
  section.dataset.acResizable = "true"
  section.classList.add("ac-resizable-theatre")
  queue.classList.add("ac-theatre-queue")
  main.classList.add("ac-theatre-chat")
  intelligence.classList.add("ac-theatre-intelligence")

  let queueWidth = storedWidth(QUEUE_KEY, 340)
  let intelligenceWidth = storedWidth(INTELLIGENCE_KEY, 350)

  const leftHandle = document.createElement("div")
  leftHandle.className = "ac-resize-handle ac-resize-handle-left"
  leftHandle.tabIndex = 0
  leftHandle.setAttribute("role", "separator")
  leftHandle.setAttribute("aria-label", "Redimensionner la liste des conversations")
  leftHandle.setAttribute("aria-orientation", "vertical")
  leftHandle.innerHTML = '<span aria-hidden="true"></span>'

  const rightHandle = document.createElement("div")
  rightHandle.className = "ac-resize-handle ac-resize-handle-right"
  rightHandle.tabIndex = 0
  rightHandle.setAttribute("role", "separator")
  rightHandle.setAttribute("aria-label", "Redimensionner le panneau d’intelligence")
  rightHandle.setAttribute("aria-orientation", "vertical")
  rightHandle.innerHTML = '<span aria-hidden="true"></span>'

  section.insertBefore(leftHandle, main)
  section.insertBefore(rightHandle, intelligence)

  const apply = () => {
    if (window.innerWidth < 1280) {
      section.style.removeProperty("grid-template-columns")
      return
    }
    const available = section.getBoundingClientRect().width
    const minimumChat = 560
    queueWidth = clamp(queueWidth, 280, Math.min(520, Math.max(280, available - minimumChat - intelligenceWidth - 16)))
    intelligenceWidth = clamp(intelligenceWidth, 300, Math.min(520, Math.max(300, available - minimumChat - queueWidth - 16)))
    section.style.gridTemplateColumns = `${queueWidth}px 8px minmax(${minimumChat}px, 1fr) 8px ${intelligenceWidth}px`
    leftHandle.setAttribute("aria-valuenow", String(queueWidth))
    rightHandle.setAttribute("aria-valuenow", String(intelligenceWidth))
    localStorage.setItem(QUEUE_KEY, String(queueWidth))
    localStorage.setItem(INTELLIGENCE_KEY, String(intelligenceWidth))
    localStorage.setItem(LAYOUT_KEY, LAYOUT_VERSION)
  }

  const drag = (handle: HTMLElement, side: "left" | "right") => {
    handle.addEventListener("pointerdown", (event) => {
      if (window.innerWidth < 1280) return
      event.preventDefault()
      handle.setPointerCapture(event.pointerId)
      document.body.classList.add("ac-is-resizing")
      const startX = event.clientX
      const startQueue = queueWidth
      const startIntelligence = intelligenceWidth

      const move = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX
        if (side === "left") queueWidth = startQueue + delta
        else intelligenceWidth = startIntelligence - delta
        apply()
      }

      const finish = () => {
        document.body.classList.remove("ac-is-resizing")
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", finish)
        window.removeEventListener("pointercancel", finish)
      }

      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", finish)
      window.addEventListener("pointercancel", finish)
    })

    handle.addEventListener("dblclick", () => {
      if (side === "left") queueWidth = 340
      else intelligenceWidth = 350
      apply()
    })

    handle.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return
      event.preventDefault()
      if (event.key === "Home") {
        if (side === "left") queueWidth = 340
        else intelligenceWidth = 350
      } else {
        const direction = event.key === "ArrowRight" ? 1 : -1
        if (side === "left") queueWidth += direction * 20
        else intelligenceWidth -= direction * 20
      }
      apply()
    })
  }

  drag(leftHandle, "left")
  drag(rightHandle, "right")
  const resizeObserver = new ResizeObserver(apply)
  resizeObserver.observe(section)
  window.addEventListener("resize", apply, { passive: true })
  apply()
}

function markMessageTheatre() {
  const theatre = findTheatre()
  if (!theatre) return
  const { main } = theatre
  main.style.containerType = "inline-size"

  const candidates = Array.from(main.querySelectorAll<HTMLElement>("div,article"))
  for (const element of candidates) {
    const text = normalize(element.textContent)
    if (text.length < 18) continue
    if (element.querySelector("textarea,input")) continue
    const rect = element.getBoundingClientRect()
    if (rect.width < 180 || rect.height < 42) continue
    const style = getComputedStyle(element)
    const radius = Number.parseFloat(style.borderRadius || "0")
    if (radius < 10) continue
    const background = style.backgroundColor
    const dark = /rgb\((?:0|[1-4]?\d),\s*(?:0|[1-4]?\d),\s*(?:0|[1-6]?\d)\)/.test(background)
    const hasMessageMetadata = /(livre|lu|contact|sales agent|auteur|août|aout|\d{1,2}:\d{2})/.test(text)
    if (!hasMessageMetadata) continue
    element.classList.add("ac-message-bubble")
    element.classList.toggle("ac-message-outbound", dark)
    element.classList.toggle("ac-message-inbound", !dark)
  }
}

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    :root {
      --ac-ink: #071126;
      --ac-ink-soft: #25324a;
      --ac-border: #dbe3ef;
      --ac-surface: #ffffff;
      --ac-pearl: #f5f7fb;
      --ac-rose: #f43f6e;
      --ac-shadow: 0 28px 90px rgba(7, 17, 38, .20);
    }

    .ac-premium-modal {
      color: var(--ac-ink) !important;
      border: 1px solid rgba(148, 163, 184, .34) !important;
      box-shadow: var(--ac-shadow) !important;
      background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%) !important;
    }
    .ac-premium-modal .ac-modal-title,
    .ac-premium-modal [data-ac-modal-title="true"] {
      color: var(--ac-ink) !important;
      opacity: 1 !important;
      font-weight: 900 !important;
      letter-spacing: -.035em !important;
      text-shadow: none !important;
    }
    .ac-premium-modal .ac-modal-eyebrow {
      color: #42516b !important;
      opacity: 1 !important;
      font-weight: 900 !important;
      letter-spacing: .16em !important;
    }
    .ac-premium-modal .ac-modal-description {
      color: #4b5b73 !important;
      opacity: 1 !important;
      font-weight: 650 !important;
    }
    .ac-provisioning-modal {
      max-width: 720px !important;
      border-radius: 30px !important;
      overflow: hidden !important;
    }
    .ac-provisioning-modal input,
    .ac-provisioning-modal select,
    .ac-provisioning-modal textarea {
      color: #0f172a !important;
      background: #fff !important;
      border-color: #cbd5e1 !important;
      min-height: 44px;
    }
    .ac-provisioning-modal input::placeholder {
      color: #7b8aa1 !important;
      opacity: 1 !important;
    }

    .ac-command-modal {
      width: min(1180px, calc(100vw - 64px)) !important;
      max-width: 1180px !important;
      height: min(850px, calc(100dvh - 80px)) !important;
      max-height: calc(100dvh - 80px) !important;
      border-radius: 32px !important;
      overflow: auto !important;
      background:
        radial-gradient(circle at 92% 2%, rgba(244, 63, 110, .10), transparent 24%),
        radial-gradient(circle at 8% 8%, rgba(37, 99, 235, .08), transparent 26%),
        linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%) !important;
      scrollbar-gutter: stable;
    }
    .ac-command-modal::before {
      content: "";
      display: block;
      position: sticky;
      top: 0;
      height: 4px;
      z-index: 80;
      background: linear-gradient(90deg, #071126, #2563eb 45%, #f43f6e);
    }
    .ac-command-modal .ac-command-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)) !important;
      gap: 14px !important;
      align-items: stretch !important;
      padding-bottom: 22px !important;
    }
    .ac-command-search {
      position: sticky;
      top: 4px;
      z-index: 70;
      display: grid;
      grid-template-columns: 20px 1fr auto;
      align-items: center;
      gap: 12px;
      margin: 14px 0 18px;
      padding: 12px 14px;
      border: 1px solid #d7e0ed;
      border-radius: 18px;
      color: #52617a;
      background: rgba(255,255,255,.94);
      box-shadow: 0 12px 34px rgba(15, 23, 42, .08);
      backdrop-filter: blur(18px);
    }
    .ac-command-search svg {
      width: 18px;
      height: 18px;
    }
    .ac-command-search input {
      width: 100%;
      border: 0;
      outline: 0;
      color: var(--ac-ink);
      background: transparent;
      font-size: 13px;
      font-weight: 750;
    }
    .ac-command-search input::placeholder {
      color: #8190a5;
      opacity: 1;
    }
    .ac-command-search span {
      color: #31415a;
      font-size: 10px;
      font-weight: 900;
      white-space: nowrap;
    }
    .ac-command-filter {
      color: #1d2a40 !important;
      background: #fff !important;
      border-color: #d7dfeb !important;
      font-weight: 850 !important;
      box-shadow: 0 5px 16px rgba(15, 23, 42, .04);
    }
    .ac-command-filter:hover,
    .ac-command-filter[aria-pressed="true"],
    .ac-command-filter[class*="bg-slate-950"] {
      color: #fff !important;
      background: #071126 !important;
      border-color: #071126 !important;
    }
    .ac-command-card {
      position: relative !important;
      min-height: 146px !important;
      padding: 22px 20px 18px 76px !important;
      border: 1px solid #dbe3ef !important;
      border-radius: 22px !important;
      color: var(--ac-ink) !important;
      background:
        linear-gradient(145deg, rgba(255,255,255,.98), rgba(246,249,253,.98)) !important;
      box-shadow: 0 10px 28px rgba(15, 23, 42, .06) !important;
      transform: translateY(0);
      transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease !important;
      overflow: hidden;
    }
    .ac-command-card::after {
      content: "";
      position: absolute;
      right: -34px;
      bottom: -42px;
      width: 104px;
      height: 104px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(37,99,235,.10), transparent 68%);
      pointer-events: none;
    }
    .ac-command-card:hover,
    .ac-command-card:focus-within {
      transform: translateY(-3px);
      border-color: #aabbd2 !important;
      box-shadow: 0 18px 44px rgba(15, 23, 42, .12) !important;
    }
    .ac-command-card[hidden] {
      display: none !important;
    }
    .ac-command-card-title {
      color: var(--ac-ink) !important;
      opacity: 1 !important;
      font-size: 13px !important;
      line-height: 1.25 !important;
      font-weight: 900 !important;
    }
    .ac-command-card p,
    .ac-command-card span {
      opacity: 1;
    }
    .ac-command-icon {
      position: absolute;
      left: 18px;
      top: 18px;
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      color: #fff;
      border-radius: 15px;
      background: linear-gradient(145deg, #111d34, #020617);
      box-shadow: 0 10px 22px rgba(2, 6, 23, .20);
      z-index: 2;
    }
    .ac-command-icon svg {
      width: 20px;
      height: 20px;
    }
    .ac-command-category {
      display: inline-flex !important;
      align-items: center !important;
      width: fit-content !important;
      padding: 5px 9px !important;
      border: 1px solid #d9e2ef !important;
      border-radius: 999px !important;
      color: #31415a !important;
      background: #eef3f9 !important;
      font-size: 8px !important;
      font-weight: 900 !important;
      letter-spacing: .08em !important;
      text-transform: uppercase !important;
    }

    .ac-status-waiting {
      color: #172033 !important;
      background: #fff4c2 !important;
      border-color: #e7b928 !important;
      font-weight: 900 !important;
      opacity: 1 !important;
      text-shadow: none !important;
      box-shadow: 0 4px 12px rgba(180, 130, 0, .12);
    }
    .ac-status-waiting svg {
      color: #172033 !important;
      stroke: #172033 !important;
    }
    .ac-status-success {
      color: #064e3b !important;
      background: #ddfbea !important;
      border-color: #74dba6 !important;
      font-weight: 900 !important;
      opacity: 1 !important;
      text-shadow: none !important;
    }
    .ac-status-success svg {
      color: #047857 !important;
      stroke: #047857 !important;
    }
    .ac-status-neutral {
      color: #1e293b !important;
      background: #f1f5f9 !important;
      border-color: #cbd5e1 !important;
      font-weight: 850 !important;
      opacity: 1 !important;
    }
    .ac-status-critical {
      color: #881337 !important;
      background: #ffe4e9 !important;
      border-color: #fda4b8 !important;
      font-weight: 900 !important;
      opacity: 1 !important;
    }

    .ac-resizable-theatre {
      min-width: 0 !important;
      align-items: stretch !important;
    }
    .ac-theatre-queue,
    .ac-theatre-chat,
    .ac-theatre-intelligence {
      min-width: 0 !important;
      overflow: hidden;
    }
    .ac-theatre-chat {
      container-type: inline-size;
    }
    .ac-resize-handle {
      position: relative;
      z-index: 35;
      display: grid;
      place-items: center;
      width: 8px;
      min-width: 8px;
      height: 100%;
      cursor: col-resize;
      touch-action: none;
      outline: none;
      background: transparent;
    }
    .ac-resize-handle::before {
      content: "";
      position: absolute;
      inset: 0 -5px;
    }
    .ac-resize-handle span {
      width: 2px;
      height: 54px;
      border-radius: 999px;
      background: #dbe3ef;
      transition: width .16s ease, height .16s ease, background .16s ease, box-shadow .16s ease;
    }
    .ac-resize-handle:hover span,
    .ac-resize-handle:focus-visible span,
    body.ac-is-resizing .ac-resize-handle span {
      width: 3px;
      height: 88px;
      background: linear-gradient(180deg, #2563eb, #f43f6e);
      box-shadow: 0 0 0 4px rgba(37,99,235,.08), 0 0 18px rgba(244,63,110,.28);
    }
    body.ac-is-resizing {
      cursor: col-resize !important;
      user-select: none !important;
    }
    body.ac-is-resizing * {
      cursor: col-resize !important;
    }

    .ac-message-bubble {
      max-width: min(88%, 980px) !important;
      width: fit-content !important;
    }
    .ac-message-outbound {
      margin-left: auto !important;
    }
    .ac-message-inbound {
      margin-right: auto !important;
    }
    @container (min-width: 760px) {
      .ac-message-bubble { max-width: min(80%, 980px) !important; }
    }
    @container (min-width: 1040px) {
      .ac-message-bubble { max-width: min(74%, 1040px) !important; }
    }
    @container (min-width: 1380px) {
      .ac-message-bubble { max-width: min(70%, 1120px) !important; }
    }

    @media (max-width: 1279px) {
      .ac-resize-handle { display: none !important; }
      .ac-command-modal {
        width: calc(100vw - 28px) !important;
        max-height: calc(100dvh - 28px) !important;
      }
    }
    @media (max-width: 720px) {
      .ac-command-modal .ac-command-grid {
        grid-template-columns: 1fr !important;
      }
      .ac-command-card {
        min-height: 130px !important;
      }
      .ac-command-search {
        grid-template-columns: 18px 1fr;
      }
      .ac-command-search > span {
        display: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .ac-command-card,
      .ac-resize-handle span {
        transition: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

let enhancementQueued = false
function enhance() {
  enhancementQueued = false
  injectStyle()
  enhanceProvisioningModal()
  enhanceCommandModal()
  applyBadgeContrast()
  installResizableTheatre()
  markMessageTheatre()
}

function queueEnhancement() {
  if (enhancementQueued) return
  enhancementQueued = true
  window.requestAnimationFrame(enhance)
}

function install() {
  if (window[INSTALL_FLAG]) return
  window[INSTALL_FLAG] = true
  injectStyle()
  queueEnhancement()

  const observer = new MutationObserver(queueEnhancement)
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "aria-pressed", "data-state"],
  })

  window.addEventListener("resize", queueEnhancement, { passive: true })
  window.addEventListener("popstate", queueEnhancement, { passive: true })
}

if (typeof window !== "undefined") {
  window.queueMicrotask(install)
}

export {}
