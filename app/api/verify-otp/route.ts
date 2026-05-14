import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { accessToken, email: rawEmail } = await req.json()
    if (!accessToken || !rawEmail) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const email = rawEmail.toLowerCase().trim()
    console.log('[verify-otp] received', { email, tokenPrefix: accessToken?.slice(0, 20) })

    const db = createServiceClient()

    const { data: { user }, error } = await db.auth.getUser(accessToken)
    console.log('[verify-otp] getUser result', {
      error: error ? { message: error.message, status: error.status } : null,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
    })

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Mark lead as verified
    await db
      .from('flatlay_leads')
      .update({ email_verified: true, auth_user_id: user.id, updated_at: new Date().toISOString() })
      .eq('email', email)

    // Return today's usage count so the client can initialise the counter
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { count: usedToday } = await db
      .from('flatlay_usage')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('success', true)
      .gte('created_at', startOfDay.toISOString())

    const dailyCap = parseInt(process.env.NEXT_PUBLIC_DAILY_BG_LIMIT ?? '10', 10)
    return NextResponse.json({ ok: true, usedToday: usedToday ?? 0, dailyCap })
  } catch (err) {
    console.error('verify-otp route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
