'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

interface Props {
  onClose: () => void
  onVerified: (session: { accessToken: string; email: string; usedToday: number }) => void
  initialEmail?: string
}

const USE_CASES = [
  { value: 'goodie-bags',      label: 'Goodie bags' },
  { value: 'gift-boxes',       label: 'Gift boxes' },
  { value: 'subscription-box', label: 'Subscription boxes' },
  { value: 'general-ecom',     label: 'General e-commerce' },
  { value: 'other',            label: 'Other' },
]

const PLATFORMS = [
  { value: 'shopify',   label: 'Shopify' },
  { value: 'etsy',      label: 'Etsy' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok Shop' },
  { value: 'none',      label: 'Not selling yet' },
  { value: 'other',     label: 'Other' },
]

const MONTHLY_PHOTOS = [
  { value: '<10',    label: 'Under 10 / month' },
  { value: '10-50',  label: '10 – 50 / month' },
  { value: '50-200', label: '50 – 200 / month' },
  { value: '200+',   label: '200+ / month' },
]

export default function SignupModal({ onClose, onVerified, initialEmail = '' }: Props) {
  const [step, setStep] = useState<'form' | 'otp'>(initialEmail ? 'otp' : 'form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState(initialEmail)
  const [useCase, setUseCase]           = useState('')
  const [useCaseOther, setUseCaseOther] = useState('')
  const [platform, setPlatform]         = useState('')
  const [platformOther, setPlatformOther] = useState('')
  const [monthlyPhotos, setMonthlyPhotos] = useState('')
  const [consent, setConsent]           = useState(false)

  // OTP step
  const [otp, setOtp] = useState('')

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName, email, use_case: useCase,
          use_case_other: useCaseOther || null,
          platform, platform_other: platformOther || null,
          monthly_photos: monthlyPhotos, consent,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sign up failed')

      // Trigger OTP from the browser so the PKCE code verifier lives in localStorage
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: { shouldCreateUser: true },
      })
      if (otpError) throw new Error(otpError.message || 'Failed to send verification code')

      setStep('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setLoading(true)
    setError(null)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: { shouldCreateUser: false },
      })
      if (otpError) throw new Error(otpError.message || 'Failed to resend code')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const normalizedEmail = email.toLowerCase().trim()
      console.log('[verifyOtp] attempting', { email: normalizedEmail, otpLength: otp.length })

      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp,
        type: 'email',
      })

      console.log('[verifyOtp] result | error:', authError?.message ?? 'none', '| status:', authError?.status ?? '-', '| hasSession:', !!authData?.session, '| hasUser:', !!authData?.user)

      if (authError || !authData.session) {
        throw new Error(authError?.message || 'Invalid or expired code')
      }

      // Send the access token to our server to mark the lead verified + get usage count
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authData.session.access_token, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')

      onVerified({
        accessToken: authData.session.access_token,
        email: email.toLowerCase().trim(),
        usedToday: data.usedToday,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(26,23,20,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: "'DM Mono', monospace",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FDFAF5', borderRadius: 14, padding: '28px 28px 24px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1714', marginBottom: 4 }}>
            {step === 'form' ? 'Unlock 10 free removes / day' : 'Check your email'}
          </div>
          <div style={{ fontSize: 11, color: '#7A7066', lineHeight: 1.5 }}>
            {step === 'form'
              ? "You've used your free preview. Sign up to get 10 BG removals per day — free."
              : `We sent a 6-digit code to ${email}`}
          </div>
        </div>

        {error && (
          <div style={{
            marginBottom: 14, padding: '8px 10px',
            background: '#FEF2F2', borderRadius: 6,
            fontSize: 11, color: '#DC2626',
          }}>
            {error}
          </div>
        )}

        {/* ── FORM STEP ────────────────────────────────────────────── */}
        {step === 'form' && (
          <form onSubmit={handleSubmitForm}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Your name">
                <input
                  type="text" required value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  style={inputStyle}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </Field>

              <Field label="What do you sell?">
                <select required value={useCase} onChange={e => setUseCase(e.target.value)} style={inputStyle}>
                  <option value="">— select —</option>
                  {USE_CASES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {useCase === 'other' && (
                  <input
                    type="text" value={useCaseOther} onChange={e => setUseCaseOther(e.target.value)}
                    placeholder="Tell us more…" style={{ ...inputStyle, marginTop: 6 }}
                  />
                )}
              </Field>

              <Field label="Where do you sell?">
                <select required value={platform} onChange={e => setPlatform(e.target.value)} style={inputStyle}>
                  <option value="">— select —</option>
                  {PLATFORMS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {platform === 'other' && (
                  <input
                    type="text" value={platformOther} onChange={e => setPlatformOther(e.target.value)}
                    placeholder="Tell us more…" style={{ ...inputStyle, marginTop: 6 }}
                  />
                )}
              </Field>

              <Field label="Photos per month (approx.)">
                <select required value={monthlyPhotos} onChange={e => setMonthlyPhotos(e.target.value)} style={inputStyle}>
                  <option value="">— select —</option>
                  {MONTHLY_PHOTOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 2 }}>
                <input
                  type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#4A7C6F', flexShrink: 0 }}
                />
                <span style={{ fontSize: 10, color: '#7A7066', lineHeight: 1.5 }}>
                  I agree to receive occasional product updates. No spam — unsubscribe anytime.
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading} style={primaryBtn(loading)}>
              {loading ? 'Sending code…' : 'Continue →'}
            </button>
          </form>
        )}

        {/* ── OTP STEP ─────────────────────────────────────────────── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6,8}"
              maxLength={8}
              required
              autoFocus
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              style={{
                ...inputStyle,
                fontSize: 22, textAlign: 'center',
                letterSpacing: 8, fontWeight: 600,
                marginBottom: 14,
              }}
            />

            <button type="submit" disabled={loading || otp.length < 6} style={primaryBtn(loading || otp.length < 6)}>
              {loading ? 'Verifying…' : 'Verify & unlock'}
            </button>

            <div style={{ marginTop: 14, fontSize: 10, color: '#7A7066', textAlign: 'center' }}>
              Didn't get it?{' '}
              <button
                type="button" onClick={handleResend} disabled={loading}
                style={{ background: 'none', border: 'none', color: '#4A7C6F', cursor: 'pointer', fontSize: 10, padding: 0, textDecoration: 'underline' }}
              >
                Resend code
              </button>
              {' · '}
              <button
                type="button" onClick={() => { setStep('form'); setOtp(''); setError(null) }}
                style={{ background: 'none', border: 'none', color: '#4A7C6F', cursor: 'pointer', fontSize: 10, padding: 0, textDecoration: 'underline' }}
              >
                Change email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#7A7066', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 10px', fontSize: 12,
  border: '1px solid #D4C9BE', borderRadius: 6,
  background: '#FAF7F2', color: '#1A1714',
  fontFamily: "'DM Mono', monospace",
  outline: 'none',
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    marginTop: 18, width: '100%', padding: '10px 0',
    background: disabled ? '#A8BDB9' : '#4A7C6F',
    color: '#fff', border: 'none', borderRadius: 7,
    fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'DM Mono', monospace",
    transition: 'background 0.15s',
  }
}