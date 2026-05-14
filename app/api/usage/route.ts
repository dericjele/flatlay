import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const db = createServiceClient()
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user?.email) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { count } = await db
    .from('flatlay_usage')
    .select('*', { count: 'exact', head: true })
    .eq('email', user.email)
    .eq('success', true)
    .gte('created_at', startOfDay.toISOString())

  const dailyCap = parseInt(process.env.NEXT_PUBLIC_DAILY_BG_LIMIT ?? '10', 10)
  return NextResponse.json({ usedToday: count ?? 0, dailyCap })
}
