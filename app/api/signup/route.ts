import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwaway.email',
  'yopmail.com', 'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net',
  'dispostable.com', 'fakeinbox.com', 'maildrop.cc', '10minutemail.com',
  'tempinbox.com', 'discard.email', 'sharklasers.com', 'grr.la',
])

function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim()
  const at = lower.lastIndexOf('@')
  if (at === -1) return lower
  const local = lower.slice(0, at).split('+')[0]
  const domain = lower.slice(at + 1)
  return `${local}@${domain}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, email, use_case, use_case_other, platform, platform_other, monthly_photos, consent } = body

    if (!full_name?.trim() || !email?.trim() || !use_case || !platform || !monthly_photos || !consent) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const emailNormalized = normalizeEmail(email)
    const domain = emailNormalized.split('@')[1]

    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json({ error: 'Please use a real email address' }, { status: 400 })
    }

    const db = createServiceClient()

    // Upsert so re-submissions from returning users don't error
    const { error: dbError } = await db.from('flatlay_leads').upsert({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      email_normalized: emailNormalized,
      email_verified: false,
      use_case,
      use_case_other: use_case_other || null,
      platform,
      platform_other: platform_other || null,
      monthly_photos,
      consent: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email_normalized' })

    if (dbError) {
      console.error('signup db error:', dbError)
      return NextResponse.json({ error: 'Failed to save signup' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('signup route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
