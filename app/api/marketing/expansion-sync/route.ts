import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>

function rows(value: any): Row[] {
  return Array.isArray(value) ? value : []
}

function first(row: Row, keys: string[], fallback = '—'): string {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key])
    }
  }
  return fallback
}

async function safeSelect(table: string, limit = 80) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select('*').limit(limit)
    if (error) return []
    return rows(data)
  } catch {
    return []
  }
}

function item(row: Row, href: string, titleKeys = ['title', 'name', 'keyword', 'slug'], statusKeys = ['status', 'stage', 'state'], metricKeys = ['score', 'priority', 'traffic', 'rank'] ) {
  return {
    title: first(row, titleKeys, 'Untitled live record'),
    status: first(row, statusKeys, 'live'),
    owner: first(row, ['owner', 'assigned_to', 'author', 'manager'], ''),
    metric: first(row, metricKeys, ''),
    href,
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const role = String(user.role || '').toLowerCase()
  const permissions = Array.isArray(user.permissions) ? user.permissions : []
  const allowed = ['ceo', 'admin', 'direction', 'marketing'].includes(role) || permissions.includes('*') || permissions.includes('marketing.home') || permissions.includes('market_os.view')

  if (!allowed) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const [
    keywords,
    blogPosts,
    seoPages,
    contentTasks,
    ambassadors,
    ambassadorApplications,
    ambassadorTasks,
    partnerships,
  ] = await Promise.all([
    safeSelect('marketing_keywords'),
    safeSelect('blog_posts'),
    safeSelect('seo_pages'),
    safeSelect('content_tasks'),
    safeSelect('ambassadors'),
    safeSelect('ambassador_applications'),
    safeSelect('ambassador_tasks'),
    safeSelect('partnerships'),
  ])

  return NextResponse.json({
    ok: true,
    loadedAt: new Date().toISOString(),
    seo: {
      keywords: keywords.length,
      blogPosts: blogPosts.length,
      seoPages: seoPages.length,
      contentTasks: contentTasks.length,
      articles: [...blogPosts, ...contentTasks].slice(0, 8).map((row) => item(row, '/market-os/content-command-center', ['title', 'name', 'topic', 'slug'], ['status', 'stage'], ['score', 'priority'])),
      keywordBoard: keywords.slice(0, 8).map((row) => item(row, '/market-os/seo-blog-workspace', ['keyword', 'title', 'name'], ['status', 'intent'], ['rank', 'volume', 'difficulty'])),
      technicalQueue: seoPages.slice(0, 8).map((row) => item(row, '/market-os/seo-blog-workspace', ['url', 'slug', 'title', 'name'], ['status', 'index_status'], ['score', 'rank'])),
    },
    ambassadors: {
      ambassadors: ambassadors.length,
      applications: ambassadorApplications.length,
      tasks: ambassadorTasks.length,
      partnerships: partnerships.length,
      activeBoard: ambassadors.slice(0, 8).map((row) => item(row, '/market-os/ambassadors', ['full_name', 'name', 'title'], ['status', 'stage'], ['score', 'city'])),
      applicationQueue: ambassadorApplications.slice(0, 8).map((row) => item(row, '/market-os/ambassadors', ['full_name', 'name', 'candidate_name'], ['status', 'stage'], ['score', 'city'])),
      activationTasks: [...ambassadorTasks, ...partnerships].slice(0, 8).map((row) => item(row, '/market-os/partners-network', ['title', 'name', 'company', 'partner_name'], ['status', 'stage'], ['priority', 'value'])),
    },
  })
}
