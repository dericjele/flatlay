import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase-server'

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex')
}

function getIp(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function checkAnonLimit(clientId: string, ipHash: string): Promise<boolean> {
  const db = createServiceClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count: byClient } = await db
    .from('flatlay_usage')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .is('email', null)
    .eq('success', true)

  if ((byClient ?? 0) >= 2) return false

  const { count: byIp } = await db
    .from('flatlay_usage')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .is('email', null)
    .eq('success', true)
    .gte('created_at', since)

  if ((byIp ?? 0) >= 3) return false

  return true
}

async function checkDailyLimit(email: string): Promise<{ allowed: boolean; usedToday: number }> {
  const db = createServiceClient()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { count } = await db
    .from('flatlay_usage')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', true)
    .gte('created_at', startOfDay.toISOString())

  const usedToday = count ?? 0
  const dailyCap = parseInt(process.env.NEXT_PUBLIC_DAILY_BG_LIMIT ?? '10', 10)
  return { allowed: usedToday < dailyCap, usedToday, dailyCap }
}

async function logUsage(params: {
  clientId: string
  ipHash: string
  shadowMode: string | null
  success: boolean
  email?: string | null
}) {
  const db = createServiceClient()
  await db.from('flatlay_usage').insert({
    client_id: params.clientId,
    ip_hash: params.ipHash,
    action: 'remove-bg',
    shadow_mode: params.shadowMode,
    success: params.success,
    email: params.email ?? null,
  })
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PHOTOROOM_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PHOTOROOM_API_KEY not configured. Add it to .env.local' },
        { status: 500 }
      )
    }

    const clientId = req.headers.get('x-client-id') ?? 'unknown'
    const ipHash = hashIp(getIp(req))

    // ── Authenticated user check ───────────────────────────────────────────────
    let userEmail: string | null = null
    const authHeader = req.headers.get('authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const db = createServiceClient()
      const { data: { user } } = await db.auth.getUser(token)
      if (user?.email) {
        userEmail = user.email
        const { allowed, usedToday } = await checkDailyLimit(userEmail)
        if (!allowed) {
          return NextResponse.json(
            { error: 'Daily limit reached. Come back tomorrow.', code: 'DAILY_LIMIT', usedToday },
            { status: 403 }
          )
        }
      }
    }

    // ── Anonymous check (only if no valid auth) ────────────────────────────────
    if (!userEmail) {
      const allowed = await checkAnonLimit(clientId, ipHash)
      if (!allowed) {
        return NextResponse.json(
          { error: 'Free limit reached. Sign up to continue.', code: 'ANON_LIMIT' },
          { status: 403 }
        )
      }
    }

    // ── Call PhotoRoom ─────────────────────────────────────────────────────────
    const formData = await req.formData()
    const shadowMode = formData.get('_shadowMode') as string | null
    formData.delete('_shadowMode')

    const withShadow = shadowMode && shadowMode !== 'none'

    let url: string
    let photoRoomForm: FormData

    if (withShadow) {
      url = 'https://image-api.photoroom.com/v2/edit'
      photoRoomForm = new FormData()
      photoRoomForm.append('imageFile', formData.get('image_file') as Blob)
      photoRoomForm.append('shadow.mode', shadowMode)
      photoRoomForm.append('background.color', 'transparent')
      photoRoomForm.append('export.format', 'png')
    } else {
      url = 'https://sdk.photoroom.com/v1/segment'
      photoRoomForm = formData
    }

    const photoRoomRes = await fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: photoRoomForm,
    })

    if (!photoRoomRes.ok) {
      const errText = await photoRoomRes.text()
      await logUsage({ clientId, ipHash, shadowMode, success: false, email: userEmail })
      return NextResponse.json(
        { error: `PhotoRoom API error ${photoRoomRes.status}: ${errText}` },
        { status: photoRoomRes.status }
      )
    }

    await logUsage({ clientId, ipHash, shadowMode, success: true, email: userEmail })

    const imageBuffer = await photoRoomRes.arrayBuffer()
    const contentType = photoRoomRes.headers.get('content-type') || 'image/png'

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('remove-bg route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
